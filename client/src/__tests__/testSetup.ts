// Test Setup for ASTRAL_NOTES
// Vitest global configuration and test utilities

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import FDBDatabase from 'fake-indexeddb/lib/FDBDatabase';
import FDBObjectStore from 'fake-indexeddb/lib/FDBObjectStore';
import FDBIndex from 'fake-indexeddb/lib/FDBIndex';
import FDBCursor from 'fake-indexeddb/lib/FDBCursor';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';
import FDBRequest from 'fake-indexeddb/lib/FDBRequest';
import FDBOpenDBRequest from 'fake-indexeddb/lib/FDBOpenDBRequest';
import FDBVersionChangeEvent from 'fake-indexeddb/lib/FDBVersionChangeEvent';
import FDBTransaction from 'fake-indexeddb/lib/FDBTransaction';

// Set up fake IndexedDB globally
global.indexedDB = new FDBFactory();
global.IDBDatabase = FDBDatabase;
global.IDBObjectStore = FDBObjectStore;
global.IDBIndex = FDBIndex;
global.IDBCursor = FDBCursor;
global.IDBKeyRange = FDBKeyRange;
global.IDBRequest = FDBRequest;
global.IDBOpenDBRequest = FDBOpenDBRequest;
global.IDBVersionChangeEvent = FDBVersionChangeEvent;
global.IDBTransaction = FDBTransaction;

// Mock window.matchMedia (used by many UI components)
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

// Mock ResizeObserver (used by many modern UI components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (used for lazy loading and scroll detection)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock localStorage with proper implementation
class LocalStorageMock {
  private store: { [key: string]: string } = {};
  
  getItem = vi.fn((key: string) => {
    return this.store[key] || null;
  });
  
  setItem = vi.fn((key: string, value: string) => {
    this.store[key] = value.toString();
  });
  
  removeItem = vi.fn((key: string) => {
    delete this.store[key];
  });
  
  clear = vi.fn(() => {
    this.store = {};
  });
  
  get length() {
    return Object.keys(this.store).length;
  }
  
  key = vi.fn((index: number) => {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  });
}

const localStorageMock = new LocalStorageMock();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage with proper implementation
class SessionStorageMock {
  private store: { [key: string]: string } = {};
  
  getItem = vi.fn((key: string) => {
    return this.store[key] || null;
  });
  
  setItem = vi.fn((key: string, value: string) => {
    this.store[key] = value.toString();
  });
  
  removeItem = vi.fn((key: string) => {
    delete this.store[key];
  });
  
  clear = vi.fn(() => {
    this.store = {};
  });
  
  get length() {
    return Object.keys(this.store).length;
  }
  
  key = vi.fn((index: number) => {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  });
}

const sessionStorageMock = new SessionStorageMock();
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// IndexedDB is now properly mocked with fake-indexeddb above
// No need for additional mocking

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock File and FileReader
global.File = class MockFile {
  constructor(
    public name: string,
    public size: number = 0,
    public type: string = '',
    public lastModified: number = Date.now()
  ) {}
} as any;

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: any = null;
  readyState: number = 0;
  
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  
  readAsText = vi.fn();
  readAsDataURL = vi.fn();
  readAsArrayBuffer = vi.fn();
  readAsBinaryString = vi.fn();
  abort = vi.fn();
} as any;

// Mock DOMParser for XML/HTML parsing
global.DOMParser = class MockDOMParser {
  parseFromString = vi.fn().mockReturnValue({
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    documentElement: {},
  });
} as any;

// Mock crypto for secure operations
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid'),
    getRandomValues: vi.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
    },
  },
});

// Mock clipboard API (configurable to avoid redefine errors)
if (!Object.getOwnPropertyDescriptor(navigator, 'clipboard')) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: {
      writeText: vi.fn(),
      readText: vi.fn(),
      write: vi.fn(),
      read: vi.fn(),
    },
  });
}

// Mock performance API
global.performance = {
  ...global.performance,
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  now: vi.fn(() => Date.now()),
};

// Setup console suppressions for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress known React testing warnings and IndexedDB fallback messages
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: findDOMNode is deprecated') ||
       args[0].includes('IndexedDB initialization failed') ||
       args[0].includes('falling back to localStorage'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    // Suppress known development warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps has been renamed') ||
       args[0].includes('IndexedDB'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
  
  console.log = (...args: any[]) => {
    // Suppress test environment logs
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Astral Notes - Environment Configuration') ||
       args[0].includes('Starting Phase'))
    ) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Export utilities for tests
export const resetAllMocks = () => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
};

export const createMockEvent = (type: string, properties: any = {}) => {
  return {
    type,
    target: {
      value: '',
      checked: false,
      ...properties.target
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...properties
  };
};

// Mock data factories
export const createMockProject = (overrides: any = {}) => ({
  id: 'test-project-1',
  title: 'Test Project',
  description: 'A test project for unit tests',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  isPublic: false,
  tags: ['test'],
  settings: {
    theme: 'cosmic',
    plotboard: {
      showConnections: true,
      autoLayout: false,
      zoomLevel: 1
    }
  },
  ...overrides
});

export const createMockStory = (projectId: string, overrides: any = {}) => ({
  id: 'test-story-1',
  projectId,
  title: 'Test Story',
  description: 'A test story',
  content: '',
  type: 'story',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  isArchived: false,
  order: 0,
  ...overrides
});

export const createMockNote = (projectId: string, overrides: any = {}) => ({
  id: 'test-note-1',
  projectId,
  title: 'Test Note',
  content: 'Test note content',
  type: 'note',
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  isArchived: false,
  ...overrides
});
