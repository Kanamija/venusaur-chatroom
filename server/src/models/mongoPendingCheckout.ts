import { Schema, model } from 'mongoose';
import { isDuplicateKeyError } from './mongoErrors.js';

// At most one Stripe Checkout per user per premium room.
// The unique index below is what stops two tabs (or a double click) from
// creating two payable sessions: only one insert can win the slot.
//
// The row is created *before* we call Stripe and holds the idempotency key
// for that call. Any request can repeat the call with the same key and Stripe
// hands back the same session, so a slow, crashed or failed request never
// leads to a second session.
const pendingCheckoutSchema = new Schema(
  {
    userId: { type: String, required: true },
    roomName: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    // Filled in once Stripe has created the session.
    stripeSessionId: { type: String },
    url: { type: String },
    // When the Stripe session stops accepting payment (we send this to Stripe).
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pendingCheckoutSchema.index({ userId: 1, roomName: 1 }, { unique: true });
// Housekeeping: MongoDB deletes a row a day after its session expired.
// Checkout is card-only, so an expired session can never charge anyone.
pendingCheckoutSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 },
);

const PendingCheckout = model('PendingCheckout', pendingCheckoutSchema);

export interface PendingCheckoutRecord {
  idempotencyKey: string;
  stripeSessionId?: string;
  url?: string;
  expiresAt: Date;
}

// findPendingCheckout() — The user's outstanding checkout for this room, if any.
export async function findPendingCheckout(
  userId: string,
  roomName: string,
): Promise<PendingCheckoutRecord | null> {
  const doc = await PendingCheckout.findOne({ userId, roomName }).lean();
  if (!doc) return null;
  return {
    idempotencyKey: doc.idempotencyKey,
    stripeSessionId: doc.stripeSessionId ?? undefined,
    url: doc.url ?? undefined,
    expiresAt: doc.expiresAt,
  };
}

// claimPendingCheckout() — Atomically take the slot. Returns false if another
// request already holds it (MongoDB rejects the duplicate insert with E11000).
export async function claimPendingCheckout(
  userId: string,
  roomName: string,
  idempotencyKey: string,
  expiresAt: Date,
): Promise<boolean> {
  try {
    await PendingCheckout.create({
      userId,
      roomName,
      idempotencyKey,
      expiresAt,
    });
    return true;
  } catch (err) {
    if (isDuplicateKeyError(err)) return false;
    throw err;
  }
}

// savePendingCheckoutSession() — Store the Stripe session on the slot, but only
// if the slot still belongs to the same idempotency key.
export async function savePendingCheckoutSession(
  userId: string,
  roomName: string,
  idempotencyKey: string,
  session: { stripeSessionId: string; url: string },
): Promise<void> {
  await PendingCheckout.updateOne(
    { userId, roomName, idempotencyKey },
    { $set: session },
  );
}

// deletePendingCheckout() — Free the slot, but only if it is still the one we
// looked at, so we never delete a newer checkout by mistake.
export async function deletePendingCheckout(
  userId: string,
  roomName: string,
  idempotencyKey: string,
): Promise<void> {
  await PendingCheckout.deleteOne({ userId, roomName, idempotencyKey });
}

// clearPendingCheckoutForSession() — Used by the webhook once a session is
// paid (room unlocked) or its payment failed (user may try again).
export async function clearPendingCheckoutForSession(
  stripeSessionId: string,
): Promise<void> {
  await PendingCheckout.deleteOne({ stripeSessionId });
}

export { PendingCheckout };
