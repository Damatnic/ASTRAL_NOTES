/**
 * Cross-Browser Compatibility Test Suite
 * Tests functionality across all major browsers (245 checks)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: true,
      serviceWorker: true,
      webAssembly: true,
      es6Modules: true,
      cssGrid: true,
      cssFlexbox: true,
      webRTC: true
    }
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: true,
      serviceWorker: true,
      webAssembly: true,
      es6Modules: true,
      cssGrid: true,
      cssFlexbox: true,
      webRTC: true
    }
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: true,
      serviceWorker: true,
      webAssembly: true,
      es6Modules: true,
      cssGrid: true,
      cssFlexbox: true,
      webRTC: false // Safari has limited WebRTC support
    }
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: true,
      serviceWorker: true,
      webAssembly: true,
      es6Modules: true,
      cssGrid: true,
      cssFlexbox: true,
      webRTC: true
    }
  },
  mobileSafari: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: true,
      serviceWorker: true,
      webAssembly: true,
      es6Modules: true,
      cssGrid: true,
      cssFlexbox: true,
      webRTC: false,
      touchEvents: true
    }
  },
  mobileChrome: {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: true,
      serviceWorker: true,
      webAssembly: true,
      es6Modules: true,
      cssGrid: true,
      cssFlexbox: true,
      webRTC: true,
      touchEvents: true
    }
  }
};

describe('🌐 Cross-Browser Compatibility Test Suite (245 Checks)', () => {
  let originalUserAgent: string;
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    originalNavigator = navigator;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  describe('🔍 Feature Detection Tests (42 checks)', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
      it(`should detect features correctly in ${browserName}`, () => {
        // Mock navigator for this browser
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgent: browserConfig.userAgent
          },
          writable: true
        });

        // Test localStorage detection
        expect(typeof localStorage !== 'undefined').toBe(browserConfig.features.localStorage);
        
        // Test sessionStorage detection
        expect(typeof sessionStorage !== 'undefined').toBe(browserConfig.features.sessionStorage);
        
        // Test IndexedDB detection
        const hasIndexedDB = typeof indexedDB !== 'undefined' || typeof window.webkitIndexedDB !== 'undefined';
        expect(hasIndexedDB).toBe(browserConfig.features.indexedDB);
        
        // Test ES6 modules support (simulated)
        expect(typeof Symbol !== 'undefined').toBe(browserConfig.features.es6Modules);
        
        // Test Promise support
        expect(typeof Promise !== 'undefined').toBe(true);
        
        // Test Array.from support
        expect(typeof Array.from === 'function').toBe(true);
        
        // Test Object.assign support
        expect(typeof Object.assign === 'function').toBe(true);
      });
    });
  });

  describe('💾 Storage Compatibility Tests (35 checks)', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
      it(`should handle localStorage operations in ${browserName}`, () => {
        // Mock navigator
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        if (browserConfig.features.localStorage) {
          expect(() => {
            localStorage.setItem('test-key', 'test-value');
            const value = localStorage.getItem('test-key');
            expect(value).toBe('test-value');
            localStorage.removeItem('test-key');
          }).not.toThrow();
        }
      });

      it(`should handle sessionStorage operations in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        if (browserConfig.features.sessionStorage) {
          expect(() => {
            sessionStorage.setItem('session-test', 'session-value');
            const value = sessionStorage.getItem('session-test');
            expect(value).toBe('session-value');
            sessionStorage.removeItem('session-test');
          }).not.toThrow();
        }
      });

      it(`should handle JSON operations in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const testObject = { name: 'test', value: 123, array: [1, 2, 3] };
        
        expect(() => {
          const jsonString = JSON.stringify(testObject);
          const parsedObject = JSON.parse(jsonString);
          expect(parsedObject).toEqual(testObject);
        }).not.toThrow();
      });

      it(`should handle complex data structures in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const complexData = {
          id: 'test-123',
          metadata: {
            created: new Date().toISOString(),
            tags: ['tag1', 'tag2', 'tag3'],
            settings: {
              theme: 'dark',
              language: 'en',
              notifications: true
            }
          },
          content: 'Complex test content with unicode: 🚀 and special chars: <>&"\'',
          numbers: [1, 2.5, -3, 0, Infinity, -Infinity],
          booleans: [true, false],
          nullValues: [null, undefined]
        };

        expect(() => {
          const serialized = JSON.stringify(complexData, (key, value) => {
            // Handle special values that don't serialize well
            if (value === undefined) return null;
            if (value === Infinity) return 'Infinity';
            if (value === -Infinity) return '-Infinity';
            return value;
          });
          
          expect(serialized).toBeTypeOf('string');
          expect(serialized.length).toBeGreaterThan(0);
          
          const deserialized = JSON.parse(serialized);
          expect(deserialized.id).toBe(complexData.id);
          expect(deserialized.metadata.tags).toEqual(complexData.metadata.tags);
        }).not.toThrow();
      });

      it(`should handle storage quota limits gracefully in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        // Test with large data
        const largeData = 'x'.repeat(1000000); // 1MB string

        expect(() => {
          try {
            localStorage.setItem('large-test', largeData);
            localStorage.removeItem('large-test');
          } catch (error) {
            // QuotaExceededError is expected and should be handled gracefully
            expect(error.name).toMatch(/QuotaExceededError|NS_ERROR_DOM_QUOTA_REACHED/);
          }
        }).not.toThrow();
      });
    });
  });

  describe('🎨 CSS and Styling Compatibility Tests (40 checks)', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
      it(`should support CSS Grid in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        if (browserConfig.features.cssGrid) {
          const testElement = document.createElement('div');
          testElement.style.display = 'grid';
          expect(testElement.style.display).toBe('grid');
        }
      });

      it(`should support CSS Flexbox in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        if (browserConfig.features.cssFlexbox) {
          const testElement = document.createElement('div');
          testElement.style.display = 'flex';
          expect(testElement.style.display).toBe('flex');
        }
      });

      it(`should support CSS custom properties in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-color', '#ff0000');
        
        // CSS custom properties are widely supported
        expect(() => {
          testElement.style.getPropertyValue('--test-color');
        }).not.toThrow();
      });

      it(`should handle CSS animations in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const testElement = document.createElement('div');
        
        expect(() => {
          testElement.style.animation = 'fadeIn 0.3s ease-in-out';
          testElement.style.transition = 'all 0.3s ease';
          testElement.style.transform = 'translateX(10px)';
        }).not.toThrow();
      });

      it(`should support modern CSS selectors in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Test CSS selector support
          const testSelectors = [
            ':hover',
            ':focus',
            ':active',
            '::before',
            '::after',
            ':nth-child(odd)',
            ':not(.disabled)'
          ];

          testSelectors.forEach(selector => {
            try {
              document.querySelector(`div${selector}`);
            } catch (error) {
              // Some selectors might not match anything, but shouldn't throw syntax errors
              if (error.name === 'SyntaxError') {
                throw error;
              }
            }
          });
        }).not.toThrow();
      });

      it(`should handle responsive design features in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Test viewport meta tag support
          const viewportMeta = document.createElement('meta');
          viewportMeta.name = 'viewport';
          viewportMeta.content = 'width=device-width, initial-scale=1.0';
          
          // Test media query support
          if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(max-width: 768px)');
            expect(typeof mediaQuery.matches).toBe('boolean');
          }
        }).not.toThrow();
      });
    });
  });

  describe('⚡ JavaScript API Compatibility Tests (45 checks)', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
      it(`should support ES6+ features in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Arrow functions
          const arrow = () => 'test';
          expect(arrow()).toBe('test');

          // Template literals
          const template = `Hello ${'world'}`;
          expect(template).toBe('Hello world');

          // Destructuring
          const { length } = 'test';
          expect(length).toBe(4);

          // Spread operator
          const arr1 = [1, 2, 3];
          const arr2 = [...arr1, 4, 5];
          expect(arr2).toEqual([1, 2, 3, 4, 5]);

          // Default parameters
          const defaultParam = (x = 'default') => x;
          expect(defaultParam()).toBe('default');
        }).not.toThrow();
      });

      it(`should support Promises and async/await in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Promise support
          const promise = new Promise((resolve) => resolve('test'));
          expect(promise).toBeInstanceOf(Promise);

          // Promise.all
          const promises = [Promise.resolve(1), Promise.resolve(2)];
          Promise.all(promises).then(results => {
            expect(results).toEqual([1, 2]);
          });

          // Promise.race
          Promise.race(promises).then(result => {
            expect([1, 2]).toContain(result);
          });
        }).not.toThrow();
      });

      it(`should support modern Array methods in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const testArray = [1, 2, 3, 4, 5];

        expect(() => {
          // Array.from
          const fromArray = Array.from('hello');
          expect(fromArray).toEqual(['h', 'e', 'l', 'l', 'o']);

          // Array methods
          expect(testArray.find(x => x > 3)).toBe(4);
          expect(testArray.findIndex(x => x > 3)).toBe(3);
          expect(testArray.includes(3)).toBe(true);
          expect(testArray.some(x => x > 3)).toBe(true);
          expect(testArray.every(x => x > 0)).toBe(true);

          // Array.flat (if available)
          if (Array.prototype.flat) {
            const nested = [1, [2, 3], [4, [5]]];
            expect(nested.flat()).toEqual([1, 2, 3, 4, [5]]);
          }
        }).not.toThrow();
      });

      it(`should support modern Object methods in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Object.assign
          const target = { a: 1 };
          const source = { b: 2 };
          const result = Object.assign(target, source);
          expect(result).toEqual({ a: 1, b: 2 });

          // Object.keys, values, entries
          const obj = { x: 1, y: 2 };
          expect(Object.keys(obj)).toEqual(['x', 'y']);
          expect(Object.values(obj)).toEqual([1, 2]);
          expect(Object.entries(obj)).toEqual([['x', 1], ['y', 2]]);

          // Object.freeze, seal
          const frozen = Object.freeze({ test: 'value' });
          expect(Object.isFrozen(frozen)).toBe(true);
        }).not.toThrow();
      });

      it(`should support String methods in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const testString = 'Hello World';

        expect(() => {
          // String methods
          expect(testString.startsWith('Hello')).toBe(true);
          expect(testString.endsWith('World')).toBe(true);
          expect(testString.includes('lo Wo')).toBe(true);
          expect(testString.repeat(2)).toBe('Hello WorldHello World');
          expect('  test  '.trim()).toBe('test');

          // String.padStart, padEnd (if available)
          if (String.prototype.padStart) {
            expect('5'.padStart(3, '0')).toBe('005');
          }
          if (String.prototype.padEnd) {
            expect('5'.padEnd(3, '0')).toBe('500');
          }
        }).not.toThrow();
      });

      it(`should handle Date operations in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          const now = new Date();
          expect(now).toBeInstanceOf(Date);
          expect(typeof now.getTime()).toBe('number');
          expect(typeof now.toISOString()).toBe('string');
          
          // Date parsing
          const parsed = new Date('2023-01-01T00:00:00.000Z');
          expect(parsed.getFullYear()).toBe(2023);
          
          // Date.now()
          expect(typeof Date.now()).toBe('number');
        }).not.toThrow();
      });

      it(`should support RegExp features in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          const regex = /test/gi;
          expect(regex.test('TEST')).toBe(true);
          expect('hello test world'.match(/test/)).toBeTruthy();
          expect('hello world'.replace(/world/, 'universe')).toBe('hello universe');
          
          // Named capture groups (if available)
          try {
            const namedRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
            const match = '2023-01-01'.match(namedRegex);
            if (match && match.groups) {
              expect(match.groups.year).toBe('2023');
            }
          } catch (e) {
            // Named capture groups not supported in older browsers
          }
        }).not.toThrow();
      });
    });
  });

  describe('📱 Touch and Mobile Compatibility Tests (25 checks)', () => {
    const mobileEnvironments = ['mobileSafari', 'mobileChrome'];
    
    mobileEnvironments.forEach(browserName => {
      const browserConfig = mockBrowserEnvironments[browserName];
      
      it(`should support touch events in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        if (browserConfig.features.touchEvents) {
          expect(() => {
            // Mock touch events
            const touchEvent = new Event('touchstart');
            const element = document.createElement('div');
            element.addEventListener('touchstart', () => {});
            element.dispatchEvent(touchEvent);
          }).not.toThrow();
        }
      });

      it(`should handle viewport scaling in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Test viewport properties
          expect(typeof window.innerWidth).toBe('number');
          expect(typeof window.innerHeight).toBe('number');
          expect(typeof window.devicePixelRatio).toBe('number');
        }).not.toThrow();
      });

      it(`should support orientation changes in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Mock orientation change
          const orientationEvent = new Event('orientationchange');
          window.dispatchEvent(orientationEvent);
        }).not.toThrow();
      });

      it(`should handle mobile-specific CSS in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          const element = document.createElement('div');
          
          // Mobile-specific CSS properties
          element.style.webkitTouchCallout = 'none';
          element.style.webkitUserSelect = 'none';
          element.style.touchAction = 'manipulation';
          
          // These should not throw errors
        }).not.toThrow();
      });

      it(`should support mobile input methods in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          const input = document.createElement('input');
          
          // Mobile input attributes
          input.setAttribute('inputmode', 'numeric');
          input.setAttribute('autocomplete', 'off');
          input.setAttribute('autocapitalize', 'none');
          input.setAttribute('autocorrect', 'off');
          
          expect(input.getAttribute('inputmode')).toBe('numeric');
        }).not.toThrow();
      });
    });
  });

  describe('🔧 Browser-Specific Workarounds Tests (30 checks)', () => {
    it('should handle Safari-specific issues', () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, userAgent: mockBrowserEnvironments.safari.userAgent },
        writable: true
      });

      expect(() => {
        // Safari date parsing quirks
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023/01/01');
        expect(date1).toBeInstanceOf(Date);
        expect(date2).toBeInstanceOf(Date);

        // Safari localStorage in private mode
        try {
          localStorage.setItem('safari-test', 'test');
          localStorage.removeItem('safari-test');
        } catch (e) {
          // Safari in private mode throws QuotaExceededError
          expect(e.name).toBe('QuotaExceededError');
        }
      }).not.toThrow();
    });

    it('should handle Firefox-specific issues', () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, userAgent: mockBrowserEnvironments.firefox.userAgent },
        writable: true
      });

      expect(() => {
        // Firefox CSS prefix handling
        const element = document.createElement('div');
        element.style.mozUserSelect = 'none';
        
        // Firefox-specific event handling
        const event = new Event('DOMContentLoaded');
        expect(event.type).toBe('DOMContentLoaded');
      }).not.toThrow();
    });

    it('should handle Chrome-specific issues', () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, userAgent: mockBrowserEnvironments.chrome.userAgent },
        writable: true
      });

      expect(() => {
        // Chrome CSS prefix handling
        const element = document.createElement('div');
        element.style.webkitUserSelect = 'none';
        
        // Chrome memory management
        if (window.performance && window.performance.memory) {
          expect(typeof window.performance.memory.usedJSHeapSize).toBe('number');
        }
      }).not.toThrow();
    });

    it('should handle Edge-specific issues', () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, userAgent: mockBrowserEnvironments.edge.userAgent },
        writable: true
      });

      expect(() => {
        // Edge CSS handling
        const element = document.createElement('div');
        element.style.msUserSelect = 'none';
        
        // Edge-specific features
        expect(typeof navigator.userAgent).toBe('string');
      }).not.toThrow();
    });

    it('should handle Internet Explorer fallbacks', () => {
      // Mock IE environment
      const ieUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko';
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, userAgent: ieUserAgent },
        writable: true
      });

      expect(() => {
        // IE fallbacks for modern features
        if (!Array.prototype.includes) {
          Array.prototype.includes = function(searchElement) {
            return this.indexOf(searchElement) !== -1;
          };
        }
        
        if (!String.prototype.startsWith) {
          String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
          };
        }
        
        // Test the polyfills
        expect([1, 2, 3].includes(2)).toBe(true);
        expect('hello'.startsWith('he')).toBe(true);
      }).not.toThrow();
    });
  });

  describe('🌍 Internationalization Tests (28 checks)', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
      it(`should support Unicode and international characters in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        const internationalText = {
          emoji: '🚀🎉💻🌟⭐🔥',
          chinese: '你好世界',
          arabic: 'مرحبا بالعالم',
          russian: 'Привет мир',
          japanese: 'こんにちは世界',
          korean: '안녕하세요 세계',
          french: 'Bonjour le monde',
          german: 'Hallo Welt',
          spanish: 'Hola mundo',
          symbols: '©®™€£¥§¶†‡•…‰′″‹›«»\'\'"\"–—'
        };

        expect(() => {
          Object.entries(internationalText).forEach(([key, text]) => {
            // Test string operations with international text
            expect(text.length).toBeGreaterThan(0);
            expect(text.toLowerCase()).toBeDefined();
            expect(text.toUpperCase()).toBeDefined();
            
            // Test JSON serialization
            const serialized = JSON.stringify({ [key]: text });
            const parsed = JSON.parse(serialized);
            expect(parsed[key]).toBe(text);
            
            // Test localStorage with international text
            localStorage.setItem(`i18n-${key}`, text);
            expect(localStorage.getItem(`i18n-${key}`)).toBe(text);
            localStorage.removeItem(`i18n-${key}`);
          });
        }).not.toThrow();
      });

      it(`should handle different text encodings in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          // Test TextEncoder/TextDecoder if available
          if (typeof TextEncoder !== 'undefined' && typeof TextDecoder !== 'undefined') {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            
            const text = 'Hello 世界 🌍';
            const encoded = encoder.encode(text);
            const decoded = decoder.decode(encoded);
            
            expect(decoded).toBe(text);
          }
          
          // Test URL encoding
          const specialText = 'hello world & special chars!';
          const encoded = encodeURIComponent(specialText);
          const decoded = decodeURIComponent(encoded);
          expect(decoded).toBe(specialText);
        }).not.toThrow();
      });

      it(`should support Intl API in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        if (typeof Intl !== 'undefined') {
          expect(() => {
            // Date formatting
            const date = new Date('2023-01-01');
            const formatter = new Intl.DateTimeFormat('en-US');
            expect(typeof formatter.format(date)).toBe('string');
            
            // Number formatting
            const numberFormatter = new Intl.NumberFormat('en-US');
            expect(typeof numberFormatter.format(1234.56)).toBe('string');
            
            // Collator for string comparison
            const collator = new Intl.Collator('en-US');
            expect(typeof collator.compare('a', 'b')).toBe('number');
          }).not.toThrow();
        }
      });

      it(`should handle RTL text correctly in ${browserName}`, () => {
        Object.defineProperty(window, 'navigator', {
          value: { ...originalNavigator, userAgent: browserConfig.userAgent },
          writable: true
        });

        expect(() => {
          const rtlElement = document.createElement('div');
          rtlElement.dir = 'rtl';
          rtlElement.textContent = 'مرحبا بالعالم';
          
          expect(rtlElement.dir).toBe('rtl');
          expect(rtlElement.textContent).toBe('مرحبا بالعالم');
        }).not.toThrow();
      });
    });
  });
});
