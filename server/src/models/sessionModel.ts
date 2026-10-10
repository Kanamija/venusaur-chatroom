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
    throw new AppError('Internal Server Error', 500, {
      log: 'sessionModel.createSession: MongoDB session model not implemented yet',
    });
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
    throw new AppError('Internal Server Error', 500, {
      log: 'sessionModel.findSession: MongoDB session model not implemented yet',
    });
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
    throw new AppError('Internal Server Error', 500, {
      log: 'sessionModel.deleteSession: MongoDB session model not implemented yet',
    });
  }
  throw new AppError('Internal Server Error', 500, {
    log: 'sessionModel.deleteSession: Unsupported AUTH_DB',
  });
}
