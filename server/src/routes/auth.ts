import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { ApiResponse, AuthResponse } from '../types/api.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResponse>>): Promise<Response<ApiResponse<AuthResponse>> | void> => {
  const validatedData = registerSchema.parse(req.body);
  const { email, username, password, firstName, lastName } = validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      }
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user with default preferences
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      preferences: {
        create: {} // Creates with default values from schema
      }
    },
    include: {
      preferences: true
    }
  });

  // Generate JWT
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    logger.error('JWT_SECRET not configured');
    return res.status(500).json({
      success: false,
      error: { message: 'Server configuration error' }
    });
  }

  const token = jwt.sign(
    { userId: user.id },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  logger.info(`User registered: ${user.email}`);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        preferences: user.preferences
      }
    }
  });
}));

// Login endpoint
router.post('/login', asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResponse>>): Promise<Response<ApiResponse<AuthResponse>> | void> => {
  const validatedData = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      preferences: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }

  // Generate JWT
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    logger.error('JWT_SECRET not configured');
    return res.status(500).json({
      success: false,
      error: { message: 'Server configuration error' }
    });
  }

  const token = jwt.sign(
    { userId: user.id },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        preferences: user.preferences
      }
    }
  });
}));

// Token validation endpoint
router.get('/validate', asyncHandler(async (req: Request, res: Response<ApiResponse<any>>): Promise<Response<ApiResponse<any>> | void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'No token provided' }
    });
  }

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      error: { message: 'Server configuration error' }
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        preferences: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token' }
    });
  }
}));

// Refresh token endpoint (stateless refresh based on current valid token)
router.post('/refresh', asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResponse>>): Promise<Response<ApiResponse<AuthResponse>> | void> => {
  const authHeader = req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : undefined;

  const providedRefreshToken = (req.body && (req.body as any).refreshToken) || undefined;

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      error: { message: 'Server configuration error' }
    });
  }

  try {
    // Prefer validating current access token; if missing, try provided refreshToken as a JWT
    const tokenToVerify = bearerToken || providedRefreshToken;
    if (!tokenToVerify) {
      return res.status(401).json({ success: false, error: { message: 'No token provided' } });
    }

    const decoded = jwt.verify(tokenToVerify, jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { preferences: true }
    });
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'User not found' } });
    }

    const newToken = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // For a simple personal app, reuse same token as a pseudo-refresh token
    const newRefreshToken = newToken;

    return res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
}));

export default router;
