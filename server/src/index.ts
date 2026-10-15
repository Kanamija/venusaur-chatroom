import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { connectToDatabase } from './db/connect.js';

import { globalErrorHandler } from './errors/globalErrorHandler.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { verifySocketSession } from './controllers/socketAuthController.js';
import { registerChatHandlers } from './sockets/chatEventHandlers.js';

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
    credentials: true,
  },
});

const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Authenticate Socket.IO connections.
io.use(verifySocketSession);

// Socket.io event handlers
registerChatHandlers(io);

// User Routes
app.use('/api/users', userRoutes);

// Room Routes
app.use('/api/rooms', roomRoutes);

// Global Express error handler
app.use(globalErrorHandler);

async function start() {
  await connectToDatabase();

  // Listen on the httpServer (which includes Express + Socket.io)
  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
