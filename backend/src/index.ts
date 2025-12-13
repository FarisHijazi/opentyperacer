import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import { authRouter } from './routes/auth';
import { tracksRouter } from './routes/tracks';
import { roomsRouter } from './routes/rooms';
import { setupSocketHandlers } from './socket';

const app = express();
const httpServer = createServer(app);

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// CORS configuration
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json());

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/rooms', roomsRouter);

// Setup socket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

httpServer.listen(PORT, () => {
  console.log(`OpenTypeRacer server running on port ${PORT}`);
});
