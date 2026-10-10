import query from './postgres.js';

// createSession() — Insert a new session for an authenticated user.
export async function createSession(
  sessionId: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt],
  );
}

// findSession() — Retrieve a valid, unexpired session by its ID.
export async function findSession(sessionId: string): Promise<string | null> {
  const result = await query<{ user_id: number }>(
    `SELECT user_id
     FROM sessions
     WHERE id = $1 AND expires_at > NOW()`,
    [sessionId],
  );
  if (result.rows.length === 0) return null;
  return String(result.rows[0].user_id);
}

// deleteSession() — Remove a session by its ID.
export async function deleteSession(sessionId: string): Promise<void> {
  await query(
    `DELETE FROM sessions
     WHERE id = $1`,
    [sessionId],
  );
}
