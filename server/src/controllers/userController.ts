import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { type User, credentialsSchema } from '../schemas/userSchema.js';
import { createUser, findByUsername } from '../models/userModel.js';
import AppError from '../errors/AppError.js';

// registerUser() — Validate credentials and create a new user.
export const registerUser: RequestHandler = async (req, res, next) => {
  const result = credentialsSchema.safeParse(req.body);

  if (!result.success) {
    return next(
      new AppError('Invalid signup credentials', 400, {
        log: `userController.signup: Validation failed\n${z.prettifyError(result.error)}`,
      }),
    );
  }

  const { username, password } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser(username, passwordHash);
  res.locals.user = user;
  return next();
};

// authenticateUser() — Validate credentials and verify password.
export const authenticateUser: RequestHandler = async (req, res, next) => {
  const result = credentialsSchema.safeParse(req.body);

  if (!result.success) {
    return next(
      new AppError('Invalid login credentials', 400, {
        log:
          'userController.authenticateUser: Validation failed\n' +
          z.prettifyError(result.error),
      }),
    );
  }

  const { username, password } = result.data;

  const user = await findByUsername(username);
  if (!user)
    throw new AppError('Invalid username or password', 401, {
      log: 'userController.authenticateUser: User not found',
    });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    throw new AppError('Invalid username or password', 401, {
      log: 'userController.authenticateUser: Incorrect password',
    });

  const authenticatedUser: User = {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };

  res.locals.user = authenticatedUser;
  return next();
};
