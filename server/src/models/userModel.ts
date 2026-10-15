import type { User, UserWithHash } from '../schemas/userSchema.js';
import AppError from '../errors/AppError.js';

// createUser() — Use the database selected by AUTH_DB.
export async function createUser(
  username: string,
  passwordHash: string,
): Promise<User> {
  if (process.env.AUTH_DB === 'postgres') {
    const { createUser } = await import('./postgresUser.js');
    return createUser(username, passwordHash);
  }

  if (process.env.AUTH_DB === 'mongodb') {
    const { createUser } = await import('./mongoUser.js');
    return createUser(username, passwordHash);
  }

  throw new AppError('Internal Server Error', 500, {
    log: 'userModel.createUser: Invalid AUTH_DB',
  });
}

// findByUsername() — Use the database selected by AUTH_DB.
export async function findByUsername(
  username: string,
): Promise<UserWithHash | null> {
  if (process.env.AUTH_DB === 'postgres') {
    const { findByUsername } = await import('./postgresUser.js');
    return findByUsername(username);
  }

  if (process.env.AUTH_DB === 'mongodb') {
    const { findByUsername } = await import('./mongoUser.js');
    return findByUsername(username);
  }

  throw new AppError('Internal Server Error', 500, {
    log: 'userModel.findByUsername: Invalid AUTH_DB',
  });
}

// findById() — Retrieve a user by their ID.
export async function findById(id: string): Promise<User | null> {
  if (process.env.AUTH_DB === 'postgres') {
    const { findById } = await import('./postgresUser.js');
    return findById(id);
  }
  if (process.env.AUTH_DB === 'mongodb') {
    const { findById } = await import('./mongoUser.js');
    return findById(id);
  }
  throw new AppError('Internal Server Error', 500, {
    log: 'userModel.findById: Unsupported AUTH_DB',
  });
}
