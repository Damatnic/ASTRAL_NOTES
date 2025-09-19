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

// Mock Blob for file operations
global.Blob = class MockBlob {
  public parts: any[];
  public options: BlobPropertyBag;
  
  constructor(parts: any[] = [], options: BlobPropertyBag = {}) {
    this.parts = parts;
    this.options = options;
  }
  
  get size() {
    return this.parts.reduce((size, part) => size + (part.length || 0), 0);
  }
  
  get type() {
    return this.options.type || '';
  }
  
  text = vi.fn().mockImplementation(() => {
    // Return the actual content from parts
    const content = this.parts.join('');
    return Promise.resolve(content);
  });
  
  arrayBuffer = vi.fn().mockImplementation(() => {
    const content = this.parts.join('');
    const buffer = new ArrayBuffer(content.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < content.length; i++) {
      view[i] = content.charCodeAt(i);
    }
    return Promise.resolve(buffer);
  });
  
  stream = vi.fn();
  
  slice = vi.fn().mockImplementation((start = 0, end = this.size, contentType = '') => {
    const content = this.parts.join('');
    const slicedContent = content.slice(start, end);
    return new (global.Blob as any)([slicedContent], { type: contentType });
  });
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
  userId: 'test-user-1',
  status: 'writing' as const,
  isPublic: false,
  tags: ['test'],
  genre: 'fantasy',
  stories: [],
  projectNotes: [],
  plotboard: {
    id: 'test-plotboard-1',
    projectId: 'test-project-1',
    scenes: [],
    connections: [],
    layout: 'grid',
    settings: {
      showConnections: true,
      autoLayout: false,
      gridSize: 20,
      snapToGrid: true
    }
  },
  wordCount: 0,
  targetWordCount: 50000,
  lastEditedAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  settings: {
    defaultPOV: 'first',
    defaultLocation: 'test-location',
    timeFormat: '12h' as const,
    dateFormat: 'MDY' as const,
    autoSave: true,
    versionHistory: true,
    theme: 'cosmic',
    plotboard: {
      showConnections: true,
      autoLayout: false,
      zoomLevel: 1
    }
  },
  collaborators: [],
  isCollaborative: false,
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

export const createMockCharacter = (overrides: any = {}) => ({
  id: 'test-character-1',
  name: 'Test Character',
  description: 'A test character for unit tests',
  projectId: 'test-project-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  role: 'main',
  age: undefined,
  appearance: '',
  personality: '',
  backstory: '',
  goals: '',
  ...overrides
});

// ============================================================================
// TipTap Editor Mocks
// ============================================================================

// Mock TipTap Editor Core
vi.mock('@tiptap/react', async () => {
  const React = await import('react');
  
  // Create chainable command object
  const createChainableCommands = () => {
    const commands = {
      setContent: vi.fn(),
      insertContent: vi.fn(),
      setTextSelection: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      setBold: vi.fn(),
      setItalic: vi.fn(),
      setUnderline: vi.fn(),
      setStrike: vi.fn(),
      setCode: vi.fn(),
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnderline: vi.fn(),
      toggleStrike: vi.fn(),
      toggleCode: vi.fn(),
      toggleHeading: vi.fn(),
      toggleBulletList: vi.fn(),
      toggleOrderedList: vi.fn(),
      toggleTaskList: vi.fn(),
      toggleCodeBlock: vi.fn(),
      toggleBlockquote: vi.fn(),
      toggleHighlight: vi.fn(),
      setHorizontalRule: vi.fn(),
      setHardBreak: vi.fn(),
      setLink: vi.fn(),
      unsetLink: vi.fn(),
      setImage: vi.fn(),
      setTable: vi.fn(),
      deleteTable: vi.fn(),
      addRowBefore: vi.fn(),
      addRowAfter: vi.fn(),
      deleteRow: vi.fn(),
      addColumnBefore: vi.fn(),
      addColumnAfter: vi.fn(),
      deleteColumn: vi.fn(),
      setTextAlign: vi.fn(),
      setColor: vi.fn(),
      setHighlight: vi.fn(),
      setFontFamily: vi.fn(),
      selectAll: vi.fn(),
      clearContent: vi.fn(),
      run: vi.fn().mockReturnValue(true),
    };
    
    // Make all methods return the commands object for chaining
    Object.keys(commands).forEach(key => {
      if (key !== 'run') {
        commands[key] = vi.fn().mockReturnValue(commands);
      }
    });
    
    return commands;
  };

  const mockEditor = {
    commands: createChainableCommands(),
    state: {
      doc: {
        content: [],
        textContent: 'Mock content',
      },
      selection: {
        from: 0,
        to: 0,
        empty: true,
      },
    },
    view: {
      dom: typeof document !== 'undefined' ? document.createElement('div') : {},
      dispatch: vi.fn(),
    },
    schema: {},
    isActive: vi.fn().mockReturnValue(false),
    isEditable: true,
    isFocused: false,
    isEmpty: false,
    can: () => ({
      setBold: vi.fn().mockReturnValue(true),
      setItalic: vi.fn().mockReturnValue(true),
      undo: vi.fn().mockReturnValue(true),
      redo: vi.fn().mockReturnValue(true),
      chain: () => createChainableCommands(),
    }),
    chain: () => createChainableCommands(),
    getHTML: vi.fn().mockReturnValue('<p>Mock HTML content</p>'),
    getText: vi.fn().mockReturnValue('Mock text content'),
    getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
    getCharacterCount: vi.fn().mockReturnValue(100),
    storage: {
      characterCount: {
        characters: vi.fn().mockReturnValue(100),
        words: vi.fn().mockReturnValue(20),
      },
    },
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  return {
    Editor: vi.fn().mockImplementation(() => mockEditor),
    useEditor: vi.fn().mockImplementation((options = {}) => {
      const editor = { ...mockEditor };
      
      // Apply any content from options
      if (options.content) {
        editor.getHTML = vi.fn().mockReturnValue(options.content);
        editor.getText = vi.fn().mockReturnValue(
          options.content.replace(/<[^>]*>/g, '')
        );
      }

      // Mock onChange handler
      if (options.onChange) {
        editor.on = vi.fn().mockImplementation((event, callback) => {
          if (event === 'update') {
            // Simulate onChange calls
            setTimeout(() => {
              callback({ editor });
            }, 0);
          }
        });
      }

      return editor;
    }),
    EditorContent: vi.fn().mockImplementation(({ editor, ...props }) => {
      return React.createElement('div', {
        'data-testid': 'editor-content',
        contentEditable: true,
        suppressContentEditableWarning: true,
        ...props,
      }, editor?.getHTML?.() || 'Mock editor content');
    }),
    FloatingMenu: vi.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', {
        'data-testid': 'floating-menu',
        ...props,
      }, children);
    }),
    BubbleMenu: vi.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', {
        'data-testid': 'bubble-menu',
        ...props,
      }, children);
    }),
    NodeViewWrapper: vi.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', {
        'data-testid': 'node-view-wrapper',
        ...props,
      }, children);
    }),
    NodeViewContent: vi.fn().mockImplementation((props) => {
      return React.createElement('div', {
        'data-testid': 'node-view-content',
        ...props,
      });
    }),
  };
});

// Mock TipTap Extensions
const createMockExtension = (name: string) => ({
  name,
  type: 'extension',
  configure: vi.fn().mockReturnThis(),
  extend: vi.fn().mockReturnThis(),
});

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn().mockReturnValue(createMockExtension('StarterKit')),
  },
}));

vi.mock('@tiptap/extension-placeholder', () => ({
  default: {
    configure: vi.fn().mockReturnValue(createMockExtension('Placeholder')),
  },
}));

vi.mock('@tiptap/extension-character-count', () => ({
  default: createMockExtension('CharacterCount'),
}));

vi.mock('@tiptap/extension-focus', () => ({
  default: createMockExtension('Focus'),
}));

vi.mock('@tiptap/extension-typography', () => ({
  default: createMockExtension('Typography'),
}));

vi.mock('@tiptap/extension-link', () => ({
  default: {
    configure: vi.fn().mockReturnValue(createMockExtension('Link')),
  },
}));

vi.mock('@tiptap/extension-image', () => ({
  default: createMockExtension('Image'),
}));

vi.mock('@tiptap/extension-table', () => ({
  default: createMockExtension('Table'),
}));

vi.mock('@tiptap/extension-table-row', () => ({
  default: createMockExtension('TableRow'),
}));

vi.mock('@tiptap/extension-table-header', () => ({
  default: createMockExtension('TableHeader'),
}));

vi.mock('@tiptap/extension-table-cell', () => ({
  default: createMockExtension('TableCell'),
}));

vi.mock('@tiptap/extension-highlight', () => ({
  default: createMockExtension('Highlight'),
}));

vi.mock('@tiptap/extension-code-block-lowlight', () => ({
  default: createMockExtension('CodeBlockLowlight'),
}));

vi.mock('@tiptap/extension-text-style', () => ({
  default: createMockExtension('TextStyle'),
}));

vi.mock('@tiptap/extension-color', () => ({
  default: createMockExtension('Color'),
}));

vi.mock('@tiptap/extension-text-align', () => ({
  default: {
    configure: vi.fn().mockReturnValue(createMockExtension('TextAlign')),
  },
}));

vi.mock('@tiptap/extension-list-item', () => ({
  default: createMockExtension('ListItem'),
}));

vi.mock('@tiptap/extension-task-list', () => ({
  default: createMockExtension('TaskList'),
}));

vi.mock('@tiptap/extension-task-item', () => ({
  default: createMockExtension('TaskItem'),
}));

vi.mock('@tiptap/extension-underline', () => ({
  default: createMockExtension('Underline'),
}));

vi.mock('@tiptap/extension-subscript', () => ({
  default: createMockExtension('Subscript'),
}));

vi.mock('@tiptap/extension-superscript', () => ({
  default: createMockExtension('Superscript'),
}));

vi.mock('@tiptap/extension-font-family', () => ({
  default: createMockExtension('FontFamily'),
}));

// Mock lowlight for code highlighting
vi.mock('lowlight', () => ({
  createLowlight: vi.fn(() => ({
    register: vi.fn(),
    registerLanguage: vi.fn(),
    highlight: vi.fn(() => ({ value: 'mock-highlighted-code' })),
  })),
}));

// Export mock editor for use in tests
export const createMockEditor = (options: any = {}) => {
  return {
    commands: {
      setContent: vi.fn(),
      insertContent: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
    },
    getHTML: vi.fn().mockReturnValue(options.content || '<p>Mock content</p>'),
    getText: vi.fn().mockReturnValue(options.content?.replace(/<[^>]*>/g, '') || 'Mock content'),
    getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
    getCharacterCount: vi.fn().mockReturnValue(100),
    storage: {
      characterCount: {
        characters: vi.fn().mockReturnValue(100),
        words: vi.fn().mockReturnValue(20),
      },
    },
    isActive: vi.fn().mockReturnValue(false),
    isEditable: true,
    isFocused: false,
    isEmpty: false,
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    ...options.overrides,
  };
};
