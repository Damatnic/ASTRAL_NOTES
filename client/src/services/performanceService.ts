// Performance Optimization Service for ASTRAL_NOTES
// Handles lazy loading, caching, virtualization, and performance monitoring

import { Project, Story, Scene, Character, Location } from '../types/story';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  apiLatency: number;
  cacheHitRate: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
  etag?: string;
}

interface LazyLoadConfig {
  threshold: number;
  rootMargin: string;
  preloadDistance: number;
}

interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize: number;
  overscan: number;
}

interface SearchIndex {
  id: string;
  type: string;
  title: string;
  content: string;
  tokens: string[];
  vector?: number[];
}

export class PerformanceService {
  private static instance: PerformanceService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private searchIndex: Map<string, SearchIndex> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    apiLatency: 0,
    cacheHitRate: 0
  };
  private frameCount: number = 0;
  private lastFrameTime: number = performance.now();
  private animationFrameId: number | null = null;
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB
  private currentCacheSize: number = 0;
  private workerPool: Worker[] = [];
  private workerIndex: number = 0;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initialize(): void {
    // Initialize performance monitoring
    this.setupPerformanceObserver();
    this.startFPSMonitoring();
    this.setupMemoryMonitoring();
    
    // Initialize worker pool for heavy computations
    this.initializeWorkerPool();
    
    // Setup request idle callback for background tasks
    this.scheduleIdleTasks();
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  // Performance Monitoring
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.metrics.loadTime = entry.duration;
          } else if (entry.entryType === 'resource') {
            // Track resource loading times
            this.trackResourceTiming(entry as PerformanceResourceTiming);
          } else if (entry.entryType === 'measure') {
            // Track custom measurements
            this.trackCustomMeasure(entry);
          }
        }
      });
      
      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'measure', 'paint', 'largest-contentful-paint']
      });
    }
  }

  private startFPSMonitoring(): void {
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.frameCount++;
      
      if (delta >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      this.animationFrameId = requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        // Trigger garbage collection if memory usage is high
        if (this.metrics.memoryUsage > 0.9) {
          this.performGarbageCollection();
        }
      }, 5000);
    }
  }

  private trackResourceTiming(entry: PerformanceResourceTiming): void {
    // Track API latency
    if (entry.name.includes('/api/')) {
      const latency = entry.responseEnd - entry.fetchStart;
      this.metrics.apiLatency = (this.metrics.apiLatency * 0.9) + (latency * 0.1); // Moving average
    }
  }

  private trackCustomMeasure(entry: PerformanceEntry): void {
    if (entry.name === 'render-time') {
      this.metrics.renderTime = entry.duration;
    }
  }

  // Cache Management
  public cacheData<T>(key: string, data: T, ttl: number = 300000): void {
    const size = this.estimateSize(data);
    
    // Check if adding this would exceed cache limit
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      size
    };
    
    this.cache.set(key, entry);
    this.currentCacheSize += size;
  }

  public getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired (default TTL: 5 minutes)
    if (Date.now() - entry.timestamp > 300000) {
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      return null;
    }
    
    entry.hits++;
    this.updateCacheHitRate(true);
    return entry.data;
  }

  private evictLRU(): void {
    let leastUsed: [string, CacheEntry<any>] | null = null;
    let minScore = Infinity;
    
    for (const [key, entry] of this.cache) {
      const score = entry.hits / (Date.now() - entry.timestamp);
      if (score < minScore) {
        minScore = score;
        leastUsed = [key, entry];
      }
    }
    
    if (leastUsed) {
      this.cache.delete(leastUsed[0]);
      this.currentCacheSize -= leastUsed[1].size;
    }
  }

  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return str.length * 2; // Rough estimate (2 bytes per character)
  }

  private updateCacheHitRate(hit: boolean): void {
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.95) + (hit ? 0.05 : 0);
  }

  // Lazy Loading
  public setupLazyLoading(config: LazyLoadConfig = {
    threshold: 0.1,
    rootMargin: '50px',
    preloadDistance: 2
  }): IntersectionObserver {
    const observerId = `lazy-${Date.now()}`;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const loadCallback = element.dataset.loadCallback;
          
          if (loadCallback) {
            // Execute load callback
            this.executeLazyLoad(element, loadCallback);
          }
          
          // Preload nearby items
          this.preloadNearbyItems(element, config.preloadDistance);
          
          observer.unobserve(element);
        }
      });
    }, {
      threshold: config.threshold,
      rootMargin: config.rootMargin
    });
    
    this.observers.set(observerId, observer);
    return observer;
  }

  private executeLazyLoad(element: HTMLElement, callback: string): void {
    // Execute callback function by name
    if (callback in window) {
      (window as any)[callback](element);
    }
  }

  private preloadNearbyItems(element: HTMLElement, distance: number): void {
    const parent = element.parentElement;
    if (!parent) return;
    
    const children = Array.from(parent.children);
    const index = children.indexOf(element);
    
    // Preload items before and after
    for (let i = Math.max(0, index - distance); i <= Math.min(children.length - 1, index + distance); i++) {
      const child = children[i] as HTMLElement;
      if (child.dataset.preload === 'true' && !child.dataset.loaded) {
        this.preloadResource(child);
      }
    }
  }

  private preloadResource(element: HTMLElement): void {
    const src = element.dataset.src;
    if (src) {
      if (element.tagName === 'IMG') {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          (element as HTMLImageElement).src = src;
          element.dataset.loaded = 'true';
        };
      } else {
        // Preload other resources
        fetch(src).then(() => {
          element.dataset.loaded = 'true';
        });
      }
    }
  }

  // Virtualization
  public createVirtualScroller(config: VirtualizationConfig): {
    render: (items: any[], container: HTMLElement) => void;
    scrollTo: (index: number) => void;
    update: () => void;
  } {
    let scrollTop = 0;
    let visibleStart = 0;
    let visibleEnd = 0;
    
    const totalHeight = config.itemHeight * 1000; // Assume max 1000 items
    const visibleCount = Math.ceil(config.containerHeight / config.itemHeight);
    
    const render = (items: any[], container: HTMLElement) => {
      // Calculate visible range
      visibleStart = Math.max(0, Math.floor(scrollTop / config.itemHeight) - config.overscan);
      visibleEnd = Math.min(items.length, visibleStart + visibleCount + config.overscan * 2);
      
      // Clear container
      container.innerHTML = '';
      
      // Add spacer for items above
      const topSpacer = document.createElement('div');
      topSpacer.style.height = `${visibleStart * config.itemHeight}px`;
      container.appendChild(topSpacer);
      
      // Render visible items
      for (let i = visibleStart; i < visibleEnd; i++) {
        const itemElement = this.renderVirtualItem(items[i], i, config.itemHeight);
        container.appendChild(itemElement);
      }
      
      // Add spacer for items below
      const bottomSpacer = document.createElement('div');
      bottomSpacer.style.height = `${Math.max(0, (items.length - visibleEnd) * config.itemHeight)}px`;
      container.appendChild(bottomSpacer);
    };
    
    const scrollTo = (index: number) => {
      scrollTop = index * config.itemHeight;
    };
    
    const update = () => {
      // Re-render on scroll or resize
    };
    
    return { render, scrollTo, update };
  }

  private renderVirtualItem(item: any, index: number, height: number): HTMLElement {
    const element = document.createElement('div');
    element.style.height = `${height}px`;
    element.className = 'virtual-item';
    element.dataset.index = index.toString();
    
    // Render item content
    element.innerHTML = `
      <div class="p-4">
        ${item.title || item.name || `Item ${index}`}
      </div>
    `;
    
    return element;
  }

  // Search Indexing
  public async buildSearchIndex(items: any[]): Promise<void> {
    // Use worker for heavy indexing
    const worker = this.getWorker();
    
    return new Promise((resolve) => {
      worker.postMessage({
        type: 'build-index',
        items
      });
      
      worker.onmessage = (event) => {
        if (event.data.type === 'index-built') {
          event.data.index.forEach((entry: SearchIndex) => {
            this.searchIndex.set(entry.id, entry);
          });
          resolve();
        }
      };
    });
  }

  public search(query: string, limit: number = 10): any[] {
    const queryTokens = this.tokenize(query.toLowerCase());
    const results: Array<{ item: SearchIndex; score: number }> = [];
    
    for (const [id, entry] of this.searchIndex) {
      const score = this.calculateSearchScore(queryTokens, entry.tokens);
      if (score > 0) {
        results.push({ item: entry, score });
      }
    }
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.item);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private calculateSearchScore(queryTokens: string[], documentTokens: string[]): number {
    let score = 0;
    const documentSet = new Set(documentTokens);
    
    for (const token of queryTokens) {
      if (documentSet.has(token)) {
        score += 1;
      }
      
      // Partial matches
      for (const docToken of documentTokens) {
        if (docToken.includes(token) || token.includes(docToken)) {
          score += 0.5;
        }
      }
    }
    
    return score / queryTokens.length;
  }

  // Worker Pool Management
  private initializeWorkerPool(): void {
    const workerCount = navigator.hardwareConcurrency || 4;
    
    for (let i = 0; i < workerCount; i++) {
      // Create inline worker for processing
      const workerCode = `
        self.addEventListener('message', (event) => {
          const { type, items } = event.data;
          
          if (type === 'build-index') {
            const index = items.map(item => ({
              id: item.id,
              type: item.type || 'unknown',
              title: item.title || item.name || '',
              content: item.content || item.description || '',
              tokens: tokenize(item.title + ' ' + (item.content || ''))
            }));
            
            self.postMessage({ type: 'index-built', index });
          }
        });
        
        function tokenize(text) {
          return text
            .toLowerCase()
            .replace(/[^\\w\\s]/g, '')
            .split(/\\s+/)
            .filter(token => token.length > 2);
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      this.workerPool.push(worker);
    }
  }

  private getWorker(): Worker {
    const worker = this.workerPool[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workerPool.length;
    return worker;
  }

  // Background Tasks
  private scheduleIdleTasks(): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        while (deadline.timeRemaining() > 0) {
          this.performIdleTask();
        }
        
        // Schedule next idle period
        this.scheduleIdleTasks();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.performIdleTask();
        this.scheduleIdleTasks();
      }, 1000);
    }
  }

  private performIdleTask(): void {
    // Cleanup old cache entries
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > 600000) { // 10 minutes
        this.cache.delete(key);
        this.currentCacheSize -= entry.size;
      }
    }
    
    // Optimize search index
    this.optimizeSearchIndex();
  }

  private optimizeSearchIndex(): void {
    // Remove duplicate tokens and optimize storage
    for (const [id, entry] of this.searchIndex) {
      entry.tokens = [...new Set(entry.tokens)];
    }
  }

  // Memory Management
  private performGarbageCollection(): void {
    // Clear unused caches
    this.cache.clear();
    this.currentCacheSize = 0;
    
    // Clear unused observers
    for (const [id, observer] of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Trigger browser GC if possible
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // Preloading
  private preloadCriticalResources(): void {
    // Preload fonts
    const fonts = [
      '/fonts/inter-var.woff2',
      '/fonts/jetbrains-mono.woff2'
    ];
    
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
    
    // Preconnect to API
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://api.astralnotes.com';
    document.head.appendChild(preconnect);
  }

  // Debouncing and Throttling
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    };
  }

  public throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  // Code Splitting
  public async loadChunk(chunkName: string): Promise<any> {
    const cachedChunk = this.getCached(`chunk-${chunkName}`);
    if (cachedChunk) {
      return cachedChunk;
    }
    
    try {
      const module = await import(/* @vite-ignore */ `../chunks/${chunkName}.js`);
      this.cacheData(`chunk-${chunkName}`, module);
      return module;
    } catch (error) {
      console.error(`Failed to load chunk: ${chunkName}`, error);
      throw error;
    }
  }

  // Performance Marks
  public mark(name: string): void {
    performance.mark(name);
  }

  public measure(name: string, startMark: string, endMark?: string): void {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }
  }

  // Get Metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getCacheStats(): {
    size: number;
    maxSize: number;
    entries: number;
    hitRate: number;
  } {
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      entries: this.cache.size,
      hitRate: this.metrics.cacheHitRate
    };
  }

  // Cleanup
  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    
    for (const worker of this.workerPool) {
      worker.terminate();
    }
    
    this.cache.clear();
    this.searchIndex.clear();
  }

  // Batch Operations
  public batchUpdate<T>(
    items: T[],
    updateFn: (item: T) => void,
    batchSize: number = 10
  ): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      
      const processBatch = () => {
        const end = Math.min(index + batchSize, items.length);
        
        for (let i = index; i < end; i++) {
          updateFn(items[i]);
        }
        
        index = end;
        
        if (index < items.length) {
          requestAnimationFrame(processBatch);
        } else {
          resolve();
        }
      };
      
      processBatch();
    });
  }

  // Image Optimization
  public optimizeImage(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas dimensions
        canvas.width = options.width || img.width;
        canvas.height = options.height || img.height;
        
        // Draw and resize image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to desired format
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          `image/${options.format || 'webp'}`,
          options.quality || 0.85
        );
      };
      
      img.onerror = reject;
      img.src = src;
    });
  }
}

export default PerformanceService.getInstance();