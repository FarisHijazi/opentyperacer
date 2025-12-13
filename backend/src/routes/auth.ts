import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { nanoid } from 'nanoid';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Generate guest user
authRouter.post('/guest', async (req, res) => {
  try {
    const guestId = nanoid(8);
    const username = `Guest_${guestId}`;

    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: {
        username,
        isGuest: true,
        avatarColor: randomColor,
        carColor: randomColor,
      },
    });

    const token = jwt.sign({ userId: user.id, isGuest: true }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        isGuest: user.isGuest,
        avatarColor: user.avatarColor,
        carColor: user.carColor,
      },
      token,
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        avatarColor: randomColor,
        carColor: randomColor,
      },
    });

    const token = jwt.sign({ userId: user.id, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: false,
        avatarColor: user.avatarColor,
        carColor: user.carColor,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: false,
        avatarColor: user.avatarColor,
        carColor: user.carColor,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        raceResults: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            race: {
              include: { track: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest,
      avatarColor: user.avatarColor,
      carColor: user.carColor,
      recentRaces: user.raceResults,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user profile
authRouter.patch('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { username, carColor, avatarColor } = req.body;

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...(username && { username }),
        ...(carColor && { carColor }),
        ...(avatarColor && { avatarColor }),
      },
    });

    res.json({
      id: user.id,
      username: user.username,
      isGuest: user.isGuest,
      avatarColor: user.avatarColor,
      carColor: user.carColor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
