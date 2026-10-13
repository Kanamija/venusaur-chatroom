import type { Server } from 'socket.io';
import { roomNameSchema, sendMessageSchema } from '../schemas/messageSchema.js';
import { saveMessage } from '../models/mongoMessage.js';

export function registerChatHandlers(io: Server) {
  io.on('connect', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('join_room', (roomId: unknown) => {
      const result = roomNameSchema.safeParse(roomId);

      if (!result.success) {
        socket.emit('error', { message: 'Unknown room' });
        return;
      }
      socket.join(result.data);
      console.log(`Socket ${socket.id} joined room: ${result.data}`);
    });

    socket.on('send_message', async (data: unknown) => {
      try {
        const result = sendMessageSchema.safeParse(data);

        if (!result.success) {
          socket.emit('error', { message: 'Invalid message payload' });
          return;
        }

        // TODO(Eddie): replace with the logged-in user from the session
        const user = { userId: 'placeholder', username: 'Guest' };

        const savedMessage = await saveMessage({ ...result.data, ...user });
        io.to(savedMessage.roomId).emit('receive_message', savedMessage);
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
