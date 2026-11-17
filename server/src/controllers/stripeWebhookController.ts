import type { RequestHandler } from 'express';
import type Stripe from 'stripe';
import { isPremiumRoom } from '../constants/rooms.js';
import { grantRoomAccess } from '../models/mongoRoomAccess.js';
import {
  markEventProcessed,
  unmarkEventProcessed,
} from '../models/mongoProcessedStripeEvent.js';
import { getStripe } from '../stripe/stripeClient.js';

export interface StripeWebhookDeps {
  getWebhookSecret: () => string | undefined;
  constructEvent: (
    payload: Buffer,
    signature: string,
    secret: string,
  ) => Stripe.Event;
  markEventProcessed: (eventId: string, type: string) => Promise<boolean>;
  unmarkEventProcessed: (eventId: string) => Promise<void>;
  grantRoomAccess: (
    userId: string,
    roomName: string,
    stripeSessionId: string,
  ) => Promise<void>;
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
    if (event.type !== 'checkout.session.completed') {
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

    // Record the event first. A duplicate delivery stops here.
    const isFirstDelivery = await deps.markEventProcessed(event.id, event.type);
    if (!isFirstDelivery) {
      console.log(`stripeWebhook: ${event.id} already processed; skipping`);
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    try {
      await deps.grantRoomAccess(userId, roomName, session.id);
    } catch (err) {
      // Un-record the event and return 500 so Stripe retries it later.
      await deps.unmarkEventProcessed(event.id).catch(() => {});
      console.error('stripeWebhook: Failed to grant room access:', err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to process event' });
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
  unmarkEventProcessed,
  grantRoomAccess,
});
