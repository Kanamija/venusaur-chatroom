import type { Server } from 'socket.io';
import { roomNameSchema, sendMessageSchema } from '../schemas/messageSchema.js';
import { saveMessage } from '../models/mongoMessage.js';
import { userCanAccessRoom } from '../controllers/roomAccessController.js';

export function registerChatHandlers(io: Server) {
  io.on('connect', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('join_room', async (roomId: unknown) => {
      try {
        const result = roomNameSchema.safeParse(roomId);

        if (!result.success) {
          socket.emit('error', { message: 'Unknown room' });
          return;
        }

        // Premium rooms (e.g. Mewtwo) require a paid unlock before joining.
        if (!(await userCanAccessRoom(socket.data.userId, result.data))) {
          socket.emit('error', {
            message: 'This room is premium. Unlock it to join.',
            code: 'PREMIUM_LOCKED',
            roomId: result.data,
          });
          return;
        }

        for (const joinedRoom of socket.rooms) {
          if (joinedRoom !== socket.id) socket.leave(joinedRoom);
        }
        socket.join(result.data);
        console.log(`Socket ${socket.id} joined room: ${result.data}`);
      } catch (error) {
        console.error('Error handling join_room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('send_message', async (data: unknown) => {
      try {
        const result = sendMessageSchema.safeParse(data);

        if (!result.success) {
          socket.emit('error', { message: 'Invalid message payload' });
          return;
        }

        if (!(await userCanAccessRoom(socket.data.userId, result.data.roomId))) {
          socket.emit('error', {
            message: 'This room is premium. Unlock it to chat.',
            code: 'PREMIUM_LOCKED',
            roomId: result.data.roomId,
          });
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

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
