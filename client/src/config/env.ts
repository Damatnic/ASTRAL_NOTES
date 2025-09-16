/**
 * Environment Configuration
 * Centralized management of environment variables
 */

// Validate required environment variables
const requiredEnvVars = [
  'VITE_APP_NAME',
] as const;

// Optional environment variables with defaults
const optionalEnvVars = {
  VITE_APP_VERSION: '1.0.0',
  VITE_APP_DESCRIPTION: 'Personal Creative Writing Assistant',
  VITE_AI_MODEL: 'gpt-3.5-turbo',
  VITE_AI_MAX_TOKENS: '1000',
  VITE_AI_TEMPERATURE: '0.7',
  VITE_ENABLE_AI_FEATURES: 'true',
  VITE_ENABLE_ANALYTICS: 'false',
  VITE_ENABLE_DEBUG_MODE: 'false',
  VITE_LOCAL_STORAGE_PREFIX: 'astral_notes_',
  VITE_MAX_STORAGE_SIZE: '50MB',
  VITE_DEV_PORT: '7895',
  VITE_DEV_HOST: 'localhost',
} as const;

// Get environment variable with validation
function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue;
  
  if (!value && requiredEnvVars.includes(key as any)) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
}

// Environment configuration object
export const env = {
  // App Information
  app: {
    name: getEnvVar('VITE_APP_NAME', optionalEnvVars.VITE_APP_NAME),
    version: getEnvVar('VITE_APP_VERSION', optionalEnvVars.VITE_APP_VERSION),
    description: getEnvVar('VITE_APP_DESCRIPTION', optionalEnvVars.VITE_APP_DESCRIPTION),
  },

  // AI Service Configuration
  ai: {
    openaiApiKey: getEnvVar('VITE_OPENAI_API_KEY'),
    anthropicApiKey: getEnvVar('VITE_ANTHROPIC_API_KEY'),
    googleAiApiKey: getEnvVar('VITE_GOOGLE_AI_API_KEY'),
    serviceUrl: getEnvVar('VITE_AI_SERVICE_URL'),
    model: getEnvVar('VITE_AI_MODEL', optionalEnvVars.VITE_AI_MODEL),
    maxTokens: parseInt(getEnvVar('VITE_AI_MAX_TOKENS', optionalEnvVars.VITE_AI_MAX_TOKENS)),
    temperature: parseFloat(getEnvVar('VITE_AI_TEMPERATURE', optionalEnvVars.VITE_AI_TEMPERATURE)),
  },

  // Feature Flags
  features: {
    aiEnabled: getEnvVar('VITE_ENABLE_AI_FEATURES', optionalEnvVars.VITE_ENABLE_AI_FEATURES) === 'true',
    analyticsEnabled: getEnvVar('VITE_ENABLE_ANALYTICS', optionalEnvVars.VITE_ENABLE_ANALYTICS) === 'true',
    debugMode: getEnvVar('VITE_ENABLE_DEBUG_MODE', optionalEnvVars.VITE_ENABLE_DEBUG_MODE) === 'true',
  },

  // Storage Configuration
  storage: {
    prefix: getEnvVar('VITE_LOCAL_STORAGE_PREFIX', optionalEnvVars.VITE_LOCAL_STORAGE_PREFIX),
    maxSize: getEnvVar('VITE_MAX_STORAGE_SIZE', optionalEnvVars.VITE_MAX_STORAGE_SIZE),
  },

  // Development Settings
  dev: {
    port: parseInt(getEnvVar('VITE_DEV_PORT', optionalEnvVars.VITE_DEV_PORT)),
    host: getEnvVar('VITE_DEV_HOST', optionalEnvVars.VITE_DEV_HOST),
  },

  // Production Settings
  prod: {
    url: getEnvVar('VITE_PROD_URL'),
  },

  // External Services
  external: {
    unsplashAccessKey: getEnvVar('VITE_UNSPLASH_ACCESS_KEY'),
    pexelsApiKey: getEnvVar('VITE_PEXELS_API_KEY'),
  },

  // Environment Info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Validation function
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required variables
  requiredEnvVars.forEach(key => {
    if (!import.meta.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Validate AI configuration if AI features are enabled
  if (env.features.aiEnabled) {
    if (!env.ai.openaiApiKey && !env.ai.anthropicApiKey && !env.ai.googleAiApiKey) {
      errors.push('At least one AI API key is required when AI features are enabled');
    }
  }

  // Validate numeric values
  if (isNaN(env.ai.maxTokens) || env.ai.maxTokens <= 0) {
    errors.push('VITE_AI_MAX_TOKENS must be a positive number');
  }

  if (isNaN(env.ai.temperature) || env.ai.temperature < 0 || env.ai.temperature > 2) {
    errors.push('VITE_AI_TEMPERATURE must be a number between 0 and 2');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Debug function to log environment info (only in development)
export function logEnvironmentInfo(): void {
  if (!env.isDevelopment || !env.features.debugMode) return;

  console.group('🌟 Astral Notes - Environment Configuration');
  console.log('App Name:', env.app.name);
  console.log('Version:', env.app.version);
  console.log('Mode:', env.mode);
  console.log('AI Features:', env.features.aiEnabled ? '✅ Enabled' : '❌ Disabled');
  console.log('Analytics:', env.features.analyticsEnabled ? '✅ Enabled' : '❌ Disabled');
  console.log('Debug Mode:', env.features.debugMode ? '✅ Enabled' : '❌ Disabled');
  
  if (env.features.aiEnabled) {
    console.log('AI Services Available:');
    console.log('  - OpenAI:', env.ai.openaiApiKey ? '✅' : '❌');
    console.log('  - Anthropic:', env.ai.anthropicApiKey ? '✅' : '❌');
    console.log('  - Google AI:', env.ai.googleAiApiKey ? '✅' : '❌');
    console.log('  - Model:', env.ai.model);
    console.log('  - Max Tokens:', env.ai.maxTokens);
    console.log('  - Temperature:', env.ai.temperature);
  }
  
  console.groupEnd();
}

// Initialize environment validation
const validation = validateEnvironment();
if (!validation.isValid) {
  console.error('❌ Environment Configuration Errors:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  
  if (env.isDevelopment) {
    console.warn('💡 Please check your .env file and ensure all required variables are set.');
    console.warn('📄 See .env.example for a reference of all available variables.');
  }
}

// Log environment info in development
if (env.isDevelopment) {
  logEnvironmentInfo();
}