// Vitest Configuration for ASTRAL_NOTES
// Comprehensive testing setup with coverage and performance monitoring

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/testSetup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}' // E2E tests run separately
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'src/__tests__/**/*',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Critical components should have higher coverage
        'src/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/components/editor/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },
    // Performance configuration
    testTimeout: 10000, // 10 seconds for complex integration tests
    hookTimeout: 5000,  // 5 seconds for setup/teardown
    teardownTimeout: 3000,
    
    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Watch mode configuration
    watch: false, // Set to true for development
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/test-results/**'
    ],
    
    // Mock configuration
    deps: {
      inline: [
        '@testing-library/react',
        '@testing-library/jest-dom',
        '@testing-library/user-event'
      ]
    },
    
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_APP_NAME: 'ASTRAL_NOTES',
      VITE_APP_VERSION: '1.0.0'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  define: {
    // Define globals for tests
    __DEV__: true,
    __TEST__: true,
    __VERSION__: JSON.stringify('1.0.0')
  }
});