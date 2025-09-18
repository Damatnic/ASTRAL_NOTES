// API Configuration for Astral Notes Client
// Handles both development and production API endpoints

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Get API URL from environment variables
const getApiUrl = (): string => {
  // In production, use relative paths to leverage Vercel routing
  if (isProduction) {
    return import.meta.env.VITE_API_URL || '/api';
  }
  
  // In development, use the full server URL
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
};

// Get WebSocket URL
const getWebSocketUrl = (): string => {
  if (isProduction) {
    // In production, WebSocket will be handled differently (consider Socket.IO with polling)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  // In development, connect directly to the server
  return 'http://localhost:8000';
};

// API Configuration
export const apiConfig = {
  baseURL: getApiUrl(),
  wsURL: getWebSocketUrl(),
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Environment information
export const envConfig = {
  isDevelopment,
  isProduction,
  nodeEnv: import.meta.env.NODE_ENV,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  name: import.meta.env.VITE_APP_NAME || 'Astral Notes',
};

// Feature flags
export const featureFlags = {
  enableAI: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
};

// API Endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  users: {
    me: '/users/me',
    update: '/users/me',
    preferences: '/users/preferences',
  },
  projects: {
    list: '/projects',
    create: '/projects',
    get: (id: string) => `/projects/${id}`,
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    collaborators: (id: string) => `/projects/${id}/collaborators`,
  },
  stories: {
    list: (projectId: string) => `/projects/${projectId}/stories`,
    create: (projectId: string) => `/projects/${projectId}/stories`,
    get: (projectId: string, storyId: string) => `/projects/${projectId}/stories/${storyId}`,
    update: (projectId: string, storyId: string) => `/projects/${projectId}/stories/${storyId}`,
    delete: (projectId: string, storyId: string) => `/projects/${projectId}/stories/${storyId}`,
  },
  scenes: {
    list: (storyId: string) => `/stories/${storyId}/scenes`,
    create: (storyId: string) => `/stories/${storyId}/scenes`,
    get: (sceneId: string) => `/scenes/${sceneId}`,
    update: (sceneId: string) => `/scenes/${sceneId}`,
    delete: (sceneId: string) => `/scenes/${sceneId}`,
  },
  notes: {
    general: '/notes/general',
    project: (projectId: string) => `/projects/${projectId}/notes`,
    story: (storyId: string) => `/stories/${storyId}/notes`,
  },
  characters: {
    list: (projectId: string) => `/projects/${projectId}/characters`,
    create: (projectId: string) => `/projects/${projectId}/characters`,
    get: (characterId: string) => `/characters/${characterId}`,
    update: (characterId: string) => `/characters/${characterId}`,
    delete: (characterId: string) => `/characters/${characterId}`,
  },
  locations: {
    list: (projectId: string) => `/projects/${projectId}/locations`,
    create: (projectId: string) => `/projects/${projectId}/locations`,
    get: (locationId: string) => `/locations/${locationId}`,
    update: (locationId: string) => `/locations/${locationId}`,
    delete: (locationId: string) => `/locations/${locationId}`,
  },
  timelines: {
    list: (projectId: string) => `/projects/${projectId}/timelines`,
    create: (projectId: string) => `/projects/${projectId}/timelines`,
    get: (timelineId: string) => `/timelines/${timelineId}`,
    update: (timelineId: string) => `/timelines/${timelineId}`,
    delete: (timelineId: string) => `/timelines/${timelineId}`,
  },
  links: {
    create: '/links',
    list: '/links',
    delete: (linkId: string) => `/links/${linkId}`,
  },
  health: '/health',
};

// Export default configuration
export default {
  api: apiConfig,
  env: envConfig,
  features: featureFlags,
  endpoints,
};