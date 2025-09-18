/**
 * ASTRAL_NOTES Test Setup
 * Global test configuration and utilities
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global test environment setup
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Mock navigator
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
  });

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();

  // Mock File and FileReader
  global.File = class File {
    constructor(public content: string[], public name: string, public options?: any) {}
  } as any;

  global.FileReader = class FileReader {
    result: string | ArrayBuffer | null = null;
    error: DOMException | null = null;
    readyState: number = 0;
    
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    
    readAsText(file: File) {
      setTimeout(() => {
        this.result = file.content.join('');
        this.readyState = 2;
        if (this.onload) {
          this.onload({} as ProgressEvent<FileReader>);
        }
      }, 0);
    }
    
    readAsDataURL(file: File) {
      setTimeout(() => {
        this.result = `data:text/plain;base64,${btoa(file.content.join(''))}`;
        this.readyState = 2;
        if (this.onload) {
          this.onload({} as ProgressEvent<FileReader>);
        }
      }, 0);
    }
    
    abort() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  } as any;

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  };
});

// Global test cleanup
afterAll(() => {
  vi.restoreAllMocks();
});

// Export commonly used test utilities
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

export const createMockFile = (name: string, content: string, type = 'text/plain') => {
  const file = new File([content], name, { type });
  return file;
};

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));