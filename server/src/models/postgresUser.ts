import { DatabaseError, type QueryResult } from 'pg';

import AppError from '../errors/AppError.js';
import type { User, UserWithHash } from '../schemas/userSchema.js';
import query from './postgres.js';

// raw PostgreSQL user row
type UserRow = {
  id: number;
  username: string;
  created_at: Date;
};

// Expand UserRow to include hash (using an intersection type)
type UserRowWithHash = UserRow & {
  password_hash: string;
};

// createUser() — Insert a new user into PostgreSQL and returns the user without the hash
export async function createUser(
  username: string,
  passwordHash: string,
): Promise<User> {
  const sqlQuery = `
        INSERT INTO users (username, password_hash)
        VALUES($1, $2)
        RETURNING id, username, created_at
    `;

  let result: QueryResult<UserRow>;

  try {
    result = await query<UserRow>(sqlQuery, [username, passwordHash]);
  } catch (err) {
    if (err instanceof DatabaseError && err.code === '23505') {
      throw new AppError('Username already exists', 409, {
        log: 'postgresUser.createUser: Duplicate username',
        cause: err,
      });
    }
    throw err;
  }

  const row = result.rows[0];

  // Normalize PostgreSQL fields to match the shared User type used by both databases.
  return {
    id: String(row.id),
    username: row.username,
    createdAt: row.created_at,
  };
}

// findByUsername() — Retrieve a user by their username. Include the hash for login.
export async function findByUsername(
  username: string,
): Promise<UserWithHash | null> {
  const sqlQuery = `
  SELECT id, username, password_hash, created_at
  FROM users
  WHERE username = $1
`;
  const result = await query<UserRowWithHash>(sqlQuery, [username]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    username: row.username,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

// findById() — Retrieve a user by their ID without the password hash.
export async function findById(id: string): Promise<User | null> {
  const result = await query<{
    id: number;
    username: string;
    created_at: Date;
  }>(
    `SELECT id, username, created_at
     FROM users
     WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return null;
  const user = result.rows[0];

  return {
    id: String(user.id),
    username: user.username,
    createdAt: user.created_at,
  };
}
