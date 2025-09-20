import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './utils/jwt.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import storyRoutes from './routes/stories.js';
import sceneRoutes from './routes/scenes.js';
import noteRoutes from './routes/notes.js';
import characterRoutes from './routes/characters.js';
import locationRoutes from './routes/locations.js';
import timelineRoutes from './routes/timelines.js';
import linkRoutes from './routes/links.js';
import exportRoutes from './routes/exports.js';
import publishingRoutes from './routes/publishing.js';
// import codexRoutes from './routes/codex.js';
// import collaborationRoutes from './routes/collaboration.js';

const app = express();
// Trust proxy for correct client IPs behind reverse proxies (e.g., Vercel)
app.set('trust proxy', 1);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:7891",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:7891",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID when available to avoid easy IP-based bypass and be fair per user
  keyGenerator: (req: any) => {
    try {
      const auth = req.headers['authorization'];
      if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
        const token = auth.replace('Bearer ', '');
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          const decoded: any = jwt.verify(token, jwtSecret);
          if (decoded?.userId) return `user:${decoded.userId}`;
        }
      }
    } catch (_) { /* ignore and fall back to IP */ }
    // Fallback to IP when no token or invalid
    return req.ip;
  },
  skip: (req) => req.path === '/health'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/stories', authMiddleware, storyRoutes);
app.use('/api/scenes', authMiddleware, sceneRoutes);
app.use('/api/notes', authMiddleware, noteRoutes);
app.use('/api/characters', authMiddleware, characterRoutes);
app.use('/api/locations', authMiddleware, locationRoutes);
app.use('/api/timelines', authMiddleware, timelineRoutes);
app.use('/api/links', authMiddleware, linkRoutes);
app.use('/api/exports', exportRoutes); // Enhanced export system with built-in auth
app.use('/api/publishing', authMiddleware, publishingRoutes); // Phase 2D: Professional Publishing
// app.use('/api/codex', authMiddleware, codexRoutes);
// app.use('/api/collaboration', authMiddleware, collaborationRoutes);

// WebSocket handling for real-time collaboration
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured for WebSocket auth');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    logger.error('WebSocket auth error:', error);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId!;
  const user = socket.user!;
  logger.info(`User connected: ${socket.id} (${user.username})`);

  socket.on('join-project', async (projectId: string) => {
    try {
      // Verify user has access to this project
      const projectAccess = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId }
              }
            }
          ]
        }
      });

      if (!projectAccess) {
        socket.emit('error', { message: 'Access denied to project' });
        return;
      }

      socket.join(`project-${projectId}`);
      logger.info(`User ${userId} joined project ${projectId}`);
    } catch (error) {
      logger.error('Error joining project:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  });

  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project-${projectId}`);
    logger.info(`User ${userId} left project ${projectId}`);
  });

  socket.on('scene-update', async (data) => {
    try {
      // Verify user has access to this project
      const projectAccess = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId }
              }
            }
          ]
        }
      });

      if (!projectAccess) {
        socket.emit('error', { message: 'Access denied to project' });
        return;
      }

      socket.to(`project-${data.projectId}`).emit('scene-updated', data);
    } catch (error) {
      logger.error('Error updating scene:', error);
      socket.emit('error', { message: 'Failed to update scene' });
    }
  });

  socket.on('note-update', async (data) => {
    try {
      // Verify user has access to this project
      const projectAccess = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId }
              }
            }
          ]
        }
      });

      if (!projectAccess) {
        socket.emit('error', { message: 'Access denied to project' });
        return;
      }

      socket.to(`project-${data.projectId}`).emit('note-updated', data);
    } catch (error) {
      logger.error('Error updating note:', error);
      socket.emit('error', { message: 'Failed to update note' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id} (${user.username})`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Process terminated');
  });
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export { app, io, prisma };
