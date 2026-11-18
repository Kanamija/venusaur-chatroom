import type { RequestHandler } from 'express';
import type Stripe from 'stripe';
import { isPremiumRoom } from '../constants/rooms.js';
import { grantRoomAccess } from '../models/mongoRoomAccess.js';
import { markEventProcessed } from '../models/mongoProcessedStripeEvent.js';
import { clearPendingCheckoutForSession } from '../models/mongoPendingCheckout.js';
import { getStripe } from '../stripe/stripeClient.js';

export interface StripeWebhookDeps {
  getWebhookSecret: () => string | undefined;
  constructEvent: (
    payload: Buffer,
    signature: string,
    secret: string,
  ) => Stripe.Event;
  markEventProcessed: (eventId: string, type: string) => Promise<boolean>;
  grantRoomAccess: (
    userId: string,
    roomName: string,
    stripeSessionId: string,
  ) => Promise<void>;
  clearPendingCheckout: (stripeSessionId: string) => Promise<void>;
}

// Dependencies are injected so the handler can be tested without Stripe or MongoDB.
export function createStripeWebhookHandler(
  deps: StripeWebhookDeps,
): RequestHandler {
  return async (req, res) => {
    const secret = deps.getWebhookSecret();
    if (!secret) {
      console.error(
        'stripeWebhook: STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen` and copy the whsec_... value into server/.env.',
      );
      res
        .status(500)
        .json({ success: false, message: 'Webhook not configured' });
      return;
    }

    // Verify the signature against the raw body so nobody can fake a payment.
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid webhook request' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = deps.constructEvent(req.body, signature, secret);
    } catch (err) {
      console.warn(
        'stripeWebhook: Signature verification failed:',
        err instanceof Error ? err.message : err,
      );
      res.status(400).json({ success: false, message: 'Invalid signature' });
      return;
    }

    // Acknowledge every event we don't act on so Stripe stops retrying it.
    // checkout.session.completed fires when Checkout finishes. For delayed
    // payment methods (e.g. bank debits) the session can complete as 'unpaid'
    // and the money arrives later as checkout.session.async_payment_succeeded,
    // so both events can unlock the room.
    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded'
    ) {
      res.status(200).json({ received: true });
      return;
    }

    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      res.status(200).json({ received: true });
      return;
    }

    const userId = session.metadata?.userId ?? session.client_reference_id;
    const roomName = session.metadata?.roomName;
    if (!userId || !roomName || !isPremiumRoom(roomName)) {
      console.warn(
        `stripeWebhook: ${event.id} is missing userId/roomName metadata; ignoring`,
      );
      res.status(200).json({ received: true });
      return;
    }

    // 1. Grant access first. This is an idempotent upsert keyed on
    //    { userId, roomName }, so running it again on a retry or a duplicate
    //    delivery never creates a second entitlement.
    // 2. Only then record the event as processed. If the server crashes or
    //    either write fails, we return 500 and Stripe retries, so a paid
    //    room can never be left locked.
    let isFirstDelivery: boolean;
    try {
      await deps.grantRoomAccess(userId, roomName, session.id);
      isFirstDelivery = await deps.markEventProcessed(event.id, event.type);
    } catch (err) {
      console.error('stripeWebhook: Failed to process event:', err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to process event' });
      return;
    }

    // The room is unlocked, so the user's outstanding checkout is no longer needed.
    // Best effort: if this fails, the checkout handler cleans it up on the next click.
    await deps.clearPendingCheckout(session.id).catch((err) => {
      console.warn('stripeWebhook: Could not clear pending checkout:', err);
    });

    if (!isFirstDelivery) {
      console.log(`stripeWebhook: ${event.id} already processed; skipping`);
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    console.log(`stripeWebhook: Unlocked ${roomName} for user ${userId}`);
    res.status(200).json({ received: true });
  };
}

export const handleStripeWebhook = createStripeWebhookHandler({
  getWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET,
  constructEvent: (payload, signature, secret) =>
    getStripe().webhooks.constructEvent(payload, signature, secret),
  markEventProcessed,
  grantRoomAccess,
  clearPendingCheckout: clearPendingCheckoutForSession,
});
