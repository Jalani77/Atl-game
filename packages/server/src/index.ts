import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameServer } from './game/GameServer.js';
import { Database } from './services/Database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || '3000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: IS_PRODUCTION ? true : CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

if (IS_PRODUCTION) {
  const clientPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const io = new Server(httpServer, {
  cors: {
    origin: IS_PRODUCTION ? true : CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

const db = new Database();
const gameServer = new GameServer(io, db);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await gameServer.shutdown();
  db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await gameServer.shutdown();
  db.close();
  process.exit(0);
});

httpServer.listen(PORT, () => {
  console.log(`Campus Rivals server running on port ${PORT}`);
  console.log(`Environment: ${IS_PRODUCTION ? 'production' : 'development'}`);
  gameServer.start();
});
