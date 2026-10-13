import type { Server } from 'socket.io';
import { roomNameSchema } from '../schemas/messageSchema.js';

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
  });
}
