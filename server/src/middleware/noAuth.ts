import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

// Middleware that always adds a default user (no authentication required)
export const noAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Always set a default user
  req.user = {
    id: 'default-user',
    email: 'user@personal.app',
    username: 'Writer'
  };
  
  next();
};

// Export with different names for compatibility
export const authenticateToken = noAuthMiddleware;
export const authMiddleware = noAuthMiddleware;
export const optionalAuth = noAuthMiddleware;