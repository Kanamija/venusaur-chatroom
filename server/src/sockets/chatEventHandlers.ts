import type { Server } from 'socket.io';
import { roomNameSchema, sendMessageSchema } from '../schemas/messageSchema.js';
import { saveMessage, deleteMessageById } from '../models/mongoMessage.js';

export function registerChatHandlers(io: Server) {
  io.on('connect', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('join_room', (roomId: unknown) => {
      const result = roomNameSchema.safeParse(roomId);

      if (!result.success) {
        socket.emit('error', { message: 'Unknown room' });
        return;
      }
      for (const joinedRoom of socket.rooms) {
        if (joinedRoom !== socket.id) socket.leave(joinedRoom);
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

        const user = {
          userId: socket.data.userId,
          username: socket.data.username,
        };

        const savedMessage = await saveMessage({ ...result.data, ...user });
        io.to(savedMessage.roomId).emit('receive_message', savedMessage);
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Real-time deletion listener
    socket.on(
      'delete_message',
      (data: { messageId: string; roomId: string }) => {
        if (!data?.messageId || !data?.roomId) return;
        io.to(data.roomId).emit('message_deleted', {
          messageId: data.messageId,
          roomId: data.roomId,
        });
      },
    );

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
