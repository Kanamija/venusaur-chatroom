import AppError from '../errors/AppError.js';

// createSession() — Save a new session.
export async function createSession(
  sessionId: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  if (process.env.AUTH_DB === 'postgres') {
    const { createSession } = await import('./postgresSession.js');
    return createSession(sessionId, userId, expiresAt);
  }
  if (process.env.AUTH_DB === 'mongodb') {
    const { createSession } = await import('./mongoSession.js');
    return createSession(sessionId, userId, expiresAt);
  }
  throw new AppError('Internal Server Error', 500, {
    log: 'sessionModel.createSession: Unsupported AUTH_DB',
  });
}

// findSession() — Retrieve the user ID associated with a valid session.
export async function findSession(sessionId: string): Promise<string | null> {
  if (process.env.AUTH_DB === 'postgres') {
    const { findSession } = await import('./postgresSession.js');
    return findSession(sessionId);
  }
  if (process.env.AUTH_DB === 'mongodb') {
    const { findSession } = await import('./mongoSession.js');
    return findSession(sessionId);
  }
  throw new AppError('Internal Server Error', 500, {
    log: 'sessionModel.findSession: Unsupported AUTH_DB',
  });
}

// deleteSession() — Remove an existing session.
export async function deleteSession(sessionId: string): Promise<void> {
  if (process.env.AUTH_DB === 'postgres') {
    const { deleteSession } = await import('./postgresSession.js');
    return deleteSession(sessionId);
  }
  if (process.env.AUTH_DB === 'mongodb') {
    const { deleteSession } = await import('./mongoSession.js');
    return deleteSession(sessionId);
  }
  throw new AppError('Internal Server Error', 500, {
    log: 'sessionModel.deleteSession: Unsupported AUTH_DB',
  });
}

// deleteExpiredSessions() — Remove all expired sessions.
export async function deleteExpiredSessions(): Promise<void> {
  if (process.env.AUTH_DB === 'postgres') {
    const postgresSession = await import('./postgresSession.js');
    return postgresSession.deleteExpiredSessions();
  }

  if (process.env.AUTH_DB === 'mongodb') {
    const { deleteExpiredSessions } = await import('./mongoSession.js');
    return deleteExpiredSessions();
  }

  throw new AppError('Unsupported authentication database');
}
