import Stripe from 'stripe';
import AppError from '../errors/AppError.js';

let stripeClient: Stripe | null = null;

// getStripe() — Lazily create one Stripe client from STRIPE_SECRET_KEY.
// Lazy so the rest of the app still boots if Stripe isn't configured yet.
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new AppError('Internal Server Error', 500, {
        log: 'stripeClient.getStripe: STRIPE_SECRET_KEY is not set in server/.env',
      });
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}
