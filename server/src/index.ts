import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

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

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Listen on the httpServer (which includes Express + Socket.io)
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost: ${PORT}`);
});

// app.listen(PORT, () => {
//   console.log(`Server listening on http://localhost:${PORT}`);
// });
