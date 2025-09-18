/**
 * Test Suite Registry
 * Manages test suite registration, dependencies, and execution order
 */

export interface TestSuiteDefinition {
  name: string;
  path: string;
  category: 'unit' | 'integration' | 'performance' | 'accessibility' | 'e2e';
  priority: number;
  dependencies: string[];
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  tags?: string[];
  description?: string;
  estimatedDuration?: number;
}

export interface TestSuiteExecution {
  definition: TestSuiteDefinition;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: Error;
}

export class TestSuiteRegistry {
  private suites: Map<string, TestSuiteDefinition> = new Map();
  private executions: Map<string, TestSuiteExecution> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  /**
   * Register a test suite
   */
  registerSuite(name: string, definition: Omit<TestSuiteDefinition, 'name'>): void {
    const fullDefinition: TestSuiteDefinition = {
      name,
      ...definition,
    };

    this.suites.set(name, fullDefinition);
    this.buildDependencyGraph();
    
    console.log(`📋 Registered test suite: ${name} (${definition.category})`);
  }

  /**
   * Get a test suite by name
   */
  getSuite(name: string): TestSuiteDefinition | undefined {
    return this.suites.get(name);
  }

  /**
   * Get all registered test suites
   */
  getAllSuites(): TestSuiteDefinition[] {
    return Array.from(this.suites.values());
  }

  /**
   * Get test suites by category
   */
  getSuitesByCategory(category: string): TestSuiteDefinition[] {
    return Array.from(this.suites.values()).filter(suite => suite.category === category);
  }

  /**
   * Get test suites by tags
   */
  getSuitesByTags(tags: string[]): TestSuiteDefinition[] {
    return Array.from(this.suites.values()).filter(suite => 
      suite.tags && suite.tags.some(tag => tags.includes(tag))
    );
  }

  /**
   * Get execution order based on dependencies and priorities
   */
  getExecutionOrder(): TestSuiteDefinition[] {
    const ordered: TestSuiteDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (suiteName: string): void => {
      if (visited.has(suiteName)) return;
      if (visiting.has(suiteName)) {
        throw new Error(`Circular dependency detected involving suite: ${suiteName}`);
      }

      visiting.add(suiteName);
      
      const suite = this.suites.get(suiteName);
      if (!suite) {
        throw new Error(`Suite not found: ${suiteName}`);
      }

      // Visit dependencies first
      for (const dependency of suite.dependencies) {
        if (!this.suites.has(dependency)) {
          throw new Error(`Dependency not found: ${dependency} (required by ${suiteName})`);
        }
        visit(dependency);
      }

      visiting.delete(suiteName);
      visited.add(suiteName);
      ordered.push(suite);
    };

    // Sort by priority first, then process
    const suitesByPriority = Array.from(this.suites.values())
      .sort((a, b) => a.priority - b.priority);

    for (const suite of suitesByPriority) {
      visit(suite.name);
    }

    return ordered;
  }

  /**
   * Get suites that can run in parallel
   */
  getParallelGroups(): TestSuiteDefinition[][] {
    const executionOrder = this.getExecutionOrder();
    const groups: TestSuiteDefinition[][] = [];
    const processed = new Set<string>();

    for (const suite of executionOrder) {
      if (processed.has(suite.name)) continue;

      const currentGroup: TestSuiteDefinition[] = [];
      
      // Find all suites at the same level that can run in parallel
      for (const candidateSuite of executionOrder) {
        if (processed.has(candidateSuite.name)) continue;
        
        if (this.canRunInParallel(candidateSuite, currentGroup, processed)) {
          currentGroup.push(candidateSuite);
          processed.add(candidateSuite.name);
        }
      }

      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
    }

    return groups;
  }

  /**
   * Start execution tracking for a suite
   */
  startExecution(suiteName: string): void {
    const definition = this.suites.get(suiteName);
    if (!definition) {
      throw new Error(`Suite not found: ${suiteName}`);
    }

    this.executions.set(suiteName, {
      definition,
      status: 'running',
      startTime: Date.now(),
    });
  }

  /**
   * Complete execution tracking for a suite
   */
  completeExecution(suiteName: string, result: any, error?: Error): void {
    const execution = this.executions.get(suiteName);
    if (!execution) {
      throw new Error(`No execution found for suite: ${suiteName}`);
    }

    execution.status = error ? 'failed' : 'completed';
    execution.endTime = Date.now();
    execution.result = result;
    if (error) {
      execution.error = error;
    }
  }

  /**
   * Get execution status for a suite
   */
  getExecutionStatus(suiteName: string): TestSuiteExecution | undefined {
    return this.executions.get(suiteName);
  }

  /**
   * Get execution summary
   */
  getExecutionSummary(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    skipped: number;
  } {
    const executions = Array.from(this.executions.values());
    
    return {
      total: this.suites.size,
      pending: executions.filter(e => e.status === 'pending').length,
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      skipped: executions.filter(e => e.status === 'skipped').length,
    };
  }

  /**
   * Validate dependencies
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [suiteName, suite] of this.suites) {
      for (const dependency of suite.dependencies) {
        if (!this.suites.has(dependency)) {
          errors.push(`Suite '${suiteName}' depends on non-existent suite '${dependency}'`);
        }
      }
    }

    // Check for circular dependencies
    try {
      this.getExecutionOrder();
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get dependency tree for a suite
   */
  getDependencyTree(suiteName: string): string[] {
    const dependencies: string[] = [];
    const visited = new Set<string>();

    const collectDependencies = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const suite = this.suites.get(name);
      if (!suite) return;

      for (const dependency of suite.dependencies) {
        dependencies.push(dependency);
        collectDependencies(dependency);
      }
    };

    collectDependencies(suiteName);
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Get dependents of a suite (suites that depend on this one)
   */
  getDependents(suiteName: string): string[] {
    const dependents: string[] = [];

    for (const [name, suite] of this.suites) {
      if (suite.dependencies.includes(suiteName)) {
        dependents.push(name);
      }
    }

    return dependents;
  }

  /**
   * Get estimated total execution time
   */
  getEstimatedExecutionTime(): number {
    const parallelGroups = this.getParallelGroups();
    let totalTime = 0;

    for (const group of parallelGroups) {
      // For parallel group, take the longest estimated duration
      const groupTime = Math.max(...group.map(suite => suite.estimatedDuration || 5000));
      totalTime += groupTime;
    }

    return totalTime;
  }

  /**
   * Generate execution plan
   */
  generateExecutionPlan(): {
    groups: TestSuiteDefinition[][];
    totalEstimatedTime: number;
    criticalPath: string[];
    warnings: string[];
  } {
    const groups = this.getParallelGroups();
    const totalEstimatedTime = this.getEstimatedExecutionTime();
    const criticalPath = this.findCriticalPath();
    const warnings = this.generateWarnings();

    return {
      groups,
      totalEstimatedTime,
      criticalPath,
      warnings,
    };
  }

  /**
   * Get suite count
   */
  getSuiteCount(): number {
    return this.suites.size;
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.suites.clear();
    this.executions.clear();
    this.dependencyGraph.clear();
  }

  private buildDependencyGraph(): void {
    this.dependencyGraph.clear();

    for (const [suiteName, suite] of this.suites) {
      if (!this.dependencyGraph.has(suiteName)) {
        this.dependencyGraph.set(suiteName, new Set());
      }

      for (const dependency of suite.dependencies) {
        this.dependencyGraph.get(suiteName)!.add(dependency);
      }
    }
  }

  private canRunInParallel(
    suite: TestSuiteDefinition,
    currentGroup: TestSuiteDefinition[],
    processed: Set<string>
  ): boolean {
    // Check if all dependencies are satisfied
    for (const dependency of suite.dependencies) {
      if (!processed.has(dependency)) {
        return false;
      }
    }

    // Check if this suite conflicts with any in the current group
    for (const groupSuite of currentGroup) {
      if (this.hasDependencyConflict(suite, groupSuite)) {
        return false;
      }
    }

    // Check if the suite allows parallel execution
    if (suite.parallel === false) {
      return currentGroup.length === 0; // Can only run alone
    }

    return true;
  }

  private hasDependencyConflict(suite1: TestSuiteDefinition, suite2: TestSuiteDefinition): boolean {
    // Two suites conflict if one depends on the other
    return (
      suite1.dependencies.includes(suite2.name) ||
      suite2.dependencies.includes(suite1.name)
    );
  }

  private findCriticalPath(): string[] {
    // Find the longest path through the dependency graph
    const memo = new Map<string, number>();

    const getPathLength = (suiteName: string): number => {
      if (memo.has(suiteName)) {
        return memo.get(suiteName)!;
      }

      const suite = this.suites.get(suiteName);
      if (!suite) return 0;

      let maxDependencyPath = 0;
      for (const dependency of suite.dependencies) {
        maxDependencyPath = Math.max(maxDependencyPath, getPathLength(dependency));
      }

      const totalPath = maxDependencyPath + (suite.estimatedDuration || 5000);
      memo.set(suiteName, totalPath);
      return totalPath;
    };

    let criticalPath: string[] = [];
    let maxPathLength = 0;

    for (const suiteName of this.suites.keys()) {
      const pathLength = getPathLength(suiteName);
      if (pathLength > maxPathLength) {
        maxPathLength = pathLength;
        criticalPath = this.buildPath(suiteName);
      }
    }

    return criticalPath;
  }

  private buildPath(suiteName: string): string[] {
    const path: string[] = [];
    const visited = new Set<string>();

    const buildPathRecursive = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const suite = this.suites.get(name);
      if (!suite) return;

      // Add dependencies first
      for (const dependency of suite.dependencies) {
        buildPathRecursive(dependency);
      }

      path.push(name);
    };

    buildPathRecursive(suiteName);
    return path;
  }

  private generateWarnings(): string[] {
    const warnings: string[] = [];

    // Check for long-running suites
    const longRunningSuites = Array.from(this.suites.values())
      .filter(suite => (suite.estimatedDuration || 0) > 30000);
    
    if (longRunningSuites.length > 0) {
      warnings.push(
        `Long-running suites detected: ${longRunningSuites.map(s => s.name).join(', ')}`
      );
    }

    // Check for deep dependency chains
    const deepChains = Array.from(this.suites.keys())
      .filter(suiteName => this.getDependencyTree(suiteName).length > 3);
    
    if (deepChains.length > 0) {
      warnings.push(
        `Deep dependency chains detected: ${deepChains.join(', ')}`
      );
    }

    // Check for isolated suites with no dependents
    const isolatedSuites = Array.from(this.suites.keys())
      .filter(suiteName => this.getDependents(suiteName).length === 0 && 
        this.suites.get(suiteName)!.dependencies.length === 0);
    
    if (isolatedSuites.length > 0) {
      warnings.push(
        `Isolated suites (no dependencies or dependents): ${isolatedSuites.join(', ')}`
      );
    }

    return warnings;
  }
}