import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import type { User, UserWithHash } from '../schemas/userSchema.js';
import AppError from '../errors/AppError.js';

const mongoUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserModel = mongoose.model('User', mongoUserSchema);

// createUser() — Insert a new user into MongoDB and return the user without the hash.
export async function createUser(
  username: string,
  passwordHash: string,
): Promise<User> {
  let user;

  try {
    await UserModel.init();
    user = await UserModel.create({
      username,
      passwordHash,
    });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new AppError('Username already exists', 409, {
        log: 'mongoUser.createUser: Duplicate username',
        cause: err,
      });
    }
    throw err;
  }

  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
}

// findByUsername() — Retrieve a user by their username. Include the hash for login.
export async function findByUsername(
  username: string,
): Promise<UserWithHash | null> {
  const user = await UserModel.findOne({ username });
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
    passwordHash: user.passwordHash,
  };
}

// findById() — Retrieve a user by their ID without the password hash.
export async function findById(id: string): Promise<User | null> {
  const user = await UserModel.findById(id);
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
}
