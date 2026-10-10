import query from './postgres.js';
import type { User, UserWithHash } from '../schemas/userSchema.js';

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
  const result = await query<UserRow>(sqlQuery, [username, passwordHash]);
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
