import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export const tracksRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Validation schema
const createTrackSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  text: z.string().min(10).max(2000),
  language: z.string().default('en'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  isPublic: z.boolean().default(true),
});

// Get all public tracks
tracksRouter.get('/', async (req, res) => {
  try {
    const { language, difficulty, search, page = '1', limit = '20' } = req.query;

    const where: any = { isPublic: true };

    if (language && language !== 'all') {
      where.language = language;
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { text: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const tracks = await prisma.raceTrack.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      include: {
        creator: {
          select: { id: true, username: true },
        },
        _count: {
          select: { races: true },
        },
      },
    });

    const total = await prisma.raceTrack.count({ where });

    res.json({
      tracks,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// Get available languages
tracksRouter.get('/languages', async (req, res) => {
  try {
    const languages = await prisma.raceTrack.groupBy({
      by: ['language'],
      _count: { language: true },
      where: { isPublic: true },
    });

    const languageMap: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ar: 'Arabic',
      pt: 'Portuguese',
      it: 'Italian',
      ja: 'Japanese',
      zh: 'Chinese',
      code: 'Code',
    };

    res.json(
      languages.map((l) => ({
        code: l.language,
        name: languageMap[l.language] || l.language,
        count: l._count.language,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get random track
tracksRouter.get('/random', async (req, res) => {
  try {
    const { language } = req.query;

    const where: any = { isPublic: true };
    if (language && language !== 'all') {
      where.language = language;
    }

    const count = await prisma.raceTrack.count({ where });
    const skip = Math.floor(Math.random() * count);

    const track = await prisma.raceTrack.findFirst({
      where,
      skip,
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    if (!track) {
      return res.status(404).json({ error: 'No tracks found' });
    }

    res.json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch random track' });
  }
});

// Get single track
tracksRouter.get('/:id', async (req, res) => {
  try {
    const track = await prisma.raceTrack.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// Create track
tracksRouter.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch {
        // Allow anonymous track creation
      }
    }

    const data = createTrackSchema.parse(req.body);

    const track = await prisma.raceTrack.create({
      data: {
        ...data,
        creatorId: userId,
      },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    res.status(201).json(track);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create track error:', error);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

// Delete track (owner only)
tracksRouter.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const track = await prisma.raceTrack.findUnique({
      where: { id: req.params.id },
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.creatorId !== decoded.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this track' });
    }

    await prisma.raceTrack.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete track' });
  }
});
