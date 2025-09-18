import { logger } from './logger.js';

let cachedSecret: string | null = null;

export function getJwtSecret(): string | null {
  if (cachedSecret) return cachedSecret;
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    cachedSecret = envSecret;
    return cachedSecret;
  }
  const env = process.env.NODE_ENV || 'development';
  if (env !== 'production') {
    // Provide a non-production fallback to ease local/preview deployments
    cachedSecret = 'insecure-dev-secret-change-me';
    logger.warn('JWT_SECRET not set; using insecure development fallback');
    return cachedSecret;
  }
  return null;
}

