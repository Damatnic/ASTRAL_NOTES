/**
 * Enhanced Test Utilities for ASTRAL_NOTES
 * Comprehensive testing infrastructure with advanced mocking and validation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../store/store';
import React from 'react';

// Performance monitoring utilities
export class TestPerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private memoryStart: number = 0;
  private memoryEnd: number = 0;

  startMeasurement(): void {
    this.startTime = performance.now();
    this.memoryStart = (performance as any).memory?.usedJSHeapSize || 0;
  }

  endMeasurement(): {
    duration: number;
    memoryDelta: number;
    fps: number;
  } {
    this.endTime = performance.now();
    this.memoryEnd = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      duration: this.endTime - this.startTime,
      memoryDelta: this.memoryEnd - this.memoryStart,
      fps: this.calculateFPS()
    };
  }

  private calculateFPS(): number {
    const duration = this.endTime - this.startTime;
    return Math.round(1000 / (duration / 60)); // Approximate FPS
  }
}

// Enhanced rendering utilities
export interface CustomRenderOptions {
  initialState?: any;
  route?: string;
  wrapper?: React.ComponentType<any>;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialState, route = '/', wrapper: Wrapper } = options;

  // Create a test store if initial state is provided
  const testStore = initialState ? { ...store, getState: () => initialState } : store as any;

  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={testStore}>
        <BrowserRouter>
          <div data-testid="app-wrapper">
            {Wrapper ? <Wrapper>{children}</Wrapper> : children}
          </div>
        </BrowserRouter>
      </Provider>
    );
  }

  // Set the route if specified
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Advanced user interaction utilities
export const userInteraction = {
  // Type with realistic delays
  async typeRealistic(element: HTMLElement, text: string, delay: number = 50): Promise<void> {
    const user = userEvent.setup({ delay });
    await user.type(element, text);
  },

  // Click with double click detection
  async clickWithDoubleClickCheck(element: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.click(element);
    
    // Check if double click handler exists
    const hasDoubleClick = element.ondblclick !== null;
    if (hasDoubleClick) {
      await user.dblClick(element);
    }
  },

  // Keyboard navigation simulation
  async navigateWithKeyboard(startElement: HTMLElement, steps: string[]): Promise<void> {
    const user = userEvent.setup();
    let currentElement = startElement;
    
    for (const step of steps) {
      await user.type(currentElement, `{${step}}`);
      // Update current element based on focus
      currentElement = document.activeElement as HTMLElement;
    }
  },

  // Drag and drop simulation
  async dragAndDrop(source: HTMLElement, target: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    
    await user.pointer([
      { keys: '[MouseLeft>]', target: source },
      { coords: { x: 0, y: 0 }, target },
      { keys: '[/MouseLeft]' }
    ]);
  }
};

// Mock service utilities
export class ServiceMockFactory {
  private mocks: Map<string, any> = new Map();

  createMockService<T>(serviceName: string, methods: Partial<T>): T {
    const mock = vi.fn(() => methods) as any;
    Object.keys(methods).forEach(method => {
      mock[method] = vi.fn((methods as any)[method]);
    });
    
    this.mocks.set(serviceName, mock);
    return mock;
  }

  createAsyncMockService<T>(serviceName: string, methods: Partial<T>, delay: number = 100): T {
    const asyncMethods = {} as any;
    
    Object.entries(methods).forEach(([key, value]) => {
      asyncMethods[key] = vi.fn(async (...args: any[]) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return typeof value === 'function' ? value(...args) : value;
      });
    });

    this.mocks.set(serviceName, asyncMethods);
    return asyncMethods;
  }

  getMock<T>(serviceName: string): T {
    return this.mocks.get(serviceName);
  }

  resetMock(serviceName: string): void {
    const mock = this.mocks.get(serviceName);
    if (mock) {
      Object.keys(mock).forEach(method => {
        if (vi.isMockFunction(mock[method])) {
          mock[method].mockClear();
        }
      });
    }
  }

  resetAllMocks(): void {
    this.mocks.forEach((_, serviceName) => {
      this.resetMock(serviceName);
    });
  }
}

// Test data validation utilities
export const validators = {
  // Validate component accessibility
  async validateAccessibility(container: HTMLElement): Promise<{
    passed: boolean;
    violations: any[];
  }> {
    // Mock axe-core for accessibility testing
    const violations: any[] = [];
    
    // Check for basic accessibility requirements
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('id') && container.querySelector(`label[for="${input.id}"]`);
      if (!hasLabel) {
        violations.push({
          id: 'label-missing',
          impact: 'critical',
          description: 'Form input missing label',
          nodes: [input]
        });
      }
    });

    const images = container.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        violations.push({
          id: 'image-alt-missing',
          impact: 'serious',
          description: 'Image missing alt attribute',
          nodes: [img]
        });
      }
    });

    return {
      passed: violations.length === 0,
      violations
    };
  },

  // Validate performance metrics
  validatePerformance(metrics: {
    duration: number;
    memoryDelta: number;
    fps: number;
  }, thresholds: {
    maxDuration?: number;
    maxMemoryDelta?: number;
    minFPS?: number;
  } = {}): {
    passed: boolean;
    failures: string[];
  } {
    const failures: string[] = [];
    
    if (thresholds.maxDuration && metrics.duration > thresholds.maxDuration) {
      failures.push(`Duration ${metrics.duration}ms exceeds threshold ${thresholds.maxDuration}ms`);
    }
    
    if (thresholds.maxMemoryDelta && metrics.memoryDelta > thresholds.maxMemoryDelta) {
      failures.push(`Memory usage ${metrics.memoryDelta} bytes exceeds threshold ${thresholds.maxMemoryDelta} bytes`);
    }
    
    if (thresholds.minFPS && metrics.fps < thresholds.minFPS) {
      failures.push(`FPS ${metrics.fps} below threshold ${thresholds.minFPS}`);
    }

    return {
      passed: failures.length === 0,
      failures
    };
  },

  // Validate API response structure
  validateAPIResponse(response: any, schema: any): {
    passed: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    const validateObject = (obj: any, schemaObj: any, path: string = ''): void => {
      Object.keys(schemaObj).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj)) {
          errors.push(`Missing required field: ${fullPath}`);
          return;
        }
        
        const expectedType = schemaObj[key];
        const actualType = typeof obj[key];
        
        if (typeof expectedType === 'string') {
          if (actualType !== expectedType) {
            errors.push(`Type mismatch at ${fullPath}: expected ${expectedType}, got ${actualType}`);
          }
        } else if (typeof expectedType === 'object' && expectedType !== null) {
          if (actualType === 'object' && obj[key] !== null) {
            validateObject(obj[key], expectedType, fullPath);
          } else {
            errors.push(`Type mismatch at ${fullPath}: expected object, got ${actualType}`);
          }
        }
      });
    };

    validateObject(response, schema);
    
    return {
      passed: errors.length === 0,
      errors
    };
  }
};

// Advanced waiting utilities
export const waitUtils = {
  // Wait for element with timeout and retry
  async waitForElementWithRetry(
    querySelector: () => HTMLElement | null,
    maxRetries: number = 10,
    retryDelay: number = 100
  ): Promise<HTMLElement> {
    for (let i = 0; i < maxRetries; i++) {
      const element = querySelector();
      if (element) return element;
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    throw new Error(`Element not found after ${maxRetries} retries`);
  },

  // Wait for API call to complete
  async waitForAPICall(mockFn: any, expectedCallCount: number = 1): Promise<void> {
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(expectedCallCount);
    }, { timeout: 5000 });
  },

  // Wait for state change
  async waitForStateChange<T>(
    getState: () => T,
    expectedState: T,
    timeout: number = 5000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (getState() === expectedState) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`State did not change to expected value within ${timeout}ms`);
  }
};

// Test cleanup utilities
export const cleanup = {
  // Reset all mocks and timers
  resetTestEnvironment(): void {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.restoreAllMocks();
  },

  // Clean up DOM
  cleanupDOM(): void {
    document.body.innerHTML = '';
    document.head.innerHTML = '<title>Test</title>';
  },

  // Reset global state
  resetGlobalState(): void {
    // Reset localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset any global variables
    (window as any).__TEST_STATE__ = {};
  },

  // Full cleanup
  fullCleanup(): void {
    this.resetTestEnvironment();
    this.cleanupDOM();
    this.resetGlobalState();
  }
};

// Test reporting utilities
export class TestReporter {
  private testResults: Array<{
    testName: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    coverage: number;
    performance: any;
    errors: string[];
  }> = [];

  recordTestResult(testName: string, result: {
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    coverage?: number;
    performance?: any;
    errors?: string[];
  }): void {
    this.testResults.push({
      testName,
      coverage: 0,
      performance: {},
      errors: [],
      ...result
    });
  }

  generateReport(): {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    averageDuration: number;
    totalCoverage: number;
    topErrors: Array<{ error: string; count: number }>;
  } {
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;
    
    const averageDuration = totalTests > 0 
      ? this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;

    const totalCoverage = totalTests > 0
      ? this.testResults.reduce((sum, r) => sum + r.coverage, 0) / totalTests
      : 0;

    // Count error occurrences
    const errorCounts = new Map<string, number>();
    this.testResults.forEach(result => {
      result.errors.forEach(error => {
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalTests,
      passed,
      failed,
      skipped,
      averageDuration,
      totalCoverage,
      topErrors
    };
  }

  exportReport(format: 'json' | 'html' | 'csv' = 'json'): string {
    const report = this.generateReport();
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          summary: report,
          details: this.testResults
        }, null, 2);
      
      case 'html':
        return this.generateHTMLReport(report);
      
      case 'csv':
        return this.generateCSVReport();
      
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  private generateHTMLReport(report: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASTRAL_NOTES Test Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
            .passed { color: green; }
            .failed { color: red; }
            .skipped { color: orange; }
          </style>
        </head>
        <body>
          <h1>ASTRAL_NOTES Test Report</h1>
          <div class="summary">
            <div class="metric">Total Tests: <strong>${report.totalTests}</strong></div>
            <div class="metric passed">Passed: <strong>${report.passed}</strong></div>
            <div class="metric failed">Failed: <strong>${report.failed}</strong></div>
            <div class="metric skipped">Skipped: <strong>${report.skipped}</strong></div>
            <div class="metric">Average Duration: <strong>${report.averageDuration.toFixed(2)}ms</strong></div>
            <div class="metric">Coverage: <strong>${report.totalCoverage.toFixed(1)}%</strong></div>
          </div>
          
          <h2>Test Details</h2>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>Test Name</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Coverage</th>
            </tr>
            ${this.testResults.map(result => `
              <tr class="${result.status}">
                <td>${result.testName}</td>
                <td>${result.status}</td>
                <td>${result.duration}ms</td>
                <td>${result.coverage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
  }

  private generateCSVReport(): string {
    const headers = 'Test Name,Status,Duration,Coverage,Errors\n';
    const rows = this.testResults.map(result => 
      `"${result.testName}","${result.status}",${result.duration},${result.coverage},"${result.errors.join('; ')}"`
    ).join('\n');
    
    return headers + rows;
  }
}

// Global test utilities
export const testUtils = {
  performance: TestPerformanceMonitor,
  serviceMocks: new ServiceMockFactory(),
  reporter: new TestReporter(),
  render: renderWithProviders,
  user: userInteraction,
  wait: waitUtils,
  validate: validators,
  cleanup
};

export default testUtils;