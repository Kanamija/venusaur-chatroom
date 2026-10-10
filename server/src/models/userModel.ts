import type { User } from '../schemas/userSchema.js';
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
    throw new AppError('Internal Server Error', 500, {
      log: 'userModel.createUser: MongoDB user model not implemented yet',
    });
  }

  throw new AppError('Internal Server Error', 500, {
    log: 'userModel.createUser: Invalid AUTH_DB',
  });
}
