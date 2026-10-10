import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { globalErrorHandler } from './errors/globalErrorHandler.js';
import userRoutes from './routes/userRoutes.js';

const authDb = process.env.AUTH_DB;
if (authDb !== 'postgres') throw new Error('Invalid AUTH_DB');

try {
  if (authDb === 'postgres') await import('./models/postgres.js');
} catch (err) {
  console.error('Database initialization failed:', err);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    // This matches the Vite frontend dev server
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Socket.io connection handling (note: 'connect', 'not connect')
io.on('connect', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join_room', (roomId: string) => {
    if (typeof roomId !== 'string' || roomId.trim().length === 0) {
      socket.emit('error', { message: 'A non-empty room ID is required' });
      return;
    }
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Handle sending a message
  socket.on(
    'send_message',
    async (data: { roomId: string; content: string }) => {
      try {
        if (
          !data ||
          typeof data.roomId !== 'string' ||
          data.roomId.trim().length === 0 ||
          typeof data.content !== 'string' ||
          data.content.trim().length === 0
        ) {
          socket.emit('error', { message: 'Invalid message payload' });
          return;
        }

        //! NOTE: userId will be populated from the verified token (Eddie's auth task)
        //! and saved to MongoDB first (Kanami's history task).
        const messagePayload = {
          roomId: data.roomId,
          content: data.content,
          timestamp: new Date(),
        };

        console.log(`Message in ${data.roomId}:`, messagePayload);

        // Broadcast to everyone in the room
        io.to(data.roomId).emit('receive_message', messagePayload);
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    },
  );

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// User Routes
app.use('/api/users', userRoutes);

// Global Express error handler
app.use(globalErrorHandler);

// Listen on the httpServer (which includes Express + Socket.io)
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost: ${PORT}`);
});
