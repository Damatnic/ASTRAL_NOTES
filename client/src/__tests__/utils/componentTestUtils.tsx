/**
 * ASTRAL_NOTES Component Testing Utils
 * Phase 3: Comprehensive UI Component Testing Framework
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode, Component } from 'react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Vitest matchers for accessibility
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend(toHaveNoViolations);
}

// Mock store configuration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }, action) => state,
      notes: (state = { notes: [], loading: false }, action) => state,
      projects: (state = { projects: [], currentProject: null }, action) => state,
      ui: (state = { theme: 'light', sidebarOpen: true }, action) => state,
      ...initialState
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false
    })
  });
};

// Test wrapper for React components
interface TestWrapperProps {
  children: ReactNode;
  store?: ReturnType<typeof createMockStore>;
  router?: boolean;
}

const TestWrapper = ({ children, store, router = true }: TestWrapperProps) => {
  const mockStore = store || createMockStore();
  
  const wrapper = (
    <Provider store={mockStore}>
      {children}
    </Provider>
  );

  return router ? <BrowserRouter>{wrapper}</BrowserRouter> : wrapper;
};

// Enhanced render function with default providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: ReturnType<typeof createMockStore>;
  router?: boolean;
}

export const renderComponent = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { store, router = true, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper store={store} router={router}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
};

// Performance testing utilities
export class PerformanceTestUtils {
  static async measureRenderTime(component: ReactElement, options?: CustomRenderOptions): Promise<number> {
    const startTime = performance.now();
    renderComponent(component, options);
    const endTime = performance.now();
    return endTime - startTime;
  }

  static async measureInteractionTime(
    component: ReactElement,
    interaction: () => Promise<void> | void,
    options?: CustomRenderOptions
  ): Promise<number> {
    renderComponent(component, options);
    const startTime = performance.now();
    await interaction();
    const endTime = performance.now();
    return endTime - startTime;
  }

  static async benchmarkComponent(
    component: ReactElement,
    iterations: number = 10,
    options?: CustomRenderOptions
  ): Promise<{ average: number; min: number; max: number; total: number }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const time = await this.measureRenderTime(component, options);
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

// Accessibility testing utilities
export class AccessibilityTestUtils {
  static async checkA11y(container: HTMLElement): Promise<void> {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }

  static async testKeyboardNavigation(element: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    
    // Test Tab navigation
    await user.tab();
    expect(element).toHaveFocus();
    
    // Test Enter/Space activation
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      const clickSpy = vi.fn();
      element.addEventListener('click', clickSpy);
      
      await user.keyboard('{Enter}');
      expect(clickSpy).toHaveBeenCalled();
      
      clickSpy.mockClear();
      await user.keyboard(' ');
      expect(clickSpy).toHaveBeenCalled();
    }
  }

  static async testScreenReaderLabels(element: HTMLElement): Promise<void> {
    // Check for accessible name
    const accessibleName = element.getAttribute('aria-label') || 
                          element.getAttribute('aria-labelledby') ||
                          element.textContent;
    
    expect(accessibleName).toBeTruthy();
    expect(accessibleName?.trim()).not.toBe('');
  }

  static async testColorContrast(element: HTMLElement): Promise<void> {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Basic check - in real implementation would use contrast calculation
    expect(backgroundColor).not.toBe(color);
  }

  static async testAriaStates(element: HTMLElement, expectedStates: Record<string, string>): Promise<void> {
    Object.entries(expectedStates).forEach(([attribute, value]) => {
      expect(element.getAttribute(attribute)).toBe(value);
    });
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

  static async testResponsiveDesign(
    component: ReactElement,
    viewports: Array<{ width: number; height: number; name: string }>
  ): Promise<void> {
    for (const viewport of viewports) {
      Object.defineProperty(window, 'innerWidth', { value: viewport.width, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: viewport.height, configurable: true });
      window.dispatchEvent(new Event('resize'));
      
      const { container } = renderComponent(component);
      
      // Wait for any responsive changes
      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument();
      });
      
      // Component should render without errors on all viewports
      expect(container).toBeInTheDocument();
    }
  }

  static mockTouchEvents(): void {
    // Mock touch events for mobile testing
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

// Component interaction testing utilities
export class InteractionTestUtils {
  static async testUserFlow(
    component: ReactElement,
    steps: Array<{
      action: () => Promise<void> | void;
      assertion: () => Promise<void> | void;
      description: string;
    }>
  ): Promise<void> {
    renderComponent(component);
    
    for (const step of steps) {
      try {
        await step.action();
        await step.assertion();
      } catch (error) {
        throw new Error(`Step "${step.description}" failed: ${error}`);
      }
    }
  }

  static async testFormValidation(
    form: HTMLFormElement,
    validationCases: Array<{
      input: Record<string, string>;
      expectedErrors: string[];
      description: string;
    }>
  ): Promise<void> {
    const user = userEvent.setup();
    
    for (const testCase of validationCases) {
      // Clear form
      const inputs = form.querySelectorAll('input, textarea, select');
      for (const input of inputs) {
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          await user.clear(input);
        }
      }
      
      // Fill form with test data
      for (const [fieldName, value] of Object.entries(testCase.input)) {
        const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
        if (field) {
          await user.type(field, value);
        }
      }
      
      // Submit form
      const submitButton = form.querySelector('[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        await user.click(submitButton);
      }
      
      // Check for expected errors
      await waitFor(() => {
        testCase.expectedErrors.forEach(error => {
          expect(screen.getByText(error)).toBeInTheDocument();
        });
      });
    }
  }

  static async testAsyncStates(
    component: ReactElement,
    asyncAction: () => Promise<void>,
    states: {
      loading?: string;
      success?: string;
      error?: string;
    }
  ): Promise<void> {
    renderComponent(component);
    
    // Trigger async action
    const actionPromise = asyncAction();
    
    // Check loading state
    if (states.loading) {
      await waitFor(() => {
        expect(screen.getByText(states.loading!)).toBeInTheDocument();
      });
    }
    
    // Wait for completion
    await actionPromise;
    
    // Check final state
    if (states.success) {
      await waitFor(() => {
        expect(screen.getByText(states.success!)).toBeInTheDocument();
      });
    }
    
    if (states.error) {
      await waitFor(() => {
        expect(screen.getByText(states.error!)).toBeInTheDocument();
      });
    }
  }
}

// Component snapshot testing utilities
export class SnapshotTestUtils {
  static createSnapshot(component: ReactElement, name?: string): void {
    const { container } = renderComponent(component);
    expect(container.firstChild).toMatchSnapshot(name);
  }

  static createInlineSnapshot(component: ReactElement): void {
    const { container } = renderComponent(component);
    expect(container.firstChild).toMatchInlineSnapshot();
  }
}

// Error boundary testing utilities
export class ErrorBoundaryTestUtils {
  static async testErrorHandling(
    errorBoundary: ReactElement,
    errorComponent: ReactElement
  ): Promise<void> {
    // Mock console.error to prevent test output pollution
    const originalError = console.error;
    console.error = vi.fn();
    
    try {
      renderComponent(errorBoundary);
      
      // Simulate error
      const errorElement = screen.getByTestId('error-trigger');
      fireEvent.click(errorElement);
      
      // Check error boundary rendered
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    } finally {
      console.error = originalError;
    }
  }
}

// Export all utilities
export {
  createMockStore,
  TestWrapper,
  userEvent,
  screen,
  fireEvent,
  waitFor,
  vi
};

// Common test patterns
export const testPatterns = {
  async renderAndCheck(component: ReactElement, testId: string): Promise<HTMLElement> {
    renderComponent(component);
    const element = await screen.findByTestId(testId);
    expect(element).toBeInTheDocument();
    return element;
  },

  async clickAndWait(element: HTMLElement, expectedChange: () => void): Promise<void> {
    const user = userEvent.setup();
    await user.click(element);
    await waitFor(expectedChange);
  },

  async typeAndSubmit(input: HTMLElement, value: string, form?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.type(input, value);
    
    if (form) {
      fireEvent.submit(form);
    } else {
      await user.keyboard('{Enter}');
    }
  }
};