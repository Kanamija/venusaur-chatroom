import type { RequestHandler } from 'express';
import { z } from 'zod';
import { credentialsSchema } from '../schemas/userSchema.js';
import AppError from '../errors/AppError.js';
import bcrypt from 'bcryptjs';
import { createUser } from '../models/postgresUser.js';

// signup() — Validate credentials and create a new user.
export const signup: RequestHandler = async (req, res, next) => {
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
