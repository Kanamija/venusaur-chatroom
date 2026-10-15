import mongoose from 'mongoose';

const mongoSessionSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
});

const SessionModel = mongoose.model('Session', mongoSessionSchema);

// createSession() — Insert a new session for an authenticated user.
export async function createSession(
  sessionId: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  await SessionModel.create({
    _id: sessionId,
    userId,
    expiresAt,
  });
}

// findSession() — Retrieve a valid, unexpired session by its ID.
export async function findSession(sessionId: string): Promise<string | null> {
  const session = await SessionModel.findOne({
    _id: sessionId,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  return session.userId;
}

// deleteSession() — Remove a session by its ID.
export async function deleteSession(sessionId: string): Promise<void> {
  await SessionModel.deleteOne({ _id: sessionId });
}

// deleteExpiredSessions() — Remove all expired sessions.
export async function deleteExpiredSessions(): Promise<void> {
  await SessionModel.deleteMany({
    expiresAt: { $lte: new Date() },
  });
}
