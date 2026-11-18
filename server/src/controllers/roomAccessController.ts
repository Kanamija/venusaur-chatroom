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
//   1. Already unlocked?               -> 409, nothing to buy.
//   2. Outstanding checkout on record? -> ask Stripe about it:
//        open             -> send the user back to that same session
//        complete & paid  -> unlock now (same idempotent grant as the webhook)
//        expired          -> drop it and start fresh
//   3. Nothing on record -> claim the slot with an atomic insert, then create
//      the Stripe session. A request that loses the race waits briefly and
//      reuses the winner's session instead of creating its own.
// ---------------------------------------------------------------------------

// Stripe requires expires_at to be at least 30 minutes after creation.
// One extra minute keeps us clear of that limit even if clocks drift a little.
const CHECKOUT_LIFETIME_MS = 31 * 60 * 1000;
// A claim that never got a Stripe session (e.g. the server crashed) is abandoned after this.
const CLAIM_TIMEOUT_MS = 30 * 1000;
// How many times to re-read while another request is still creating its session.
const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 300;

export type CheckoutOutcome =
  | { url: string } // Open this Stripe Checkout page
  | { hasAccess: true } // An earlier payment was found and the room is now unlocked
  | { paymentProcessing: true }; // Paid with a method that hasn't cleared yet

export interface CheckoutDeps {
  hasRoomAccess: (userId: string, roomName: string) => Promise<boolean>;
  grantRoomAccess: (
    userId: string,
    roomName: string,
    stripeSessionId: string,
  ) => Promise<void>;
  findPendingCheckout: typeof findPendingCheckout;
  claimPendingCheckout: typeof claimPendingCheckout;
  savePendingCheckoutSession: typeof savePendingCheckoutSession;
  deletePendingCheckout: typeof deletePendingCheckout;
  createStripeSession: (
    params: Stripe.Checkout.SessionCreateParams,
    idempotencyKey: string,
  ) => Promise<Stripe.Checkout.Session>;
  retrieveStripeSession: (id: string) => Promise<Stripe.Checkout.Session>;
  newClaimId: () => string;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

// startOrReuseCheckout() — The decision logic above, with every database and
// Stripe call injected so it can be tested without either.
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

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const pending = await deps.findPendingCheckout(userId, roomName);

    if (pending) {
      // Another request claimed the slot but hasn't saved its session yet.
      if (!pending.stripeSessionId) {
        if (pending.expiresAt.getTime() <= deps.now()) {
          // That request died mid-way: free the slot and try again.
          await deps.deletePendingCheckout(userId, roomName, pending.claimId);
        } else {
          await deps.sleep(RETRY_DELAY_MS);
        }
        continue;
      }

      const session = await deps.retrieveStripeSession(pending.stripeSessionId);

      if (session.status === 'open' && session.url) {
        return { url: session.url }; // Reuse: same session, so only one charge possible.
      }

      if (session.status === 'complete') {
        if (session.payment_status === 'paid') {
          // Paid, but the webhook hasn't unlocked the room yet. Unlock it now.
          await deps.grantRoomAccess(userId, roomName, session.id);
          await deps.deletePendingCheckout(userId, roomName, pending.claimId);
          return { hasAccess: true };
        }
        // Completed with a payment that is still clearing: don't sell it twice.
        return { paymentProcessing: true };
      }

      // Expired (or unusable): drop it and create a fresh one below.
      await deps.deletePendingCheckout(userId, roomName, pending.claimId);
      continue;
    }

    // Nothing outstanding: try to claim the slot. Only one request can win.
    const claimId = deps.newClaimId();
    const claimed = await deps.claimPendingCheckout(
      userId,
      roomName,
      claimId,
      new Date(deps.now() + CLAIM_TIMEOUT_MS),
    );
    if (!claimed) continue; // Lost the race: loop and reuse the winner's session.

    try {
      // The webhook may have unlocked the room between step 1 and our claim.
      if (await deps.hasRoomAccess(userId, roomName)) {
        await deps.deletePendingCheckout(userId, roomName, claimId);
        return { hasAccess: true };
      }

      const room = encodeURIComponent(roomName);
      const session = await deps.createStripeSession(
        {
          mode: 'payment',
          line_items: [{ price: priceId, quantity: 1 }],
          client_reference_id: userId,
          metadata: { userId, roomName },
          success_url: `${clientUrl}/?checkout=success&room=${room}`,
          cancel_url: `${clientUrl}/?checkout=cancelled&room=${room}`,
          expires_at: Math.floor((deps.now() + CHECKOUT_LIFETIME_MS) / 1000),
        },
        // Same key on a network retry means Stripe returns the same session.
        `checkout:${userId}:${roomName}:${claimId}`,
      );
      if (!session.url) {
        throw new AppError('Internal Server Error', 500, {
          log: 'roomAccessController.startOrReuseCheckout: Stripe returned no URL',
        });
      }

      await deps.savePendingCheckoutSession(userId, roomName, claimId, {
        stripeSessionId: session.id,
        url: session.url,
        expiresAt: new Date((session.expires_at ?? 0) * 1000),
      });
      return { url: session.url };
    } catch (err) {
      // Free the slot so the next click can try again.
      await deps
        .deletePendingCheckout(userId, roomName, claimId)
        .catch(() => undefined);
      throw err;
    }
  }

  throw new AppError('Checkout is busy. Please try again.', 503, {
    log: `roomAccessController.startOrReuseCheckout: Gave up waiting for the checkout slot (${roomName})`,
  });
}

const checkoutDeps: CheckoutDeps = {
  hasRoomAccess,
  grantRoomAccess,
  findPendingCheckout,
  claimPendingCheckout,
  savePendingCheckoutSession,
  deletePendingCheckout,
  createStripeSession: (params, idempotencyKey) =>
    getStripe().checkout.sessions.create(params, { idempotencyKey }),
  retrieveStripeSession: (id) => getStripe().checkout.sessions.retrieve(id),
  newClaimId: () => randomUUID(),
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

  // See CheckoutOutcome for the three possible answers.
  res.locals.checkout = await startOrReuseCheckout(checkoutDeps, {
    userId,
    roomName,
    priceId,
    clientUrl,
  });
  return next();
};
