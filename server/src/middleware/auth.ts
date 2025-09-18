import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access token required' }
      });
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: { message: 'Server configuration error' }
      });
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
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token' }
    });
  }
};

export const authMiddleware = authenticateToken;

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const jwtSecret = getJwtSecret();
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as { userId: string };
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            username: true,
          }
        });
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
