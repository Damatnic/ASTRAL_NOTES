import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../src/utils/logger.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { authMiddleware } from '../src/middleware/auth.js';

// Import routes
import authRoutes from '../src/routes/auth.js';
import userRoutes from '../src/routes/users.js';
import projectRoutes from '../src/routes/projects.js';
import storyRoutes from '../src/routes/stories.js';
import sceneRoutes from '../src/routes/scenes.js';
import noteRoutes from '../src/routes/notes.js';
import characterRoutes from '../src/routes/characters.js';
import locationRoutes from '../src/routes/locations.js';
import timelineRoutes from '../src/routes/timelines.js';
import linkRoutes from '../src/routes/links.js';

// Initialize Express app
const app = express();

// Initialize Prisma with connection pooling for serverless
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting for serverless
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Astral Notes API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  try {
    // Ensure database connection
    await prisma.$connect();
    
    // Add Prisma instance to request for route handlers
    (req as any).prisma = prisma;
    
    // Process the request through Express
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err?: any) => {
        if (err) {
          logger.error('Express app error:', err);
          reject(err);
        } else {
          resolve(void 0);
        }
      });
    });
  } catch (error) {
    logger.error('Serverless function error:', error);
    
    // Ensure database disconnect on error
    await prisma.$disconnect();
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? String(error) : 'Something went wrong'
    });
  }
}

// Graceful shutdown for serverless
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export app for local development
export { app, prisma };