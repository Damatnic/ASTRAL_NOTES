/**
 * Performance Benchmark
 * Comprehensive performance monitoring and benchmarking for test execution
 */

import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime?: number;
  loadTime?: number;
  interactionTime?: number;
  networkRequests?: number;
  cacheHits?: number;
  errors?: number;
}

export interface BenchmarkResult {
  startTime: number;
  endTime: number;
  duration: number;
  metrics: PerformanceMetrics;
  samples: PerformanceMetrics[];
  baseline?: PerformanceMetrics;
  comparison?: {
    improvement: number;
    regression: number;
    status: 'improved' | 'regressed' | 'stable';
  };
}

export interface PerformanceThresholds {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
  maxLoadTime: number;
  maxInteractionTime: number;
}

export class PerformanceBenchmark {
  private startTime: number = 0;
  private samples: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring: boolean = false;
  private baseline: PerformanceMetrics | null = null;
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxExecutionTime: 30000, // 30 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxRenderTime: 16, // 60fps
      maxLoadTime: 3000, // 3 seconds
      maxInteractionTime: 100, // 100ms
      ...thresholds,
    };
  }

  /**
   * Start performance monitoring
   */
  async start(): Promise<void> {
    console.log('⚡ Starting performance monitoring...');
    
    this.startTime = performance.now();
    this.isMonitoring = true;
    this.samples = [];
    
    // Setup performance observers
    this.setupPerformanceObservers();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Mark the start for measurement
    if (typeof performance.mark === 'function') {
      performance.mark('benchmark-start');
    }
    
    console.log('✅ Performance monitoring started');
  }

  /**
   * Stop performance monitoring and return results
   */
  async stop(): Promise<BenchmarkResult> {
    console.log('🛑 Stopping performance monitoring...');
    
    const endTime = performance.now();
    this.isMonitoring = false;
    
    // Mark the end for measurement
    if (typeof performance.mark === 'function') {
      performance.mark('benchmark-end');
      performance.measure('benchmark-duration', 'benchmark-start', 'benchmark-end');
    }
    
    // Cleanup observers
    this.cleanupObservers();
    
    // Calculate final metrics
    const finalMetrics = await this.calculateFinalMetrics();
    
    const result: BenchmarkResult = {
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      metrics: finalMetrics,
      samples: [...this.samples],
      baseline: this.baseline,
    };
    
    // Add comparison if baseline exists
    if (this.baseline) {
      result.comparison = this.compareWithBaseline(finalMetrics);
    }
    
    console.log(`✅ Performance monitoring stopped. Duration: ${Math.round(result.duration)}ms`);
    return result;
  }

  /**
   * Take a performance sample
   */
  sample(label?: string): PerformanceMetrics {
    if (!this.isMonitoring) {
      console.warn('Performance monitoring not active');
      return this.createEmptyMetrics();
    }

    const metrics = this.captureCurrentMetrics(label);
    this.samples.push(metrics);
    
    return metrics;
  }

  /**
   * Set baseline for comparison
   */
  setBaseline(metrics: PerformanceMetrics): void {
    this.baseline = { ...metrics };
    console.log('📊 Performance baseline set');
  }

  /**
   * Load baseline from previous run
   */
  async loadBaseline(): Promise<void> {
    // In a real implementation, this would load from storage
    // For now, we'll use mock baseline data
    this.baseline = {
      executionTime: 5000,
      memoryUsage: 50 * 1024 * 1024, // 50MB
      cpuUsage: 20,
      renderTime: 10,
      loadTime: 1500,
      interactionTime: 50,
      networkRequests: 25,
      cacheHits: 80,
      errors: 0,
    };
    
    console.log('📊 Performance baseline loaded');
  }

  /**
   * Validate performance against thresholds
   */
  validatePerformance(metrics: PerformanceMetrics): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    if (metrics.executionTime > this.thresholds.maxExecutionTime) {
      violations.push(`Execution time ${metrics.executionTime}ms exceeds threshold ${this.thresholds.maxExecutionTime}ms`);
    }
    
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      violations.push(`Memory usage ${Math.round(metrics.memoryUsage / (1024 * 1024))}MB exceeds threshold ${Math.round(this.thresholds.maxMemoryUsage / (1024 * 1024))}MB`);
    }
    
    if (metrics.renderTime && metrics.renderTime > this.thresholds.maxRenderTime) {
      violations.push(`Render time ${metrics.renderTime}ms exceeds threshold ${this.thresholds.maxRenderTime}ms`);
    }
    
    if (metrics.loadTime && metrics.loadTime > this.thresholds.maxLoadTime) {
      violations.push(`Load time ${metrics.loadTime}ms exceeds threshold ${this.thresholds.maxLoadTime}ms`);
    }
    
    if (metrics.interactionTime && metrics.interactionTime > this.thresholds.maxInteractionTime) {
      violations.push(`Interaction time ${metrics.interactionTime}ms exceeds threshold ${this.thresholds.maxInteractionTime}ms`);
    }
    
    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(result: BenchmarkResult): {
    summary: string;
    details: any;
    recommendations: string[];
  } {
    const avgMetrics = this.calculateAverageMetrics(result.samples);
    const validation = this.validatePerformance(result.metrics);
    
    let summary = `Performance test completed in ${Math.round(result.duration)}ms. `;
    summary += validation.passed ? '✅ All thresholds met.' : `❌ ${validation.violations.length} threshold(s) exceeded.`;
    
    const details = {
      duration: result.duration,
      finalMetrics: result.metrics,
      averageMetrics: avgMetrics,
      samples: result.samples.length,
      validation,
      comparison: result.comparison,
    };
    
    const recommendations = this.generateRecommendations(result);
    
    return { summary, details, recommendations };
  }

  /**
   * Benchmark a specific function
   */
  async benchmarkFunction<T>(
    fn: () => Promise<T> | T,
    iterations: number = 1,
    warmup: number = 0
  ): Promise<{
    result: T;
    metrics: PerformanceMetrics;
    iterations: number;
    averageTime: number;
  }> {
    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      await fn();
    }
    
    const startTime = performance.now();
    let result: T;
    
    // Main benchmark runs
    for (let i = 0; i < iterations; i++) {
      result = await fn();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    const metrics = this.captureCurrentMetrics(`benchmark-function-${iterations}-iterations`);
    metrics.executionTime = totalTime;
    
    return {
      result: result!,
      metrics,
      iterations,
      averageTime,
    };
  }

  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not available');
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordPaintMetrics(entry);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe measure timing
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMeasureMetrics(entry);
          }
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (error) {
      console.warn('Error setting up performance observers:', error);
    }
  }

  private startMemoryMonitoring(): void {
    // Memory monitoring interval
    const memoryInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(memoryInterval);
        return;
      }
      
      this.recordMemoryMetrics();
    }, 1000); // Check every second
  }

  private cleanupObservers(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    this.observers = [];
  }

  private captureCurrentMetrics(label?: string): PerformanceMetrics {
    const currentTime = performance.now();
    
    return {
      executionTime: currentTime - this.startTime,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      renderTime: this.getRenderTime(),
      loadTime: this.getLoadTime(),
      interactionTime: this.getInteractionTime(),
      networkRequests: this.getNetworkRequestCount(),
      cacheHits: this.getCacheHitRate(),
      errors: this.getErrorCount(),
    };
  }

  private async calculateFinalMetrics(): Promise<PerformanceMetrics> {
    if (this.samples.length === 0) {
      return this.captureCurrentMetrics('final');
    }
    
    // Calculate averages from samples
    return this.calculateAverageMetrics(this.samples);
  }

  private calculateAverageMetrics(samples: PerformanceMetrics[]): PerformanceMetrics {
    if (samples.length === 0) {
      return this.createEmptyMetrics();
    }
    
    const sums = samples.reduce((acc, sample) => ({
      executionTime: acc.executionTime + sample.executionTime,
      memoryUsage: acc.memoryUsage + sample.memoryUsage,
      cpuUsage: acc.cpuUsage + sample.cpuUsage,
      renderTime: acc.renderTime + (sample.renderTime || 0),
      loadTime: acc.loadTime + (sample.loadTime || 0),
      interactionTime: acc.interactionTime + (sample.interactionTime || 0),
      networkRequests: acc.networkRequests + (sample.networkRequests || 0),
      cacheHits: acc.cacheHits + (sample.cacheHits || 0),
      errors: acc.errors + (sample.errors || 0),
    }), this.createEmptyMetrics());
    
    const count = samples.length;
    
    return {
      executionTime: sums.executionTime / count,
      memoryUsage: sums.memoryUsage / count,
      cpuUsage: sums.cpuUsage / count,
      renderTime: sums.renderTime / count,
      loadTime: sums.loadTime / count,
      interactionTime: sums.interactionTime / count,
      networkRequests: sums.networkRequests / count,
      cacheHits: sums.cacheHits / count,
      errors: sums.errors / count,
    };
  }

  private compareWithBaseline(metrics: PerformanceMetrics): BenchmarkResult['comparison'] {
    if (!this.baseline) {
      throw new Error('No baseline set for comparison');
    }
    
    const executionTimeDiff = ((metrics.executionTime - this.baseline.executionTime) / this.baseline.executionTime) * 100;
    const memoryDiff = ((metrics.memoryUsage - this.baseline.memoryUsage) / this.baseline.memoryUsage) * 100;
    
    let improvement = 0;
    let regression = 0;
    
    if (executionTimeDiff < 0) improvement += Math.abs(executionTimeDiff);
    else regression += executionTimeDiff;
    
    if (memoryDiff < 0) improvement += Math.abs(memoryDiff);
    else regression += memoryDiff;
    
    let status: 'improved' | 'regressed' | 'stable';
    if (improvement > 5) status = 'improved';
    else if (regression > 5) status = 'regressed';
    else status = 'stable';
    
    return { improvement, regression, status };
  }

  private generateRecommendations(result: BenchmarkResult): string[] {
    const recommendations: string[] = [];
    
    // Memory recommendations
    if (result.metrics.memoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('Consider optimizing memory usage - approaching threshold');
    }
    
    // Execution time recommendations
    if (result.metrics.executionTime > this.thresholds.maxExecutionTime * 0.8) {
      recommendations.push('Consider optimizing execution time - test suite is running slowly');
    }
    
    // Render time recommendations
    if (result.metrics.renderTime && result.metrics.renderTime > this.thresholds.maxRenderTime * 0.8) {
      recommendations.push('Consider optimizing render performance - approaching 60fps threshold');
    }
    
    // Network recommendations
    if (result.metrics.networkRequests && result.metrics.networkRequests > 50) {
      recommendations.push('High number of network requests - consider request optimization');
    }
    
    // Cache recommendations
    if (result.metrics.cacheHits && result.metrics.cacheHits < 70) {
      recommendations.push('Low cache hit rate - consider improving caching strategy');
    }
    
    return recommendations;
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    // Record navigation-specific metrics
    console.log('Navigation timing recorded:', {
      loadTime: entry.loadEventEnd - entry.navigationStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
    });
  }

  private recordPaintMetrics(entry: PerformanceEntry): void {
    // Record paint-specific metrics
    console.log('Paint timing recorded:', {
      name: entry.name,
      startTime: entry.startTime,
    });
  }

  private recordMeasureMetrics(entry: PerformanceEntry): void {
    // Record measure-specific metrics
    console.log('Measure timing recorded:', {
      name: entry.name,
      duration: entry.duration,
    });
  }

  private recordMemoryMetrics(): void {
    // Record current memory metrics
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > 0) {
      console.log('Memory usage:', Math.round(memoryUsage / (1024 * 1024)), 'MB');
    }
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      executionTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      renderTime: 0,
      loadTime: 0,
      interactionTime: 0,
      networkRequests: 0,
      cacheHits: 0,
      errors: 0,
    };
  }

  private getMemoryUsage(): number {
    // In browser environment
    if (typeof (performance as any).memory !== 'undefined') {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    // In Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Mock value for testing
    return Math.random() * 50 * 1024 * 1024; // Random value up to 50MB
  }

  private getCPUUsage(): number {
    // Mock CPU usage - in real implementation would use system monitoring
    return Math.random() * 50; // Random value up to 50%
  }

  private getRenderTime(): number {
    // Mock render time - in real implementation would measure actual render
    return Math.random() * 20; // Random value up to 20ms
  }

  private getLoadTime(): number {
    // Mock load time - in real implementation would measure actual load
    return Math.random() * 2000; // Random value up to 2000ms
  }

  private getInteractionTime(): number {
    // Mock interaction time - in real implementation would measure user interactions
    return Math.random() * 100; // Random value up to 100ms
  }

  private getNetworkRequestCount(): number {
    // Mock network request count
    return Math.floor(Math.random() * 50);
  }

  private getCacheHitRate(): number {
    // Mock cache hit rate
    return Math.random() * 100;
  }

  private getErrorCount(): number {
    // Mock error count
    return Math.floor(Math.random() * 3);
  }
}