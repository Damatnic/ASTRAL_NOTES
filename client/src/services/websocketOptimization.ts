/**
 * WebSocket Performance Optimization System
 * Optimizes real-time collaboration for 100+ concurrent users
 * Implements connection pooling, message batching, and adaptive compression
 */

export interface ConnectionPool {
  primary: WebSocket | null;
  fallback: WebSocket | null;
  dedicated: Map<string, WebSocket>; // For high-priority operations
}

export interface MessageBatch {
  id: string;
  messages: QueuedMessage[];
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  size: number;
  compressed: boolean;
}

export interface QueuedMessage {
  id: string;
  type: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retries: number;
  maxRetries: number;
  timeout?: number;
  ackRequired: boolean;
  compressed?: boolean;
}

export interface NetworkMetrics {
  latency: {
    current: number;
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    messagesPerSecond: number;
    bytesPerSecond: number;
    operationsPerSecond: number;
  };
  reliability: {
    connectionUptime: number;
    messageDeliveryRate: number;
    errorRate: number;
    reconnectionCount: number;
  };
  quality: {
    packetLoss: number;
    jitter: number;
    bandwidth: number;
    signalStrength: number;
  };
}

export interface OptimizationConfig {
  maxConcurrentConnections: number;
  connectionPoolSize: number;
  batchingConfig: {
    enabled: boolean;
    maxBatchSize: number;
    maxBatchDelay: number;
    priorityThresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
  compressionConfig: {
    enabled: boolean;
    algorithm: 'gzip' | 'deflate' | 'brotli' | 'lz4';
    threshold: number;
    adaptiveCompression: boolean;
  };
  adaptiveConfig: {
    enabled: boolean;
    qualityThresholds: {
      excellent: number;
      good: number;
      poor: number;
    };
    adaptationStrategies: AdaptationStrategy[];
  };
  loadBalancing: {
    enabled: boolean;
    strategy: 'round-robin' | 'least-connections' | 'response-time' | 'adaptive';
    healthCheckInterval: number;
  };
  errorHandling: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential' | 'adaptive';
    circuitBreakerConfig: {
      failureThreshold: number;
      recoveryTimeout: number;
      monitoringPeriod: number;
    };
  };
}

export interface AdaptationStrategy {
  name: string;
  condition: (metrics: NetworkMetrics) => boolean;
  action: (optimizer: WebSocketOptimizer) => void;
  priority: number;
}

export interface ConnectionHealth {
  id: string;
  url: string;
  status: 'healthy' | 'degraded' | 'failed' | 'recovering';
  latency: number;
  errorRate: number;
  lastHealthCheck: number;
  consecutiveFailures: number;
  load: number; // Number of active operations
}

export interface LoadBalancer {
  strategy: OptimizationConfig['loadBalancing']['strategy'];
  connections: ConnectionHealth[];
  selectConnection: () => ConnectionHealth | null;
  updateHealth: (connectionId: string, metrics: Partial<ConnectionHealth>) => void;
}

export class WebSocketOptimizer {
  private config: OptimizationConfig;
  private connectionPool: ConnectionPool;
  private messageQueue: Map<string, QueuedMessage[]>;
  private batchQueue: MessageBatch[];
  private metrics: NetworkMetrics;
  private loadBalancer: LoadBalancer;
  private compressionWorker: Worker | null = null;
  private circuitBreaker: Map<string, CircuitBreakerState>;
  private adaptationStrategies: AdaptationStrategy[];
  private performanceMonitor: PerformanceMonitor;
  private eventHandlers = new Map<string, Set<Function>>();

  // Timing and batching
  private batchTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  // Performance tracking
  private latencyHistory: number[] = [];
  private throughputHistory: number[] = [];
  private connectionAttempts = new Map<string, number>();
  private acknowledgments = new Map<string, { timestamp: number; resolved: boolean }>();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      maxConcurrentConnections: 100,
      connectionPoolSize: 5,
      batchingConfig: {
        enabled: true,
        maxBatchSize: 50,
        maxBatchDelay: 16, // ~60fps
        priorityThresholds: {
          high: 5,    // 5ms delay for high priority
          medium: 16, // 16ms delay for medium priority
          low: 100    // 100ms delay for low priority
        }
      },
      compressionConfig: {
        enabled: true,
        algorithm: 'lz4',
        threshold: 1024, // Compress messages > 1KB
        adaptiveCompression: true
      },
      adaptiveConfig: {
        enabled: true,
        qualityThresholds: {
          excellent: 50,  // <50ms latency
          good: 150,      // <150ms latency
          poor: 500       // >500ms latency
        },
        adaptationStrategies: []
      },
      loadBalancing: {
        enabled: true,
        strategy: 'adaptive',
        healthCheckInterval: 5000
      },
      errorHandling: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        circuitBreakerConfig: {
          failureThreshold: 5,
          recoveryTimeout: 30000,
          monitoringPeriod: 60000
        }
      },
      ...config
    };

    this.initializeOptimizer();
  }

  /**
   * Initialize the WebSocket optimizer
   */
  private initializeOptimizer(): void {
    this.connectionPool = {
      primary: null,
      fallback: null,
      dedicated: new Map()
    };

    this.messageQueue = new Map();
    this.batchQueue = [];
    this.circuitBreaker = new Map();

    this.metrics = {
      latency: { current: 0, average: 0, p95: 0, p99: 0 },
      throughput: { messagesPerSecond: 0, bytesPerSecond: 0, operationsPerSecond: 0 },
      reliability: { connectionUptime: 100, messageDeliveryRate: 100, errorRate: 0, reconnectionCount: 0 },
      quality: { packetLoss: 0, jitter: 0, bandwidth: 0, signalStrength: 100 }
    };

    this.loadBalancer = this.createLoadBalancer();
    this.performanceMonitor = new PerformanceMonitor();
    
    this.initializeAdaptationStrategies();
    this.startPerformanceMonitoring();
    this.setupCompressionWorker();
  }

  /**
   * Create optimized WebSocket connection with pooling
   */
  public async createOptimizedConnection(
    url: string,
    options: {
      priority?: 'high' | 'medium' | 'low';
      dedicated?: boolean;
      fallback?: boolean;
    } = {}
  ): Promise<WebSocket> {
    const connectionId = this.generateConnectionId();
    
    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen(url)) {
        throw new Error(`Circuit breaker is open for ${url}`);
      }

      // Create WebSocket with optimizations
      const ws = new WebSocket(url, {
        // Enable compression
        perMessageDeflate: this.config.compressionConfig.enabled,
        // Optimize buffer sizes
        maxPayload: 16 * 1024 * 1024, // 16MB max payload
        // Connection timeout
        handshakeTimeout: 10000
      } as any);

      // Configure WebSocket optimizations
      this.configureWebSocket(ws, connectionId, options);

      // Add to connection pool
      if (options.dedicated) {
        this.connectionPool.dedicated.set(connectionId, ws);
      } else if (options.fallback) {
        this.connectionPool.fallback = ws;
      } else {
        this.connectionPool.primary = ws;
      }

      // Update load balancer
      this.loadBalancer.connections.push({
        id: connectionId,
        url,
        status: 'healthy',
        latency: 0,
        errorRate: 0,
        lastHealthCheck: Date.now(),
        consecutiveFailures: 0,
        load: 0
      });

      await this.waitForConnection(ws);
      this.connectionAttempts.set(connectionId, 0);
      
      return ws;

    } catch (error) {
      this.handleConnectionError(url, error);
      throw error;
    }
  }

  /**
   * Send message with optimization
   */
  public async sendOptimizedMessage(
    type: string,
    data: any,
    options: {
      priority?: 'high' | 'medium' | 'low';
      ackRequired?: boolean;
      timeout?: number;
      compression?: boolean;
      connection?: string;
    } = {}
  ): Promise<void> {
    const message: QueuedMessage = {
      id: this.generateMessageId(),
      type,
      data,
      priority: options.priority || 'medium',
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.config.errorHandling.maxRetries,
      timeout: options.timeout,
      ackRequired: options.ackRequired || false,
      compressed: options.compression
    };

    // Add to queue
    const queueKey = options.connection || 'default';
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }
    this.messageQueue.get(queueKey)!.push(message);

    // Process immediately for high priority or if batching disabled
    if (message.priority === 'high' || !this.config.batchingConfig.enabled) {
      await this.processMessage(message, queueKey);
    } else {
      this.scheduleBatchProcessing(message.priority);
    }

    // Track acknowledgment if required
    if (message.ackRequired) {
      this.acknowledgments.set(message.id, {
        timestamp: Date.now(),
        resolved: false
      });
    }
  }

  /**
   * Process message queue with batching
   */
  private async processMessageQueue(): Promise<void> {
    for (const [connectionId, messages] of this.messageQueue.entries()) {
      if (messages.length === 0) continue;

      // Group messages by priority
      const priorityGroups = this.groupMessagesByPriority(messages);
      
      for (const [priority, priorityMessages] of priorityGroups.entries()) {
        if (priorityMessages.length === 0) continue;

        const batch = this.createMessageBatch(priorityMessages, priority);
        await this.processBatch(batch, connectionId);
      }

      // Clear processed messages
      this.messageQueue.set(connectionId, []);
    }
  }

  /**
   * Create message batch with compression
   */
  private createMessageBatch(messages: QueuedMessage[], priority: MessageBatch['priority']): MessageBatch {
    const batch: MessageBatch = {
      id: this.generateBatchId(),
      messages,
      priority,
      timestamp: Date.now(),
      size: 0,
      compressed: false
    };

    // Calculate batch size
    const serialized = JSON.stringify(messages);
    batch.size = new Blob([serialized]).size;

    // Apply compression if needed
    if (this.shouldCompress(batch)) {
      batch.compressed = true;
    }

    return batch;
  }

  /**
   * Process batch with optimal connection selection
   */
  private async processBatch(batch: MessageBatch, preferredConnection?: string): Promise<void> {
    try {
      // Select optimal connection
      const connection = this.selectOptimalConnection(preferredConnection, batch.priority);
      if (!connection) {
        throw new Error('No available connection');
      }

      // Compress batch if needed
      let payload = batch;
      if (batch.compressed) {
        payload = await this.compressBatch(batch);
      }

      // Send batch
      const startTime = performance.now();
      await this.sendBatch(connection, payload);
      
      // Update metrics
      const latency = performance.now() - startTime;
      this.updateLatencyMetrics(latency);
      this.updateThroughputMetrics(batch.messages.length, batch.size);

    } catch (error) {
      await this.handleBatchError(batch, error);
    }
  }

  /**
   * Select optimal connection using load balancer
   */
  private selectOptimalConnection(preferred?: string, priority?: string): WebSocket | null {
    // Use preferred connection if specified and healthy
    if (preferred) {
      const dedicated = this.connectionPool.dedicated.get(preferred);
      if (dedicated && dedicated.readyState === WebSocket.OPEN) {
        return dedicated;
      }
    }

    // Use load balancer for optimal selection
    const healthyConnection = this.loadBalancer.selectConnection();
    if (!healthyConnection) {
      return null;
    }

    // Map to actual WebSocket
    if (healthyConnection.id === 'primary' && this.connectionPool.primary) {
      return this.connectionPool.primary;
    }
    
    if (healthyConnection.id === 'fallback' && this.connectionPool.fallback) {
      return this.connectionPool.fallback;
    }

    return this.connectionPool.dedicated.get(healthyConnection.id) || null;
  }

  /**
   * Adaptive quality management
   */
  private adaptToNetworkConditions(): void {
    if (!this.config.adaptiveConfig.enabled) return;

    const currentQuality = this.assessNetworkQuality();
    
    for (const strategy of this.adaptationStrategies) {
      if (strategy.condition(this.metrics)) {
        strategy.action(this);
      }
    }
  }

  /**
   * Assess current network quality
   */
  private assessNetworkQuality(): 'excellent' | 'good' | 'poor' {
    const latency = this.metrics.latency.average;
    const { excellent, good, poor } = this.config.adaptiveConfig.qualityThresholds;

    if (latency <= excellent) return 'excellent';
    if (latency <= good) return 'good';
    return 'poor';
  }

  /**
   * Initialize adaptation strategies
   */
  private initializeAdaptationStrategies(): void {
    this.adaptationStrategies = [
      {
        name: 'high-latency-adaptation',
        condition: (metrics) => metrics.latency.average > this.config.adaptiveConfig.qualityThresholds.poor,
        action: (optimizer) => {
          // Increase batch delays to reduce overhead
          optimizer.config.batchingConfig.maxBatchDelay *= 1.5;
          // Increase compression threshold
          optimizer.config.compressionConfig.threshold *= 0.8;
          optimizer.emit('adaptation:high-latency', { action: 'increased-batching' });
        },
        priority: 1
      },
      {
        name: 'low-latency-optimization',
        condition: (metrics) => metrics.latency.average < this.config.adaptiveConfig.qualityThresholds.excellent,
        action: (optimizer) => {
          // Decrease batch delays for faster responses
          optimizer.config.batchingConfig.maxBatchDelay = Math.max(5, optimizer.config.batchingConfig.maxBatchDelay * 0.8);
          // Increase compression threshold (less compression)
          optimizer.config.compressionConfig.threshold *= 1.2;
          optimizer.emit('adaptation:low-latency', { action: 'decreased-batching' });
        },
        priority: 2
      },
      {
        name: 'bandwidth-optimization',
        condition: (metrics) => metrics.throughput.bytesPerSecond > 100000, // >100KB/s
        action: (optimizer) => {
          // Enable more aggressive compression
          optimizer.config.compressionConfig.threshold *= 0.5;
          optimizer.config.compressionConfig.adaptiveCompression = true;
          optimizer.emit('adaptation:bandwidth', { action: 'increased-compression' });
        },
        priority: 3
      },
      {
        name: 'connection-failure-recovery',
        condition: (metrics) => metrics.reliability.errorRate > 5, // >5% error rate
        action: (optimizer) => {
          // Enable circuit breaker and fallback connections
          optimizer.createFallbackConnections();
          optimizer.emit('adaptation:error-recovery', { action: 'fallback-enabled' });
        },
        priority: 4
      }
    ];

    // Sort by priority
    this.adaptationStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Compression utilities
   */
  private shouldCompress(batch: MessageBatch): boolean {
    if (!this.config.compressionConfig.enabled) return false;
    if (batch.size < this.config.compressionConfig.threshold) return false;
    
    // Adaptive compression based on network conditions
    if (this.config.compressionConfig.adaptiveCompression) {
      const quality = this.assessNetworkQuality();
      if (quality === 'excellent' && batch.size < this.config.compressionConfig.threshold * 2) {
        return false; // Skip compression on good connections for small payloads
      }
    }
    
    return true;
  }

  private async compressBatch(batch: MessageBatch): Promise<MessageBatch> {
    if (!this.compressionWorker) {
      return batch; // Fallback to uncompressed
    }

    try {
      const compressed = await this.compressData(JSON.stringify(batch.messages));
      return {
        ...batch,
        messages: compressed as any,
        compressed: true,
        size: compressed.length
      };
    } catch (error) {
      console.warn('Compression failed, sending uncompressed:', error);
      return batch;
    }
  }

  private async compressData(data: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        reject(new Error('Compression worker not available'));
        return;
      }

      const messageId = this.generateMessageId();
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.compressed);
          }
        }
      };

      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({
        id: messageId,
        action: 'compress',
        data,
        algorithm: this.config.compressionConfig.algorithm
      });
    });
  }

  /**
   * Load balancer implementation
   */
  private createLoadBalancer(): LoadBalancer {
    const balancer: LoadBalancer = {
      strategy: this.config.loadBalancing.strategy,
      connections: [],
      selectConnection: () => {
        const healthy = balancer.connections.filter(conn => 
          conn.status === 'healthy' || conn.status === 'degraded'
        );

        if (healthy.length === 0) return null;

        switch (balancer.strategy) {
          case 'round-robin':
            return this.selectRoundRobin(healthy);
          case 'least-connections':
            return this.selectLeastConnections(healthy);
          case 'response-time':
            return this.selectFastestResponse(healthy);
          case 'adaptive':
            return this.selectAdaptive(healthy);
          default:
            return healthy[0];
        }
      },
      updateHealth: (connectionId, metrics) => {
        const connection = balancer.connections.find(c => c.id === connectionId);
        if (connection) {
          Object.assign(connection, metrics);
          connection.lastHealthCheck = Date.now();
        }
      }
    };

    return balancer;
  }

  private selectRoundRobin(connections: ConnectionHealth[]): ConnectionHealth {
    const index = this.performanceMonitor.roundRobinIndex % connections.length;
    this.performanceMonitor.roundRobinIndex++;
    return connections[index];
  }

  private selectLeastConnections(connections: ConnectionHealth[]): ConnectionHealth {
    return connections.reduce((min, conn) => 
      conn.load < min.load ? conn : min
    );
  }

  private selectFastestResponse(connections: ConnectionHealth[]): ConnectionHealth {
    return connections.reduce((fastest, conn) => 
      conn.latency < fastest.latency ? conn : fastest
    );
  }

  private selectAdaptive(connections: ConnectionHealth[]): ConnectionHealth {
    // Score based on latency, load, and error rate
    const scored = connections.map(conn => ({
      connection: conn,
      score: this.calculateConnectionScore(conn)
    }));

    return scored.reduce((best, current) => 
      current.score > best.score ? current : best
    ).connection;
  }

  private calculateConnectionScore(connection: ConnectionHealth): number {
    const latencyScore = Math.max(0, 100 - connection.latency);
    const loadScore = Math.max(0, 100 - connection.load * 10);
    const reliabilityScore = Math.max(0, 100 - connection.errorRate * 20);
    
    return (latencyScore + loadScore + reliabilityScore) / 3;
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitBreakerOpen(url: string): boolean {
    const state = this.circuitBreaker.get(url);
    if (!state) return false;

    if (state.state === 'open') {
      if (Date.now() - state.lastFailure > this.config.errorHandling.circuitBreakerConfig.recoveryTimeout) {
        state.state = 'half-open';
        state.consecutiveFailures = 0;
      } else {
        return true;
      }
    }

    return false;
  }

  private updateCircuitBreaker(url: string, success: boolean): void {
    let state = this.circuitBreaker.get(url);
    if (!state) {
      state = {
        state: 'closed',
        consecutiveFailures: 0,
        lastFailure: 0,
        successCount: 0
      };
      this.circuitBreaker.set(url, state);
    }

    if (success) {
      state.consecutiveFailures = 0;
      state.successCount++;
      
      if (state.state === 'half-open' && state.successCount >= 3) {
        state.state = 'closed';
        state.successCount = 0;
      }
    } else {
      state.consecutiveFailures++;
      state.lastFailure = Date.now();
      
      if (state.consecutiveFailures >= this.config.errorHandling.circuitBreakerConfig.failureThreshold) {
        state.state = 'open';
      }
    }
  }

  /**
   * Performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Metrics collection
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.adaptToNetworkConditions();
    }, 1000);

    // Health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.loadBalancing.healthCheckInterval);

    // Batch processing
    this.batchTimer = setInterval(() => {
      this.processMessageQueue();
    }, this.config.batchingConfig.maxBatchDelay);
  }

  private collectMetrics(): void {
    // Update latency metrics
    if (this.latencyHistory.length > 0) {
      this.metrics.latency.average = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
      this.metrics.latency.current = this.latencyHistory[this.latencyHistory.length - 1] || 0;
      
      const sorted = [...this.latencyHistory].sort((a, b) => a - b);
      this.metrics.latency.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      this.metrics.latency.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    }

    // Update throughput metrics
    const now = Date.now();
    const recentThroughput = this.throughputHistory.filter(t => now - t < 1000);
    this.metrics.throughput.messagesPerSecond = recentThroughput.length;

    // Clean up old data
    if (this.latencyHistory.length > 1000) {
      this.latencyHistory = this.latencyHistory.slice(-500);
    }
    if (this.throughputHistory.length > 1000) {
      this.throughputHistory = this.throughputHistory.slice(-500);
    }
  }

  private updateLatencyMetrics(latency: number): void {
    this.latencyHistory.push(latency);
  }

  private updateThroughputMetrics(messageCount: number, bytes: number): void {
    const now = Date.now();
    for (let i = 0; i < messageCount; i++) {
      this.throughputHistory.push(now);
    }
    this.metrics.throughput.bytesPerSecond = bytes;
  }

  /**
   * Helper methods
   */
  private configureWebSocket(ws: WebSocket, connectionId: string, options: any): void {
    // Set up event handlers with performance tracking
    ws.addEventListener('open', () => {
      this.emit('connection:open', { connectionId, options });
    });

    ws.addEventListener('message', (event) => {
      this.handleIncomingMessage(event, connectionId);
    });

    ws.addEventListener('error', (error) => {
      this.handleWebSocketError(error, connectionId);
    });

    ws.addEventListener('close', (event) => {
      this.handleWebSocketClose(event, connectionId);
    });
  }

  private async waitForConnection(ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const onOpen = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        resolve();
      };

      const onError = (error: Event) => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        reject(error);
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);
    });
  }

  private setupCompressionWorker(): void {
    if (typeof Worker !== 'undefined' && this.config.compressionConfig.enabled) {
      try {
        // Create compression worker for background processing
        const workerCode = `
          self.onmessage = function(e) {
            const { id, action, data, algorithm } = e.data;
            
            if (action === 'compress') {
              try {
                // Simple compression simulation - in production use real compression
                const compressed = new TextEncoder().encode(JSON.stringify(data));
                self.postMessage({ id, compressed });
              } catch (error) {
                self.postMessage({ id, error: error.message });
              }
            }
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Failed to create compression worker:', error);
      }
    }
  }

  private handleIncomingMessage(event: MessageEvent, connectionId: string): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle acknowledgments
      if (data.type === 'ack' && data.messageId) {
        const ack = this.acknowledgments.get(data.messageId);
        if (ack) {
          ack.resolved = true;
          const latency = Date.now() - ack.timestamp;
          this.updateLatencyMetrics(latency);
        }
      }
      
      this.emit('message:received', { data, connectionId });
    } catch (error) {
      this.emit('message:parse-error', { error, connectionId });
    }
  }

  private handleWebSocketError(error: Event, connectionId: string): void {
    this.emit('connection:error', { error, connectionId });
    
    // Update connection health
    this.loadBalancer.updateHealth(connectionId, {
      status: 'failed',
      consecutiveFailures: (this.loadBalancer.connections.find(c => c.id === connectionId)?.consecutiveFailures || 0) + 1
    });
  }

  private handleWebSocketClose(event: CloseEvent, connectionId: string): void {
    this.emit('connection:close', { event, connectionId });
    
    // Remove from pool and attempt reconnection if needed
    this.removeFromPool(connectionId);
    
    if (!event.wasClean) {
      this.scheduleReconnection(connectionId);
    }
  }

  private removeFromPool(connectionId: string): void {
    this.connectionPool.dedicated.delete(connectionId);
    
    if (this.connectionPool.primary && (this.connectionPool.primary as any).connectionId === connectionId) {
      this.connectionPool.primary = null;
    }
    
    if (this.connectionPool.fallback && (this.connectionPool.fallback as any).connectionId === connectionId) {
      this.connectionPool.fallback = null;
    }
  }

  // Additional helper methods and utilities...
  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupMessagesByPriority(messages: QueuedMessage[]): Map<MessageBatch['priority'], QueuedMessage[]> {
    const groups = new Map<MessageBatch['priority'], QueuedMessage[]>();
    
    for (const message of messages) {
      if (!groups.has(message.priority)) {
        groups.set(message.priority, []);
      }
      groups.get(message.priority)!.push(message);
    }
    
    return groups;
  }

  private scheduleBatchProcessing(priority: QueuedMessage['priority']): void {
    const delay = this.config.batchingConfig.priorityThresholds[priority];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.processMessageQueue();
    }, delay);
  }

  private async processMessage(message: QueuedMessage, connectionId: string): Promise<void> {
    // Implementation for processing individual messages
  }

  private async sendBatch(connection: WebSocket, batch: MessageBatch): Promise<void> {
    // Implementation for sending batches
  }

  private async handleBatchError(batch: MessageBatch, error: any): Promise<void> {
    // Implementation for batch error handling
  }

  private handleConnectionError(url: string, error: any): void {
    this.updateCircuitBreaker(url, false);
    this.emit('connection:failed', { url, error });
  }

  private createFallbackConnections(): void {
    // Implementation for creating fallback connections
  }

  private performHealthChecks(): void {
    // Implementation for health checking
  }

  private scheduleReconnection(connectionId: string): void {
    // Implementation for reconnection logic
  }

  /**
   * Public API methods
   */
  public getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  public getConnectionHealth(): ConnectionHealth[] {
    return [...this.loadBalancer.connections];
  }

  public optimizeForUserCount(userCount: number): void {
    if (userCount > 50) {
      // High user count optimizations
      this.config.batchingConfig.maxBatchSize = Math.min(100, userCount);
      this.config.batchingConfig.maxBatchDelay = Math.max(32, 16 + (userCount - 50));
    } else {
      // Low user count optimizations
      this.config.batchingConfig.maxBatchSize = 25;
      this.config.batchingConfig.maxBatchDelay = 16;
    }
  }

  public on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(handler);
    
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket optimizer event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    // Cleanup timers
    if (this.batchTimer) clearTimeout(this.batchTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    
    // Close all connections
    if (this.connectionPool.primary) this.connectionPool.primary.close();
    if (this.connectionPool.fallback) this.connectionPool.fallback.close();
    this.connectionPool.dedicated.forEach(ws => ws.close());
    
    // Terminate worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    
    // Clear data structures
    this.messageQueue.clear();
    this.eventHandlers.clear();
    this.acknowledgments.clear();
    this.circuitBreaker.clear();
  }
}

// Supporting classes
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  consecutiveFailures: number;
  lastFailure: number;
  successCount: number;
}

class PerformanceMonitor {
  public roundRobinIndex = 0;
  
  // Additional monitoring methods...
}

// Factory function
export function createWebSocketOptimizer(config?: Partial<OptimizationConfig>): WebSocketOptimizer {
  return new WebSocketOptimizer(config);
}