import express from 'express';
import { connectToDatabase } from './db/connect.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

async function start() {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
