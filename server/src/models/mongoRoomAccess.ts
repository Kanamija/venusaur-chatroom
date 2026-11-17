import { Schema, model } from 'mongoose';
import { isDuplicateKeyError } from './mongoErrors.js';

// One row per user per premium room they have paid for.
const roomAccessSchema = new Schema(
  {
    userId: { type: String, required: true },
    roomName: { type: String, required: true },
    stripeSessionId: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A user can only unlock a given room once.
roomAccessSchema.index({ userId: 1, roomName: 1 }, { unique: true });

const RoomAccess = model('RoomAccess', roomAccessSchema);

// hasRoomAccess() — True if the user has paid for this room.
export async function hasRoomAccess(
  userId: string,
  roomName: string,
): Promise<boolean> {
  return (await RoomAccess.exists({ userId, roomName })) !== null;
}

// grantRoomAccess() — Unlock a room for a user. Safe to call more than once:
// the upsert is keyed on { userId, roomName }, so a second payment or a
// replayed webhook never creates a second row.
export async function grantRoomAccess(
  userId: string,
  roomName: string,
  stripeSessionId: string,
): Promise<void> {
  try {
    await RoomAccess.updateOne(
      { userId, roomName },
      { $setOnInsert: { stripeSessionId } },
      { upsert: true },
    );
  } catch (err) {
    // Two concurrent upserts can race on the unique index; the row exists either way.
    if (isDuplicateKeyError(err)) return;
    throw err;
  }
}

export { RoomAccess };
