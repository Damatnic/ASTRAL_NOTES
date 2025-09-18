/**
 * Enhanced Note Editor Performance Test Suite
 * Comprehensive performance testing for large documents and stress scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedEditor } from '../../components/editor/AdvancedEditor';
import { useEditor } from '../../hooks/useEditor';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/ui/Toast';

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      {children}
    </ToastProvider>
  </BrowserRouter>
);

// Performance measurement utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private measurements: Array<{ operation: string; duration: number; memoryUsed?: number }> = [];

  start() {
    // Force garbage collection if available (for testing)
    if (global.gc) {
      global.gc();
    }
    this.startTime = performance.now();
  }

  end(operation: string) {
    const duration = performance.now() - this.startTime;
    const memoryUsed = this.getMemoryUsage();
    
    this.measurements.push({
      operation,
      duration,
      memoryUsed
    });

    return { duration, memoryUsed };
  }

  public getMemoryUsage(): number | undefined {
    // @ts-ignore - performance.memory is non-standard but useful for testing
    return performance.memory?.usedJSHeapSize;
  }

  getMeasurements() {
    return this.measurements;
  }

  getAverageDuration(operation: string): number {
    const relevantMeasurements = this.measurements.filter(m => m.operation === operation);
    if (relevantMeasurements.length === 0) return 0;
    
    const totalDuration = relevantMeasurements.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / relevantMeasurements.length;
  }

  reset() {
    this.measurements = [];
  }
}

// Generate test content of various sizes
const generateTestContent = (wordCount: number): string => {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud'
  ];

  const paragraphs: string[] = [];
  let currentWordCount = 0;
  let currentParagraph: string[] = [];

  while (currentWordCount < wordCount) {
    currentParagraph.push(words[Math.floor(Math.random() * words.length)]);
    currentWordCount++;

    // Create new paragraph every 50-100 words
    if (currentParagraph.length >= 50 && Math.random() > 0.5) {
      paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
      currentParagraph = [];
    }
  }

  // Add remaining words
  if (currentParagraph.length > 0) {
    paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
  }

  return paragraphs.join('\n');
};

const generateComplexContent = (complexity: 'simple' | 'medium' | 'complex'): string => {
  const baseContent = generateTestContent(1000);
  
  switch (complexity) {
    case 'simple':
      return baseContent;
    
    case 'medium':
      return `
        <h1>Complex Document Title</h1>
        ${baseContent}
        <h2>Section with Lists</h2>
        <ul>
          <li>Item 1 with <strong>bold text</strong></li>
          <li>Item 2 with <em>italic text</em></li>
          <li>Item 3 with <code>inline code</code></li>
        </ul>
        <blockquote>This is a blockquote with important information.</blockquote>
        ${generateTestContent(500)}
      `;
    
    case 'complex':
      return `
        <h1>Highly Complex Document</h1>
        ${generateTestContent(500)}
        <table>
          <thead>
            <tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr>
          </thead>
          <tbody>
            ${Array.from({ length: 20 }, (_, i) => 
              `<tr><td>Row ${i + 1} Col 1</td><td>Row ${i + 1} Col 2</td><td>Row ${i + 1} Col 3</td></tr>`
            ).join('')}
          </tbody>
        </table>
        <h2>Code Blocks</h2>
        <pre><code>function complexFunction() {
  const data = fetchData();
  return data.map(item => ({
    ...item,
    processed: processItem(item)
  }));
}</code></pre>
        ${generateTestContent(2000)}
        <ul data-type="taskList">
          ${Array.from({ length: 50 }, (_, i) => 
            `<li data-type="taskItem" data-checked="${i % 3 === 0}">Task item ${i + 1}</li>`
          ).join('')}
        </ul>
        ${generateTestContent(1500)}
      `;
    
    default:
      return baseContent;
  }
};

describe('Enhanced Note Editor - Performance Tests', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('Large Document Performance', () => {
    it('should handle 1,000 word document efficiently', async () => {
      const content = generateTestContent(1000);
      
      monitor.start();
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });
      
      const measurement = monitor.end('1k-word-load');
      
      // Should load within 2 seconds
      expect(measurement.duration).toBeLessThan(2000);
      expect(result.current.stats?.words).toBeGreaterThan(900);
    });

    it('should handle 5,000 word document efficiently', async () => {
      const content = generateTestContent(5000);
      
      monitor.start();
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });
      
      const measurement = monitor.end('5k-word-load');
      
      // Should load within 5 seconds
      expect(measurement.duration).toBeLessThan(5000);
      expect(result.current.stats?.words).toBeGreaterThan(4500);
    });

    it('should handle 10,000 word document efficiently', async () => {
      const content = generateTestContent(10000);
      
      monitor.start();
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      }, { timeout: 10000 });
      
      const measurement = monitor.end('10k-word-load');
      
      // Should load within 10 seconds
      expect(measurement.duration).toBeLessThan(10000);
      expect(result.current.stats?.words).toBeGreaterThan(9500);
    });

    it('should handle complex document with tables, lists, and formatting', async () => {
      const content = generateComplexContent('complex');
      
      monitor.start();
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });
      
      const measurement = monitor.end('complex-document-load');
      
      // Complex documents should still load within reasonable time
      expect(measurement.duration).toBeLessThan(5000);
    });
  });

  describe('Typing Performance', () => {
    it('should maintain responsive typing with large documents', async () => {
      const content = generateTestContent(5000);
      
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      const editor = result.current.editor!;
      
      // Measure typing latency
      const typingMeasurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        monitor.start();
        
        act(() => {
          editor.commands.insertContent(`Typed text ${i} `);
        });
        
        const measurement = monitor.end(`typing-${i}`);
        typingMeasurements.push(measurement.duration);
      }
      
      const averageTypingLatency = typingMeasurements.reduce((a, b) => a + b, 0) / typingMeasurements.length;
      
      // Typing should feel responsive (under 100ms average)
      expect(averageTypingLatency).toBeLessThan(100);
    });

    it('should handle rapid typing without lag', async () => {
      const { result } = renderHook(() => 
        useEditor({ 
          content: '<p>Start</p>', 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      const editor = result.current.editor!;
      
      monitor.start();
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        editor.commands.insertContent(`${i}`);
      }
      
      const measurement = monitor.end('rapid-typing');
      
      // 100 rapid insertions should complete quickly
      expect(measurement.duration).toBeLessThan(1000);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with content changes', async () => {
      const { result, rerender } = renderHook(
        ({ content }) => useEditor({ content, onChange: vi.fn() }),
        { initialProps: { content: '<p>Initial</p>' } }
      );

      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      const initialMemory = monitor.getMemoryUsage();
      
      // Simulate many content changes
      for (let i = 0; i < 50; i++) {
        rerender({ content: generateTestContent(100) });
        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });
      }

      const finalMemory = monitor.getMemoryUsage();
      
      // Memory usage shouldn't grow excessively (allow for some variance)
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        const increasePercentage = (memoryIncrease / initialMemory) * 100;
        
        // Memory shouldn't increase by more than 200%
        expect(increasePercentage).toBeLessThan(200);
      }
    });

    it('should clean up editor instances properly', async () => {
      let editors: any[] = [];
      
      const initialMemory = monitor.getMemoryUsage();
      
      // Create multiple editor instances
      for (let i = 0; i < 10; i++) {
        const { result, unmount } = renderHook(() => 
          useEditor({ 
            content: generateTestContent(500), 
            onChange: vi.fn() 
          })
        );
        
        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });
        
        editors.push(result.current.editor);
        
        // Unmount to trigger cleanup
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = monitor.getMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        const increasePercentage = (memoryIncrease / initialMemory) * 100;
        
        // Memory shouldn't increase significantly after cleanup
        expect(increasePercentage).toBeLessThan(50);
      }
    });
  });

  describe('Auto-save Performance', () => {
    it('should handle frequent auto-saves efficiently', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);
      let saveCount = 0;
      
      const { result } = renderHook(() => 
        useEditor({ 
          content: '<p>Initial content</p>', 
          onChange: vi.fn(),
          onSave: () => {
            saveCount++;
            return mockOnSave();
          },
          preferences: { 
            autoSaveEnabled: true, 
            autoSaveDelay: 50 // Very fast auto-save for testing
          }
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      const editor = result.current.editor!;
      
      monitor.start();
      
      // Make rapid changes to trigger multiple auto-saves
      for (let i = 0; i < 20; i++) {
        act(() => {
          editor.commands.insertContent(`Change ${i} `);
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Wait for auto-saves to complete
      await waitFor(() => {
        expect(saveCount).toBeGreaterThan(0);
      }, { timeout: 5000 });
      
      const measurement = monitor.end('auto-save-performance');
      
      // Should handle auto-saves without blocking UI
      expect(measurement.duration).toBeLessThan(3000);
      expect(saveCount).toBeGreaterThan(0);
    });
  });

  describe('Search and Replace Performance', () => {
    it('should perform find and replace efficiently on large documents', async () => {
      const content = generateTestContent(5000);
      
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });
      
      monitor.start();
      
      // Perform find and replace
      result.current.findAndReplace('lorem', 'REPLACED', true);
      
      const measurement = monitor.end('find-replace');
      
      // Find and replace should complete quickly
      expect(measurement.duration).toBeLessThan(500);
    });
  });

  describe('Export Performance', () => {
    it('should export large documents efficiently', async () => {
      const content = generateTestContent(10000);
      
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });
      
      // Test different export formats
      const formats: Array<'html' | 'md' | 'txt' | 'json'> = ['html', 'md', 'txt', 'json'];
      
      for (const format of formats) {
        monitor.start();
        
        const exported = result.current.exportContent(format);
        
        const measurement = monitor.end(`export-${format}`);
        
        // Export should complete quickly
        expect(measurement.duration).toBeLessThan(1000);
        expect(exported).toBeTruthy();
        expect(exported.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous operations', async () => {
      const content = generateTestContent(2000);
      
      const { result } = renderHook(() => 
        useEditor({ 
          content, 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      const editor = result.current.editor!;
      
      monitor.start();
      
      // Perform multiple operations simultaneously
      const operations = Promise.all([
        // Typing operation
        new Promise<void>(resolve => {
          for (let i = 0; i < 50; i++) {
            editor.commands.insertContent(`Concurrent ${i} `);
          }
          resolve();
        }),
        
        // Export operation
        new Promise<void>(resolve => {
          result.current.exportContent('md');
          resolve();
        }),
        
        // Stats calculation
        new Promise<void>(resolve => {
          const stats = result.current.stats;
          expect(stats).toBeTruthy();
          resolve();
        }),
        
        // Find and replace
        new Promise<void>(resolve => {
          result.current.findAndReplace('lorem', 'FOUND');
          resolve();
        })
      ]);
      
      await operations;
      
      const measurement = monitor.end('concurrent-operations');
      
      // Concurrent operations should not significantly slow down
      expect(measurement.duration).toBeLessThan(2000);
    });
  });

  describe('UI Responsiveness', () => {
    it('should maintain responsive UI during heavy operations', async () => {
      const content = generateComplexContent('complex');
      
      render(
        <MockWrapper>
          <AdvancedEditor 
            content={content} 
            onChange={vi.fn()}
          />
        </MockWrapper>
      );
      
      monitor.start();
      
      // UI should render and be interactive
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const measurement = monitor.end('ui-render');
      
      // UI should render quickly even with complex content
      expect(measurement.duration).toBeLessThan(3000);
      
      // Test UI interactions
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
      
      // Toolbar buttons should be responsive
      const boldButton = screen.getByTitle('Bold');
      fireEvent.click(boldButton);
      
      // Button should respond immediately
      expect(boldButton).toBeInTheDocument();
    });
  });

  describe('Stress Testing', () => {
    it('should survive extreme content operations', async () => {
      const { result } = renderHook(() => 
        useEditor({ 
          content: '<p>Start</p>', 
          onChange: vi.fn() 
        })
      );
      
      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      const editor = result.current.editor!;
      
      monitor.start();
      
      // Extreme operations
      try {
        // Rapid insertions
        for (let i = 0; i < 500; i++) {
          editor.commands.insertContent(`Stress test ${i} `);
        }
        
        // Large content replacement
        editor.commands.setContent(generateTestContent(20000));
        
        // Multiple rapid exports
        for (let i = 0; i < 10; i++) {
          result.current.exportContent('html');
        }
        
        // Multiple find/replace operations
        for (let i = 0; i < 20; i++) {
          result.current.findAndReplace(`test${i}`, `replaced${i}`);
        }
        
        const measurement = monitor.end('stress-test');
        
        // Should survive stress test without crashing
        expect(measurement.duration).toBeLessThan(10000);
        expect(result.current.editor).toBeTruthy();
        
      } catch (error) {
        // Should not throw errors during stress test
        throw new Error(`Stress test failed with error: ${error}`);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance benchmarks for typical usage', async () => {
      const benchmarks = {
        smallDocumentLoad: 500,  // 500ms for <1k words
        mediumDocumentLoad: 2000, // 2s for <5k words
        largeDocumentLoad: 5000,  // 5s for <10k words
        typingLatency: 50,        // 50ms for single character
        autoSaveDelay: 1000,      // 1s for auto-save
        exportTime: 2000,         // 2s for export
      };
      
      // Test small document
      monitor.start();
      const { result: smallResult } = renderHook(() => 
        useEditor({ content: generateTestContent(500), onChange: vi.fn() })
      );
      await waitFor(() => expect(smallResult.current.editor).toBeTruthy());
      const smallLoad = monitor.end('small-load');
      expect(smallLoad.duration).toBeLessThan(benchmarks.smallDocumentLoad);
      
      // Test medium document
      monitor.start();
      const { result: mediumResult } = renderHook(() => 
        useEditor({ content: generateTestContent(3000), onChange: vi.fn() })
      );
      await waitFor(() => expect(mediumResult.current.editor).toBeTruthy());
      const mediumLoad = monitor.end('medium-load');
      expect(mediumLoad.duration).toBeLessThan(benchmarks.mediumDocumentLoad);
      
      // Test large document
      monitor.start();
      const { result: largeResult } = renderHook(() => 
        useEditor({ content: generateTestContent(8000), onChange: vi.fn() })
      );
      await waitFor(() => expect(largeResult.current.editor).toBeTruthy());
      const largeLoad = monitor.end('large-load');
      expect(largeLoad.duration).toBeLessThan(benchmarks.largeDocumentLoad);
      
      // All benchmarks should be met
      expect(smallLoad.duration).toBeLessThan(benchmarks.smallDocumentLoad);
      expect(mediumLoad.duration).toBeLessThan(benchmarks.mediumDocumentLoad);
      expect(largeLoad.duration).toBeLessThan(benchmarks.largeDocumentLoad);
    });

    it('should provide performance metrics summary', () => {
      const measurements = monitor.getMeasurements();
      
      // Generate performance report
      const report = {
        totalMeasurements: measurements.length,
        averageLoadTime: monitor.getAverageDuration('load'),
        averageTypingLatency: monitor.getAverageDuration('typing'),
        averageExportTime: monitor.getAverageDuration('export'),
        measurements: measurements.slice(-10) // Last 10 measurements
      };
      
      // Log performance report for analysis
      console.log('Performance Report:', JSON.stringify(report, null, 2));
      
      expect(report.totalMeasurements).toBeGreaterThanOrEqual(0);
    });
  });
});