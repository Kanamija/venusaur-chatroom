import type { RequestHandler } from 'express';
import { randomBytes } from 'node:crypto';
import type { User } from '../schemas/userSchema.js';
import { createSession, findSession } from '../models/sessionModel.js';
import AppError from '../errors/AppError.js';

// startSession() — Generate a session ID, save it to the database, and set the cookie.
export const startSession: RequestHandler = async (_req, res, next) => {
  const user: User = res.locals.user;

  // Generate a cryptographically secure session ID.
  const sessionId = randomBytes(32).toString('hex');

  // Set the session to expire in 24 hours.
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Save the session to the database.

  await createSession(sessionId, user.id, expiresAt);

  // Set the session cookie.

  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return next();
};

// verifySession() — Check the session cookie and verify the session in the database.
export const verifySession: RequestHandler = async (req, res, next) => {
  const sessionId = req.cookies?.sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    throw new AppError('Unauthorized', 401, {
      log: 'sessionController.verifySession: Missing or invalid session cookie',
    });
  }

  const userId = await findSession(sessionId);
  if (!userId) {
    throw new AppError('Unauthorized', 401, {
      log: 'sessionController.verifySession: Session not found or expired',
    });
  }

  res.locals.userId = userId;
  return next();
};
