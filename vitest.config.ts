/**
 * ASTRAL_NOTES Vitest Configuration
 * Enhanced testing configuration for all NovelCrafter features
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: [
      './client/src/__tests__/setup.ts'
    ],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/src/**/*.{ts,js}'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx,js}',
        '**/main.tsx',
        '**/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Test execution
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 4,
    
    // File patterns
    include: [
      'client/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'server/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'
    ],
    
    exclude: [
      'node_modules/',
      'dist/',
      '.idea/',
      '.git/',
      '.cache/'
    ],
    
    // Reporters
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-report.html'
    },
    
    // Watch configuration
    watch: false,
    
    // Pool configuration for parallel testing
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@services': path.resolve(__dirname, './client/src/services'),
      '@hooks': path.resolve(__dirname, './client/src/hooks'),
      '@utils': path.resolve(__dirname, './client/src/utils'),
      '@pages': path.resolve(__dirname, './client/src/pages'),
      '@server': path.resolve(__dirname, './server/src')
    }
  },
  
  // Build configuration for tests
  esbuild: {
    target: 'node14'
  }
});