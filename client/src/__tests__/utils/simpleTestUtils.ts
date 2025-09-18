/**
 * Simple Test Utils for ASTRAL_NOTES
 * Phase 3: Basic testing utilities without complex JSX
 */

import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

// Performance testing utilities
export class PerformanceTestUtils {
  static async measureRenderTime(renderFn: () => void): Promise<number> {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    return endTime - startTime;
  }

  static async measureInteractionTime(
    interaction: () => Promise<void> | void
  ): Promise<number> {
    const startTime = performance.now();
    await interaction();
    const endTime = performance.now();
    return endTime - startTime;
  }

  static async benchmarkOperation(
    operation: () => void,
    iterations: number = 10
  ): Promise<{ average: number; min: number; max: number; total: number }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const time = await this.measureRenderTime(operation);
      times.push(time);
    }
    
    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b, 0)
    };
  }
}

// Cross-platform testing utilities
export class CrossPlatformTestUtils {
  static mockMobileViewport(): void {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
    window.dispatchEvent(new Event('resize'));
  }

  static mockTabletViewport(): void {
    Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true });
    window.dispatchEvent(new Event('resize'));
  }

  static mockDesktopViewport(): void {
    Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
    window.dispatchEvent(new Event('resize'));
  }

  static mockTouchEvents(): void {
    const touchEventMock = {
      touches: [{ clientX: 100, clientY: 100 }],
      changedTouches: [{ clientX: 100, clientY: 100 }],
      targetTouches: [{ clientX: 100, clientY: 100 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };

    Element.prototype.dispatchEvent = vi.fn().mockImplementation((event) => {
      if (event.type.startsWith('touch')) {
        Object.assign(event, touchEventMock);
      }
      return true;
    });
  }
}

// Export all utilities
export {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  vi
};