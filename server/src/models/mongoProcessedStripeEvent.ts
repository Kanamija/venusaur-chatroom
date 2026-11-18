import { Schema, model } from 'mongoose';
import { isDuplicateKeyError } from './mongoErrors.js';

// Stripe can deliver the same webhook event more than once.
// Recording each event ID lets us process every event exactly once.
const processedStripeEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const ProcessedStripeEvent = model(
  'ProcessedStripeEvent',
  processedStripeEventSchema,
);

// markEventProcessed() — Returns true the first time an event ID is seen,
// false if it was already recorded.
export async function markEventProcessed(
  eventId: string,
  type: string,
): Promise<boolean> {
  try {
    await ProcessedStripeEvent.create({ eventId, type });
    return true;
  } catch (err) {
    if (isDuplicateKeyError(err)) return false;
    throw err;
  }
}

export { ProcessedStripeEvent };
