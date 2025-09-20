import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health') {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '3.0.0'
    });
    return;
  }

  // Welcome endpoint
  if (req.url === '/api' || req.url === '/api/') {
    res.status(200).json({
      message: 'ASTRAL_NOTES API v3.0 - The Ultimate Writing Platform',
      features: [
        'AI Writing Mastery',
        'Cross-Platform Excellence', 
        'Community Ecosystem',
        'Enterprise Features'
      ],
      endpoints: {
        health: '/api/health',
        docs: '/api/docs'
      }
    });
    return;
  }

  // Default response for unmatched routes
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'This is a basic API handler. Full backend services are being migrated.',
    timestamp: new Date().toISOString()
  });
}