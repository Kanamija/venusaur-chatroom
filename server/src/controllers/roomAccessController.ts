import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type Stripe from 'stripe';
import { roomNameSchema } from '../schemas/messageSchema.js';
import { getPremiumRoomPriceId, isPremiumRoom } from '../constants/rooms.js';
import { grantRoomAccess, hasRoomAccess } from '../models/mongoRoomAccess.js';
import {
  claimPendingCheckout,
  deletePendingCheckout,
  findPendingCheckout,
  savePendingCheckoutSession,
} from '../models/mongoPendingCheckout.js';
import { findSession } from '../models/sessionModel.js';
import { getStripe } from '../stripe/stripeClient.js';
import AppError from '../errors/AppError.js';

// userCanAccessRoom() — Free rooms are open to everyone; premium rooms need a RoomAccess row.
export async function userCanAccessRoom(
  userId: string | undefined,
  roomName: string,
): Promise<boolean> {
  if (!isPremiumRoom(roomName)) return true;
  if (!userId) return false;
  return hasRoomAccess(userId, roomName);
}

// requirePremiumRoomAccess() — Free rooms pass straight through (unchanged behavior).
// Premium rooms require a valid session cookie and a paid unlock.
export const requirePremiumRoomAccess: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const roomName = req.params.id;
  if (!isPremiumRoom(roomName)) return next();

  const sessionId = req.cookies?.sessionId;
  const userId =
    typeof sessionId === 'string' ? await findSession(sessionId) : null;
  if (!userId) {
    throw new AppError('Unauthorized', 401, {
      log: 'roomAccessController.requirePremiumRoomAccess: No valid session',
    });
  }

  if (!(await hasRoomAccess(userId, roomName))) {
    throw new AppError(
      'This room is premium. Unlock it to read messages.',
      403,
    );
  }

  res.locals.userId = userId;
  return next();
};

// getRoomAccess() — { hasAccess, isPremium } for the logged-in user (runs after verifySession).
export const getRoomAccess: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const result = roomNameSchema.safeParse(req.params.id);
  if (!result.success) return next(new AppError('Room not found', 404));

  const roomName = result.data;
  res.locals.roomAccess = {
    isPremium: isPremiumRoom(roomName),
    hasAccess: await userCanAccessRoom(res.locals.userId, roomName),
  };
  return next();
};

// ---------------------------------------------------------------------------
// Checkout: at most one payable Stripe session per user per room.
//
// Without this, two tabs (or clicking Unlock again on the return screen
// before the webhook lands) could each create a session and charge twice.
// The flow for every Unlock click:
//   1. Nothing on record -> claim the slot with an atomic insert that also
//      stores a fresh idempotency key. Only one request can win. Then check
//      access once more, in case the webhook unlocked the room meanwhile.
//   2. Get the session for that slot:
//        session saved   -> ask Stripe for its current status
//        not saved yet   -> call create again with the SAME key. Stripe returns
//                           the same session, even if another request (slow,
//                           crashed or failed to save) made the first call.
//   3. Act on it:
//        open             -> send the user to that same session
//        complete (paid)  -> unlock now (same idempotent grant as the webhook)
//        expired          -> drop the slot and start again at step 1
//
// Checkout is card-only, so a completed session is always paid and there is
// no "payment still processing" state to handle.
// ---------------------------------------------------------------------------

// We don't send expires_at, so Stripe uses its default: 24 hours after the
// session is created. That keeps every retry with the same idempotency key
// sending identical, always-valid parameters. The slot lives a bit longer
// (one extra hour) so it never ends before its Stripe session can.
const SLOT_LIFETIME_MS = 25 * 60 * 60 * 1000;
// Retries while another request is mid-call to Stripe or we lost a claim race.
const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 300;

export type CheckoutOutcome =
  | { url: string } // Open this Stripe Checkout page
  | { hasAccess: true }; // An earlier payment was found and the room is now unlocked

export interface CheckoutDeps {
  grantRoomAccess: (
    userId: string,
    roomName: string,
    stripeSessionId: string,
  ) => Promise<void>;
  findPendingCheckout: typeof findPendingCheckout;
  claimPendingCheckout: typeof claimPendingCheckout;
  hasRoomAccess: (userId: string, roomName: string) => Promise<boolean>;
  savePendingCheckoutSession: typeof savePendingCheckoutSession;
  deletePendingCheckout: typeof deletePendingCheckout;
  createStripeSession: (
    params: Stripe.Checkout.SessionCreateParams,
    idempotencyKey: string,
  ) => Promise<Stripe.Checkout.Session>;
  retrieveStripeSession: (id: string) => Promise<Stripe.Checkout.Session>;
  newIdempotencyKey: () => string;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

// startOrReuseCheckout() — The flow above, with every database and Stripe
// call injected so it can be tested without either.
export async function startOrReuseCheckout(
  deps: CheckoutDeps,
  args: {
    userId: string;
    roomName: string;
    priceId: string;
    clientUrl: string;
  },
): Promise<CheckoutOutcome> {
  const { userId, roomName, priceId, clientUrl } = args;
  const room = encodeURIComponent(roomName);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 1. Find the slot, or claim it.
    let pending = await deps.findPendingCheckout(userId, roomName);
    if (!pending) {
      const record = {
        idempotencyKey: deps.newIdempotencyKey(),
        expiresAt: new Date(deps.now() + SLOT_LIFETIME_MS),
      };
      const claimed = await deps.claimPendingCheckout(
        userId,
        roomName,
        record.idempotencyKey,
        record.expiresAt,
      );
      if (!claimed) continue; // Lost the race: loop and use the winner's slot.

      // The room may have been unlocked after the caller's access check but
      // before our claim (the webhook then deleted the old slot, so we saw
      // none). The webhook grants access BEFORE it deletes the slot, so this
      // recheck after claiming is enough to catch that: free our slot and
      // don't sell the room again.
      if (await deps.hasRoomAccess(userId, roomName)) {
        await deps.deletePendingCheckout(
          userId,
          roomName,
          record.idempotencyKey,
        );
        return { hasAccess: true };
      }
      pending = record;
    }

    // A slot whose session was never saved (no user ever got its URL) and
    // whose time is up can't be paid: drop it and start fresh.
    if (!pending.stripeSessionId && pending.expiresAt.getTime() <= deps.now()) {
      await deps.deletePendingCheckout(
        userId,
        roomName,
        pending.idempotencyKey,
      );
      continue;
    }

    // 2. Get the session for this slot.
    let session: Stripe.Checkout.Session;
    try {
      session = pending.stripeSessionId
        ? await deps.retrieveStripeSession(pending.stripeSessionId)
        : await deps.createStripeSession(
            {
              mode: 'payment',
              // Cards are paid the moment Checkout completes (no delayed methods).
              allowed_payment_method_types: ['card'],
              line_items: [{ price: priceId, quantity: 1 }],
              client_reference_id: userId,
              metadata: { userId, roomName },
              success_url: `${clientUrl}/?checkout=success&room=${room}`,
              cancel_url: `${clientUrl}/?checkout=cancelled&room=${room}`,
              // No expires_at: Stripe's 24h default (see SLOT_LIFETIME_MS).
            },
            pending.idempotencyKey,
          );
    } catch (err) {
      // 409 = another request is using this key right now. Wait for it.
      if ((err as { statusCode?: number }).statusCode === 409) {
        await deps.sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err; // The slot stays, so the next click retries with the same key.
    }

    // Never hand out a session that belongs to someone else or another room.
    if (
      session.metadata?.userId !== userId ||
      session.metadata?.roomName !== roomName
    ) {
      throw new AppError('Internal Server Error', 500, {
        log: `roomAccessController.startOrReuseCheckout: Session ${session.id} does not match ${userId}/${roomName}`,
      });
    }

    // 3. Act on the session's status.
    const stillOpen =
      session.status === 'open' &&
      session.url &&
      (session.expires_at ?? 0) * 1000 > deps.now();
    if (stillOpen) {
      if (!pending.stripeSessionId) {
        await deps.savePendingCheckoutSession(
          userId,
          roomName,
          pending.idempotencyKey,
          { stripeSessionId: session.id, url: session.url! },
        );
      }
      return { url: session.url! }; // Same session, so only one charge possible.
    }

    if (session.status === 'complete' && session.payment_status === 'paid') {
      // Paid, but the webhook hasn't unlocked the room yet. Unlock it now.
      await deps.grantRoomAccess(userId, roomName, session.id);
      await deps.deletePendingCheckout(
        userId,
        roomName,
        pending.idempotencyKey,
      );
      return { hasAccess: true };
    }

    // Expired: nobody can pay it any more. Drop it and create a fresh one.
    await deps.deletePendingCheckout(userId, roomName, pending.idempotencyKey);
  }

  throw new AppError('Checkout is busy. Please try again.', 503, {
    log: `roomAccessController.startOrReuseCheckout: Gave up waiting for the checkout slot (${roomName})`,
  });
}

const checkoutDeps: CheckoutDeps = {
  grantRoomAccess,
  findPendingCheckout,
  claimPendingCheckout,
  hasRoomAccess,
  savePendingCheckoutSession,
  deletePendingCheckout,
  createStripeSession: (params, idempotencyKey) =>
    getStripe().checkout.sessions.create(params, { idempotencyKey }),
  retrieveStripeSession: (id) => getStripe().checkout.sessions.retrieve(id),
  newIdempotencyKey: () => `checkout:${randomUUID()}`,
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// createCheckoutSession() — Start (or reuse) Stripe-hosted Checkout for a premium room (runs after verifySession).
export const createCheckoutSession: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const result = roomNameSchema.safeParse(req.params.id);
  if (!result.success) return next(new AppError('Room not found', 404));

  const roomName = result.data;
  if (!isPremiumRoom(roomName)) {
    return next(new AppError('This room is free', 400));
  }

  const userId: string = res.locals.userId;
  if (await hasRoomAccess(userId, roomName)) {
    return next(new AppError('You already have access to this room', 409));
  }

  const priceId = getPremiumRoomPriceId(roomName);
  if (!priceId) {
    return next(
      new AppError('Internal Server Error', 500, {
        log: `roomAccessController.createCheckoutSession: No Stripe price configured for ${roomName}`,
      }),
    );
  }

  // In production the built client is served by this server, so fall back to our own origin.
  const clientUrl = (
    process.env.CLIENT_URL?.trim() || `${req.protocol}://${req.get('host')}`
  ).replace(/\/+$/, '');

  // See CheckoutOutcome for the two possible answers.
  res.locals.checkout = await startOrReuseCheckout(checkoutDeps, {
    userId,
    roomName,
    priceId,
    clientUrl,
  });
  return next();
};
