import { z } from 'zod';

// userSchema — Database-agnostic user structure.
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  createdAt: z.date(),
});

// User — TypeScript type for a user.
export type User = z.infer<typeof userSchema>;

// Expand User to include hash for login
export type UserWithHash = User & {
  passwordHash: string;
};

// credentialsSchema — Validate username and password.
export const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

// Credentials — TypeScript type for username and password.
export type Credentials = z.infer<typeof credentialsSchema>;
