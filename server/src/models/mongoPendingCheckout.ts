import { Schema, model } from 'mongoose';
import { isDuplicateKeyError } from './mongoErrors.js';

// At most one open Stripe Checkout per user per premium room.
// The unique index below is what stops two tabs (or a double click) from
// creating two payable sessions: only one insert can win the slot.
//
// Lifecycle:
//   'creating' – a request has claimed the slot and is asking Stripe for a session
//   'open'     – the Stripe session exists; other requests reuse its url
// The row is removed when the room is unlocked or the session expires.
const pendingCheckoutSchema = new Schema(
  {
    userId: { type: String, required: true },
    roomName: { type: String, required: true },
    claimId: { type: String, required: true }, // Which request owns this slot
    status: { type: String, enum: ['creating', 'open'], required: true },
    stripeSessionId: { type: String },
    url: { type: String },
    // 'creating': when the claim counts as abandoned. 'open': when the Stripe session expires.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pendingCheckoutSchema.index({ userId: 1, roomName: 1 }, { unique: true });
// MongoDB deletes leftovers a day after they expire, in case nothing else cleans them up.
pendingCheckoutSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 },
);

const PendingCheckout = model('PendingCheckout', pendingCheckoutSchema);

export interface PendingCheckoutRecord {
  claimId: string;
  status: 'creating' | 'open';
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
    claimId: doc.claimId,
    status: doc.status as PendingCheckoutRecord['status'],
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
  claimId: string,
  expiresAt: Date,
): Promise<boolean> {
  try {
    await PendingCheckout.create({
      userId,
      roomName,
      claimId,
      status: 'creating',
      expiresAt,
    });
    return true;
  } catch (err) {
    if (isDuplicateKeyError(err)) return false;
    throw err;
  }
}

// savePendingCheckoutSession() — Store the Stripe session on the slot we claimed.
export async function savePendingCheckoutSession(
  userId: string,
  roomName: string,
  claimId: string,
  session: { stripeSessionId: string; url: string; expiresAt: Date },
): Promise<void> {
  await PendingCheckout.updateOne(
    { userId, roomName, claimId },
    { $set: { status: 'open', ...session } },
  );
}

// deletePendingCheckout() — Free the slot, but only if it is still the claim we
// looked at, so we never delete a newer request's session by mistake.
export async function deletePendingCheckout(
  userId: string,
  roomName: string,
  claimId: string,
): Promise<void> {
  await PendingCheckout.deleteOne({ userId, roomName, claimId });
}

// clearPendingCheckoutForSession() — Used by the webhook once a session is paid.
export async function clearPendingCheckoutForSession(
  stripeSessionId: string,
): Promise<void> {
  await PendingCheckout.deleteOne({ stripeSessionId });
}

export { PendingCheckout };
