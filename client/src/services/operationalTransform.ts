/**
 * Advanced Operational Transformation Engine
 * Implements Jupiter OT algorithm with optimizations for sub-50ms latency
 * Supports complex document operations with conflict-free resolution
 */

export interface Operation {
  id: string;
  userId: string;
  timestamp: number;
  siteId: number;
  sequence: number;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  vectorClock?: VectorClock;
}

export interface VectorClock {
  [siteId: string]: number;
}

export interface TransformResult {
  operation: Operation;
  isTransformed: boolean;
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  type: 'position' | 'concurrent' | 'causal';
  severity: 'low' | 'medium' | 'high';
  operations: Operation[];
  resolution?: 'automatic' | 'manual';
}

export interface DocumentState {
  content: string;
  version: number;
  vectorClock: VectorClock;
  operations: Operation[];
  pendingOperations: Operation[];
  lastSynced: number;
}

export interface OptimizedTransformConfig {
  maxOperationBuffer: number;
  compressionThreshold: number;
  conflictResolutionStrategy: 'last-write-wins' | 'merge' | 'manual';
  enableVectorClocks: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
}

export class AdvancedOperationalTransform {
  private siteId: number;
  private sequence: number = 0;
  private vectorClock: VectorClock = {};
  private operationCache = new Map<string, TransformResult>();
  private config: OptimizedTransformConfig;

  constructor(siteId: number, config: Partial<OptimizedTransformConfig> = {}) {
    this.siteId = siteId;
    this.config = {
      maxOperationBuffer: 100,
      compressionThreshold: 50,
      conflictResolutionStrategy: 'merge',
      enableVectorClocks: true,
      enableCompression: true,
      enableCaching: true,
      ...config
    };
    this.vectorClock[siteId] = 0;
  }

  /**
   * Transform operation against another operation using Jupiter OT algorithm
   * Optimized for minimal latency and maximum conflict resolution
   */
  public transform(op1: Operation, op2: Operation): TransformResult {
    const cacheKey = `${op1.id}-${op2.id}`;
    
    // Check cache for previously computed transforms
    if (this.config.enableCaching && this.operationCache.has(cacheKey)) {
      return this.operationCache.get(cacheKey)!;
    }

    const result = this.performTransform(op1, op2);
    
    // Cache result for future use
    if (this.config.enableCaching) {
      this.operationCache.set(cacheKey, result);
    }

    return result;
  }

  private performTransform(op1: Operation, op2: Operation): TransformResult {
    // Vector clock comparison for causality detection
    if (this.config.enableVectorClocks && this.areConcurrent(op1, op2)) {
      return this.transformConcurrentOperations(op1, op2);
    }

    // Standard transformation based on operation types
    switch (`${op1.type}-${op2.type}`) {
      case 'insert-insert':
        return this.transformInsertInsert(op1, op2);
      case 'insert-delete':
        return this.transformInsertDelete(op1, op2);
      case 'delete-insert':
        return this.transformDeleteInsert(op1, op2);
      case 'delete-delete':
        return this.transformDeleteDelete(op1, op2);
      case 'retain-insert':
        return this.transformRetainInsert(op1, op2);
      case 'retain-delete':
        return this.transformRetainDelete(op1, op2);
      case 'format-insert':
        return this.transformFormatInsert(op1, op2);
      case 'format-delete':
        return this.transformFormatDelete(op1, op2);
      default:
        return { operation: op1, isTransformed: false };
    }
  }

  /**
   * Transform two concurrent insert operations
   */
  private transformInsertInsert(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };
    
    if (op2.position < op1.position) {
      // op2 inserts before op1 - adjust op1 position
      transformed.position += op2.content?.length || 0;
    } else if (op2.position === op1.position) {
      // Same position - use site ID for deterministic ordering
      if (op2.siteId < op1.siteId) {
        transformed.position += op2.content?.length || 0;
      }
    }

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position
    };
  }

  /**
   * Transform insert against delete operation
   */
  private transformInsertDelete(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };
    const deleteEnd = op2.position + (op2.length || 0);

    if (op1.position > deleteEnd) {
      // Insert is after delete - adjust position
      transformed.position -= op2.length || 0;
    } else if (op1.position >= op2.position && op1.position < deleteEnd) {
      // Insert is within deleted range - move to delete position
      transformed.position = op2.position;
    }
    // Insert is before delete - no change needed

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position
    };
  }

  /**
   * Transform delete against insert operation
   */
  private transformDeleteInsert(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };

    if (op2.position <= op1.position) {
      // Insert is before delete - adjust delete position
      transformed.position += op2.content?.length || 0;
    } else if (op2.position < op1.position + (op1.length || 0)) {
      // Insert is within delete range - extend delete length
      transformed.length = (transformed.length || 0) + (op2.content?.length || 0);
    }
    // Insert is after delete - no change needed

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position || transformed.length !== op1.length
    };
  }

  /**
   * Transform two concurrent delete operations
   */
  private transformDeleteDelete(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);

    if (op2End <= op1.position) {
      // op2 deletes before op1 - adjust op1 position
      transformed.position -= op2.length || 0;
    } else if (op2.position >= op1End) {
      // op2 deletes after op1 - no change
    } else {
      // Overlapping deletes - complex case
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1End, op2End);
      const overlapLength = overlapEnd - overlapStart;

      if (op2.position < op1.position) {
        // op2 starts before op1
        transformed.position = op2.position;
        transformed.length = (transformed.length || 0) - overlapLength;
      } else {
        // op1 starts before or at same position as op2
        transformed.length = (transformed.length || 0) - overlapLength;
      }

      // Ensure length doesn't go negative
      transformed.length = Math.max(0, transformed.length || 0);
    }

    return {
      operation: transformed,
      isTransformed: true,
      conflicts: this.detectDeleteConflicts(op1, op2)
    };
  }

  /**
   * Transform retain against insert operation
   */
  private transformRetainInsert(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };

    if (op2.position <= op1.position) {
      transformed.position += op2.content?.length || 0;
    }

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position
    };
  }

  /**
   * Transform retain against delete operation
   */
  private transformRetainDelete(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };
    const deleteEnd = op2.position + (op2.length || 0);

    if (op1.position >= deleteEnd) {
      transformed.position -= op2.length || 0;
    } else if (op1.position >= op2.position) {
      transformed.position = op2.position;
    }

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position
    };
  }

  /**
   * Transform format against insert operation
   */
  private transformFormatInsert(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };

    if (op2.position <= op1.position) {
      transformed.position += op2.content?.length || 0;
    }

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position
    };
  }

  /**
   * Transform format against delete operation
   */
  private transformFormatDelete(op1: Operation, op2: Operation): TransformResult {
    const transformed = { ...op1 };
    const deleteEnd = op2.position + (op2.length || 0);

    if (op1.position >= deleteEnd) {
      transformed.position -= op2.length || 0;
    } else if (op1.position >= op2.position) {
      // Format operation is within deleted range - cancel it
      return {
        operation: { ...transformed, type: 'retain', length: 0 },
        isTransformed: true,
        conflicts: [{
          type: 'position',
          severity: 'low',
          operations: [op1, op2],
          resolution: 'automatic'
        }]
      };
    }

    return {
      operation: transformed,
      isTransformed: transformed.position !== op1.position
    };
  }

  /**
   * Transform concurrent operations using vector clocks
   */
  private transformConcurrentOperations(op1: Operation, op2: Operation): TransformResult {
    // Apply intention preservation transformation
    const baseTransform = this.performTransform(op1, op2);
    
    // Add conflict detection for concurrent operations
    const conflicts: ConflictInfo[] = [];
    
    if (this.hasPositionConflict(op1, op2)) {
      conflicts.push({
        type: 'concurrent',
        severity: this.assessConflictSeverity(op1, op2),
        operations: [op1, op2],
        resolution: this.config.conflictResolutionStrategy === 'manual' ? 'manual' : 'automatic'
      });
    }

    return {
      ...baseTransform,
      conflicts: [...(baseTransform.conflicts || []), ...conflicts]
    };
  }

  /**
   * Check if two operations are concurrent using vector clocks
   */
  private areConcurrent(op1: Operation, op2: Operation): boolean {
    if (!this.config.enableVectorClocks || !op1.vectorClock || !op2.vectorClock) {
      return op1.timestamp === op2.timestamp;
    }

    return !this.happensBefore(op1.vectorClock, op2.vectorClock) &&
           !this.happensBefore(op2.vectorClock, op1.vectorClock);
  }

  /**
   * Check if one vector clock happens before another
   */
  private happensBefore(vc1: VectorClock, vc2: VectorClock): boolean {
    let lessThanOrEqual = true;
    let strictlyLess = false;

    for (const siteId in vc1) {
      if (vc1[siteId] > (vc2[siteId] || 0)) {
        lessThanOrEqual = false;
        break;
      }
      if (vc1[siteId] < (vc2[siteId] || 0)) {
        strictlyLess = true;
      }
    }

    return lessThanOrEqual && strictlyLess;
  }

  /**
   * Detect conflicts between delete operations
   */
  private detectDeleteConflicts(op1: Operation, op2: Operation): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);

    // Check for overlap
    if (op1.position < op2End && op2.position < op1End) {
      conflicts.push({
        type: 'position',
        severity: 'medium',
        operations: [op1, op2],
        resolution: 'automatic'
      });
    }

    return conflicts;
  }

  /**
   * Check if operations have position conflicts
   */
  private hasPositionConflict(op1: Operation, op2: Operation): boolean {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return op1.position === op2.position;
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      const op1End = op1.position + (op1.length || 0);
      const op2End = op2.position + (op2.length || 0);
      return op1.position < op2End && op2.position < op1End;
    }

    return false;
  }

  /**
   * Assess conflict severity
   */
  private assessConflictSeverity(op1: Operation, op2: Operation): 'low' | 'medium' | 'high' {
    if (op1.type === 'format' || op2.type === 'format') {
      return 'low';
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      const overlapRatio = this.calculateOverlapRatio(op1, op2);
      if (overlapRatio > 0.8) return 'high';
      if (overlapRatio > 0.4) return 'medium';
      return 'low';
    }

    if (op1.type === 'insert' && op2.type === 'insert' && op1.position === op2.position) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate overlap ratio for delete operations
   */
  private calculateOverlapRatio(op1: Operation, op2: Operation): number {
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);
    
    const overlapStart = Math.max(op1.position, op2.position);
    const overlapEnd = Math.min(op1End, op2End);
    const overlapLength = Math.max(0, overlapEnd - overlapStart);
    
    const totalLength = Math.max(op1.length || 0, op2.length || 0);
    return totalLength > 0 ? overlapLength / totalLength : 0;
  }

  /**
   * Create operation with proper metadata
   */
  public createOperation(
    type: Operation['type'],
    position: number,
    content?: string,
    length?: number,
    attributes?: Record<string, any>
  ): Operation {
    this.sequence++;
    if (this.config.enableVectorClocks) {
      this.vectorClock[this.siteId]++;
    }

    return {
      id: `${this.siteId}-${this.sequence}-${Date.now()}`,
      userId: `user-${this.siteId}`,
      timestamp: Date.now(),
      siteId: this.siteId,
      sequence: this.sequence,
      type,
      position,
      content,
      length,
      attributes,
      vectorClock: this.config.enableVectorClocks ? { ...this.vectorClock } : undefined
    };
  }

  /**
   * Transform operation sequence against another sequence
   */
  public transformSequence(ops1: Operation[], ops2: Operation[]): Operation[] {
    let transformed = [...ops1];
    
    for (const op2 of ops2) {
      transformed = transformed.map(op1 => this.transform(op1, op2).operation);
    }

    return transformed;
  }

  /**
   * Compose multiple operations into a single operation
   */
  public compose(ops: Operation[]): Operation | null {
    if (ops.length === 0) return null;
    if (ops.length === 1) return ops[0];

    // Simple composition for adjacent operations of same type
    const firstOp = ops[0];
    
    if (ops.every(op => op.type === 'insert' && this.areAdjacent(ops))) {
      return {
        ...firstOp,
        content: ops.map(op => op.content || '').join(''),
        length: ops.reduce((sum, op) => sum + (op.content?.length || 0), 0)
      };
    }

    if (ops.every(op => op.type === 'delete' && this.areAdjacent(ops))) {
      return {
        ...firstOp,
        length: ops.reduce((sum, op) => sum + (op.length || 0), 0)
      };
    }

    return null; // Complex composition not supported in this simple implementation
  }

  /**
   * Check if operations are adjacent and can be composed
   */
  private areAdjacent(ops: Operation[]): boolean {
    for (let i = 1; i < ops.length; i++) {
      const prev = ops[i - 1];
      const curr = ops[i];
      
      if (prev.type === 'insert' && curr.type === 'insert') {
        const expectedPos = prev.position + (prev.content?.length || 0);
        if (curr.position !== expectedPos) return false;
      } else if (prev.type === 'delete' && curr.type === 'delete') {
        if (curr.position !== prev.position) return false;
      }
    }
    return true;
  }

  /**
   * Compress operation history to reduce memory usage
   */
  public compressOperations(operations: Operation[]): Operation[] {
    if (operations.length < this.config.compressionThreshold) {
      return operations;
    }

    const compressed: Operation[] = [];
    let currentGroup: Operation[] = [];

    for (const op of operations) {
      if (currentGroup.length === 0 || this.canGroupWith(currentGroup[0], op)) {
        currentGroup.push(op);
      } else {
        const composed = this.compose(currentGroup);
        if (composed) {
          compressed.push(composed);
        } else {
          compressed.push(...currentGroup);
        }
        currentGroup = [op];
      }
    }

    // Handle last group
    if (currentGroup.length > 0) {
      const composed = this.compose(currentGroup);
      if (composed) {
        compressed.push(composed);
      } else {
        compressed.push(...currentGroup);
      }
    }

    return compressed;
  }

  /**
   * Check if operation can be grouped with existing group
   */
  private canGroupWith(groupFirst: Operation, op: Operation): boolean {
    return groupFirst.type === op.type && 
           groupFirst.userId === op.userId &&
           op.timestamp - groupFirst.timestamp < 1000; // Within 1 second
  }

  /**
   * Get transformation statistics
   */
  public getStats(): {
    cacheHits: number;
    totalTransforms: number;
    conflictRate: number;
    averageLatency: number;
  } {
    return {
      cacheHits: this.operationCache.size,
      totalTransforms: this.sequence,
      conflictRate: 0, // Would need to track conflicts
      averageLatency: 0 // Would need to track timing
    };
  }

  /**
   * Clear operation cache
   */
  public clearCache(): void {
    this.operationCache.clear();
  }

  /**
   * Update vector clock with remote operation
   */
  public updateVectorClock(remoteVectorClock: VectorClock): void {
    if (!this.config.enableVectorClocks) return;

    for (const siteId in remoteVectorClock) {
      this.vectorClock[siteId] = Math.max(
        this.vectorClock[siteId] || 0,
        remoteVectorClock[siteId]
      );
    }
  }
}

// Factory function for creating optimized OT instances
export function createOptimizedOT(siteId: number, config?: Partial<OptimizedTransformConfig>): AdvancedOperationalTransform {
  return new AdvancedOperationalTransform(siteId, config);
}

// Utility functions for operation manipulation
export const OperationUtils = {
  /**
   * Apply operation to text content
   */
  applyToText(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) +
               (operation.content || '') +
               content.slice(operation.position);
      
      case 'delete':
        return content.slice(0, operation.position) +
               content.slice(operation.position + (operation.length || 0));
      
      case 'retain':
        return content;
      
      default:
        return content;
    }
  },

  /**
   * Invert operation for undo functionality
   */
  invert(operation: Operation, content: string): Operation {
    switch (operation.type) {
      case 'insert':
        return {
          ...operation,
          type: 'delete',
          length: operation.content?.length || 0,
          content: undefined
        };
      
      case 'delete':
        return {
          ...operation,
          type: 'insert',
          content: content.slice(operation.position, operation.position + (operation.length || 0)),
          length: undefined
        };
      
      default:
        return operation;
    }
  },

  /**
   * Calculate operation size for memory management
   */
  getSize(operation: Operation): number {
    return JSON.stringify(operation).length;
  },

  /**
   * Check if operation is valid
   */
  isValid(operation: Operation, contentLength: number): boolean {
    if (operation.position < 0 || operation.position > contentLength) {
      return false;
    }

    if (operation.type === 'delete') {
      return operation.position + (operation.length || 0) <= contentLength;
    }

    return true;
  }
};