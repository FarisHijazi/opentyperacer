import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma, redis } from '../index';
import { nanoid } from 'nanoid';

export const roomsRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Validation schema
const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  maxPlayers: z.number().min(2).max(20).default(8),
  isPrivate: z.boolean().default(false),
});

// Get public rooms
roomsRouter.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        isPrivate: false,
        status: { in: ['waiting', 'countdown'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        host: {
          select: { id: true, username: true },
        },
      },
    });

    // Get player counts from Redis
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const playerCount = await redis.scard(`room:${room.code}:players`);
        return {
          ...room,
          playerCount: playerCount || 0,
        };
      })
    );

    res.json(roomsWithCounts);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by code
roomsRouter.get('/:code', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: {
        host: {
          select: { id: true, username: true, avatarColor: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get players from Redis
    const playerIds = await redis.smembers(`room:${room.code}:players`);
    const playersData = await Promise.all(
      playerIds.map((id) => redis.hgetall(`room:${room.code}:player:${id}`))
    );

    res.json({
      ...room,
      players: playersData.filter((p) => Object.keys(p).length > 0),
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create room
roomsRouter.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch {
        // Allow anonymous room creation
      }
    }

    const data = createRoomSchema.parse(req.body);
    const code = nanoid(6).toUpperCase();

    const room = await prisma.room.create({
      data: {
        code,
        name: data.name,
        maxPlayers: data.maxPlayers,
        isPrivate: data.isPrivate,
        hostId: userId,
      },
      include: {
        host: {
          select: { id: true, username: true },
        },
      },
    });

    // Initialize room in Redis with 1 hour expiry
    await redis.setex(`room:${code}:status`, 3600, 'waiting');

    res.status(201).json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room leaderboard
roomsRouter.get('/:code/leaderboard', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.code.toUpperCase() },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const results = await prisma.raceResult.findMany({
      where: {
        race: {
          roomId: room.id,
        },
      },
      orderBy: { wpm: 'desc' },
      take: 20,
      include: {
        user: {
          select: { id: true, username: true, avatarColor: true },
        },
        race: {
          select: { startedAt: true },
        },
      },
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
