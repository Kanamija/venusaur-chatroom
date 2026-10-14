import type { Socket } from 'socket.io';
import { parseCookie } from 'cookie';
import { findSession } from '../models/sessionModel.js';
import { findById } from '../models/userModel.js';

export async function verifySocketSession(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    // Read and parse cookies from the Socket.IO handshake.
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookie(cookieHeader ?? '');
    const sessionId = cookies.sessionId;

    // Reject connections without a session cookie.
    if (!sessionId) {
      throw new Error('Missing session cookie');
    }

    // Look up the session in the database.
    const userId = await findSession(sessionId);
    if (!userId) {
      throw new Error('Session not found or expired');
    }

    // Retrieve the authenticated user.
    const user = await findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Store the authenticated user's information on the socket.
    socket.data.userId = userId;
    socket.data.username = user.username;

    // Allow the connection.
    return next();
  } catch (error) {
    // Log the error on the server.
    console.error('socketAuthController.verifySocketSession:', error);

    // Reject the connection without exposing internal details.
    return next(new Error('Authentication failed'));
  }
}
