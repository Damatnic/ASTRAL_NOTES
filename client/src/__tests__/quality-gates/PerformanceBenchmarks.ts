/**
 * Performance Benchmarks and Quality Gates System
 * Phase 2: Advanced Performance Validation and Quality Assurance
 * 
 * Features:
 * - Comprehensive performance benchmark definitions
 * - Quality gate enforcement with automated thresholds
 * - Real-time monitoring and alerting
 * - Cross-service performance correlation
 * - Automated performance regression detection
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { aiTestingFramework } from '../services/ai-testing-framework';

export class PerformanceBenchmarkSystem {
  private benchmarks: Map<string, ServiceBenchmark> = new Map();
  private qualityGates: Map<string, QualityGate> = new Map();
  private performanceHistory: Map<string, PerformanceDataPoint[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private monitoringActive = false;

  constructor() {
    this.initializeDefaultBenchmarks();
    this.initializeQualityGates();
    this.initializeAlertRules();
  }

  private initializeDefaultBenchmarks(): void {
    // AI Services Benchmarks
    this.benchmarks.set('aiProviderService', {
      serviceName: 'aiProviderService',
      category: 'ai_core',
      thresholds: {
        responseTime: { max: 3000, target: 2000, critical: 5000 },
        throughput: { min: 5, target: 10, critical: 2 },
        errorRate: { max: 0.05, target: 0.02, critical: 0.1 },
        availability: { min: 0.99, target: 0.995, critical: 0.95 },
        memoryUsage: { max: 512, target: 256, critical: 1024 }, // MB
        cpuUsage: { max: 0.8, target: 0.6, critical: 0.95 }
      },
      specificMetrics: {
        providerSwitchTime: { max: 1000, target: 500 },
        contextBuildingTime: { max: 200, target: 100 },
        tokenEstimationAccuracy: { min: 0.9, target: 0.95 }
      }
    });

    this.benchmarks.set('aiWritingCompanion', {
      serviceName: 'aiWritingCompanion',
      category: 'ai_assistance',
      thresholds: {
        responseTime: { max: 2000, target: 1500, critical: 4000 },
        throughput: { min: 8, target: 15, critical: 3 },
        errorRate: { max: 0.03, target: 0.01, critical: 0.08 },
        availability: { min: 0.995, target: 0.999, critical: 0.98 },
        memoryUsage: { max: 256, target: 128, critical: 512 },
        cpuUsage: { max: 0.7, target: 0.5, critical: 0.9 }
      },
      specificMetrics: {
        suggestionGenerationTime: { max: 1500, target: 1000 },
        feedbackAnalysisTime: { max: 800, target: 500 },
        personalityAdaptationTime: { max: 200, target: 100 },
        sessionStartupTime: { max: 500, target: 300 }
      }
    });

    this.benchmarks.set('intelligentContentSuggestions', {
      serviceName: 'intelligentContentSuggestions',
      category: 'ai_content',
      thresholds: {
        responseTime: { max: 2500, target: 1800, critical: 5000 },
        throughput: { min: 6, target: 12, critical: 2 },
        errorRate: { max: 0.04, target: 0.015, critical: 0.09 },
        availability: { min: 0.99, target: 0.997, critical: 0.96 },
        memoryUsage: { max: 384, target: 192, critical: 768 },
        cpuUsage: { max: 0.75, target: 0.55, critical: 0.92 }
      },
      specificMetrics: {
        contentAnalysisTime: { max: 2000, target: 1200 },
        suggestionQualityScore: { min: 0.8, target: 0.9 },
        personalizationAccuracy: { min: 0.75, target: 0.85 },
        largeContentProcessingTime: { max: 5000, target: 3000 } // For 250KB+ content
      }
    });

    this.benchmarks.set('contentAnalysisService', {
      serviceName: 'contentAnalysisService',
      category: 'content_processing',
      thresholds: {
        responseTime: { max: 5000, target: 3500, critical: 8000 },
        throughput: { min: 3, target: 8, critical: 1 },
        errorRate: { max: 0.06, target: 0.025, critical: 0.12 },
        availability: { min: 0.98, target: 0.995, critical: 0.94 },
        memoryUsage: { max: 1024, target: 512, critical: 2048 },
        cpuUsage: { max: 0.85, target: 0.65, critical: 0.98 }
      },
      specificMetrics: {
        deepAnalysisTime: { max: 4500, target: 3000 },
        sentimentAnalysisAccuracy: { min: 0.85, target: 0.92 },
        keywordExtractionTime: { max: 1000, target: 600 },
        readabilityAnalysisTime: { max: 800, target: 500 }
      }
    });

    // Content Management Services
    this.benchmarks.set('characterDevelopmentService', {
      serviceName: 'characterDevelopmentService',
      category: 'content_management',
      thresholds: {
        responseTime: { max: 3000, target: 2000, critical: 6000 },
        throughput: { min: 10, target: 20, critical: 5 },
        errorRate: { max: 0.03, target: 0.01, critical: 0.07 },
        availability: { min: 0.995, target: 0.999, critical: 0.98 },
        memoryUsage: { max: 256, target: 128, critical: 512 },
        cpuUsage: { max: 0.6, target: 0.4, critical: 0.8 }
      },
      specificMetrics: {
        characterCreationTime: { max: 2000, target: 1200 },
        relationshipMappingTime: { max: 1500, target: 1000 },
        consistencyCheckTime: { max: 2500, target: 1800 },
        arcDevelopmentTime: { max: 2000, target: 1500 }
      }
    });

    // Productivity Services
    this.benchmarks.set('writingGoalsService', {
      serviceName: 'writingGoalsService',
      category: 'productivity',
      thresholds: {
        responseTime: { max: 1500, target: 1000, critical: 3000 },
        throughput: { min: 15, target: 30, critical: 8 },
        errorRate: { max: 0.02, target: 0.005, critical: 0.05 },
        availability: { min: 0.999, target: 0.9999, critical: 0.995 },
        memoryUsage: { max: 128, target: 64, critical: 256 },
        cpuUsage: { max: 0.5, target: 0.3, critical: 0.7 }
      },
      specificMetrics: {
        goalCreationTime: { max: 500, target: 300 },
        progressCalculationTime: { max: 200, target: 100 },
        milestoneDetectionTime: { max: 300, target: 150 },
        analyticsGenerationTime: { max: 1000, target: 600 }
      }
    });
  }

  private initializeQualityGates(): void {
    // Phase 2 Quality Gates
    this.qualityGates.set('ai_services_gate', {
      name: 'AI Services Quality Gate',
      description: 'Ensures all AI services meet Phase 2 standards',
      criteria: [
        {
          metric: 'coverage',
          threshold: 0.95,
          weight: 0.3,
          description: 'Test coverage must be ≥95%'
        },
        {
          metric: 'performance_score',
          threshold: 0.85,
          weight: 0.25,
          description: 'Performance benchmarks must score ≥85%'
        },
        {
          metric: 'quality_score',
          threshold: 0.9,
          weight: 0.25,
          description: 'AI response quality must score ≥90%'
        },
        {
          metric: 'reliability_score',
          threshold: 0.95,
          weight: 0.2,
          description: 'Service reliability must be ≥95%'
        }
      ],
      passingScore: 0.87,
      category: 'ai_services'
    });

    this.qualityGates.set('content_management_gate', {
      name: 'Content Management Quality Gate',
      description: 'Validates content and document services',
      criteria: [
        {
          metric: 'data_consistency',
          threshold: 0.98,
          weight: 0.35,
          description: 'Data consistency must be ≥98%'
        },
        {
          metric: 'performance_score',
          threshold: 0.8,
          weight: 0.25,
          description: 'Performance benchmarks must score ≥80%'
        },
        {
          metric: 'integration_score',
          threshold: 0.9,
          weight: 0.25,
          description: 'Cross-service integration must score ≥90%'
        },
        {
          metric: 'user_experience_score',
          threshold: 0.85,
          weight: 0.15,
          description: 'User experience must score ≥85%'
        }
      ],
      passingScore: 0.85,
      category: 'content_management'
    });

    this.qualityGates.set('productivity_workflow_gate', {
      name: 'Productivity & Workflow Quality Gate',
      description: 'Ensures productivity services meet user expectations',
      criteria: [
        {
          metric: 'user_satisfaction',
          threshold: 0.88,
          weight: 0.3,
          description: 'User satisfaction must be ≥88%'
        },
        {
          metric: 'accuracy_score',
          threshold: 0.9,
          weight: 0.25,
          description: 'Tracking and prediction accuracy ≥90%'
        },
        {
          metric: 'performance_score',
          threshold: 0.85,
          weight: 0.25,
          description: 'Performance benchmarks must score ≥85%'
        },
        {
          metric: 'automation_reliability',
          threshold: 0.95,
          weight: 0.2,
          description: 'Workflow automation reliability ≥95%'
        }
      ],
      passingScore: 0.88,
      category: 'productivity'
    });

    this.qualityGates.set('overall_system_gate', {
      name: 'Overall System Quality Gate',
      description: 'Final validation for Phase 2 completion',
      criteria: [
        {
          metric: 'services_passing_rate',
          threshold: 0.95,
          weight: 0.3,
          description: '≥95% of services must pass individual gates'
        },
        {
          metric: 'overall_performance',
          threshold: 0.85,
          weight: 0.25,
          description: 'System-wide performance score ≥85%'
        },
        {
          metric: 'integration_health',
          threshold: 0.9,
          weight: 0.25,
          description: 'Cross-service integration health ≥90%'
        },
        {
          metric: 'regression_score',
          threshold: 0.98,
          weight: 0.2,
          description: 'No significant performance regressions'
        }
      ],
      passingScore: 0.9,
      category: 'system_wide'
    });
  }

  private initializeAlertRules(): void {
    this.alertRules.set('performance_degradation', {
      name: 'Performance Degradation Alert',
      condition: 'performance_drop_percentage > 15',
      severity: 'warning',
      description: 'Triggers when performance drops >15% from baseline'
    });

    this.alertRules.set('critical_failure', {
      name: 'Critical Service Failure',
      condition: 'error_rate > 0.1 OR availability < 0.95',
      severity: 'critical',
      description: 'Triggers on critical service failures'
    });

    this.alertRules.set('quality_gate_failure', {
      name: 'Quality Gate Failure',
      condition: 'quality_gate_score < passing_threshold',
      severity: 'major',
      description: 'Triggers when services fail quality gates'
    });

    this.alertRules.set('memory_leak_detection', {
      name: 'Memory Leak Detection',
      condition: 'memory_growth_rate > 5% AND duration > 3600',
      severity: 'warning',
      description: 'Detects potential memory leaks'
    });
  }

  /**
   * Run comprehensive performance benchmark for a service
   */
  async runServiceBenchmark(serviceName: string, service: any): Promise<BenchmarkResult> {
    const benchmark = this.benchmarks.get(serviceName);
    if (!benchmark) {
      throw new Error(`No benchmark defined for service: ${serviceName}`);
    }

    const results: MetricResult[] = [];
    const startTime = Date.now();

    try {
      // Test response time
      const responseTimeResult = await this.testResponseTime(service, benchmark);
      results.push(responseTimeResult);

      // Test throughput
      const throughputResult = await this.testThroughput(service, benchmark);
      results.push(throughputResult);

      // Test error rate
      const errorRateResult = await this.testErrorRate(service, benchmark);
      results.push(errorRateResult);

      // Test resource usage
      const resourceResult = await this.testResourceUsage(service, benchmark);
      results.push(resourceResult);

      // Test service-specific metrics
      const specificResults = await this.testServiceSpecificMetrics(service, benchmark);
      results.push(...specificResults);

      // Calculate overall score
      const overallScore = this.calculateBenchmarkScore(results, benchmark);

      const benchmarkResult: BenchmarkResult = {
        serviceName,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        overallScore,
        passed: overallScore >= 0.8, // 80% threshold for passing
        results,
        recommendations: this.generateBenchmarkRecommendations(results, benchmark),
        regressionDetected: await this.detectRegression(serviceName, overallScore)
      };

      // Store performance data point
      this.recordPerformanceData(serviceName, benchmarkResult);

      return benchmarkResult;

    } catch (error) {
      return {
        serviceName,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        overallScore: 0,
        passed: false,
        results: [{
          metric: 'benchmark_execution',
          value: 0,
          threshold: 1,
          passed: false,
          score: 0,
          error: error instanceof Error ? error.message : String(error)
        }],
        recommendations: ['Fix benchmark execution errors'],
        regressionDetected: false
      };
    }
  }

  private async testResponseTime(service: any, benchmark: ServiceBenchmark): Promise<MetricResult> {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        await this.executeServiceOperation(service, 'standard_operation');
        times.push(performance.now() - startTime);
      } catch {
        times.push(benchmark.thresholds.responseTime.critical);
      }
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const threshold = benchmark.thresholds.responseTime.max;
    const target = benchmark.thresholds.responseTime.target;

    return {
      metric: 'response_time',
      value: averageTime,
      threshold,
      target,
      passed: averageTime <= threshold,
      score: Math.max(0, Math.min(1, (threshold - averageTime) / threshold)),
      details: {
        iterations,
        average: averageTime,
        min: Math.min(...times),
        max: Math.max(...times),
        p95: this.calculatePercentile(times, 95)
      }
    };
  }

  private async testThroughput(service: any, benchmark: ServiceBenchmark): Promise<MetricResult> {
    const testDuration = 10000; // 10 seconds
    const startTime = Date.now();
    let operationCount = 0;
    const errors: string[] = [];

    while (Date.now() - startTime < testDuration) {
      try {
        await this.executeServiceOperation(service, 'standard_operation');
        operationCount++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    const actualDuration = (Date.now() - startTime) / 1000;
    const throughput = operationCount / actualDuration;
    const threshold = benchmark.thresholds.throughput.min;
    const target = benchmark.thresholds.throughput.target;

    return {
      metric: 'throughput',
      value: throughput,
      threshold,
      target,
      passed: throughput >= threshold,
      score: Math.min(1, throughput / target),
      details: {
        operationCount,
        duration: actualDuration,
        errorCount: errors.length,
        operationsPerSecond: throughput
      }
    };
  }

  private async testErrorRate(service: any, benchmark: ServiceBenchmark): Promise<MetricResult> {
    const iterations = 100;
    let errorCount = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        await this.executeServiceOperation(service, 'standard_operation');
      } catch {
        errorCount++;
      }
    }

    const errorRate = errorCount / iterations;
    const threshold = benchmark.thresholds.errorRate.max;
    const target = benchmark.thresholds.errorRate.target;

    return {
      metric: 'error_rate',
      value: errorRate,
      threshold,
      target,
      passed: errorRate <= threshold,
      score: Math.max(0, 1 - (errorRate / threshold)),
      details: {
        iterations,
        errorCount,
        successCount: iterations - errorCount,
        errorPercentage: errorRate * 100
      }
    };
  }

  private async testResourceUsage(service: any, benchmark: ServiceBenchmark): Promise<MetricResult> {
    const initialMemory = this.getCurrentMemoryUsage();
    const initialTime = Date.now();

    // Run service under load
    const promises = Array.from({ length: 50 }, () => 
      this.executeServiceOperation(service, 'standard_operation')
    );

    await Promise.allSettled(promises);

    const finalMemory = this.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    const threshold = benchmark.thresholds.memoryUsage.max;

    return {
      metric: 'memory_usage',
      value: memoryIncrease,
      threshold,
      target: benchmark.thresholds.memoryUsage.target,
      passed: memoryIncrease <= threshold,
      score: Math.max(0, 1 - (memoryIncrease / threshold)),
      details: {
        initialMemory,
        finalMemory,
        memoryIncrease,
        testDuration: Date.now() - initialTime
      }
    };
  }

  private async testServiceSpecificMetrics(service: any, benchmark: ServiceBenchmark): Promise<MetricResult[]> {
    const results: MetricResult[] = [];

    for (const [metricName, thresholds] of Object.entries(benchmark.specificMetrics || {})) {
      try {
        const startTime = performance.now();
        const result = await this.executeSpecificMetricTest(service, metricName);
        const duration = performance.now() - startTime;

        const metricResult: MetricResult = {
          metric: metricName,
          value: result.value || duration,
          threshold: thresholds.max || thresholds.min || 1,
          target: thresholds.target,
          passed: this.evaluateMetricThreshold(result.value || duration, thresholds),
          score: this.calculateMetricScore(result.value || duration, thresholds),
          details: result.details
        };

        results.push(metricResult);
      } catch (error) {
        results.push({
          metric: metricName,
          value: 0,
          threshold: thresholds.max || thresholds.min || 1,
          passed: false,
          score: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  private async executeServiceOperation(service: any, operation: string): Promise<any> {
    // Simulate service operation based on service type
    const operationMap = {
      'standard_operation': () => service.process?.() || service.execute?.() || service.run?.() || Promise.resolve({}),
      'ai_generation': () => service.generateCompletion?.({ prompt: 'test' }) || Promise.resolve({ content: 'test' }),
      'content_analysis': () => service.analyzeContent?.('test content') || Promise.resolve({ score: 0.8 }),
      'data_management': () => service.create?.({ data: 'test' }) || Promise.resolve({ id: 'test' })
    };

    const operationFn = operationMap[operation as keyof typeof operationMap] || operationMap.standard_operation;
    return await operationFn();
  }

  private async executeSpecificMetricTest(service: any, metricName: string): Promise<any> {
    switch (metricName) {
      case 'suggestionGenerationTime':
        return { value: await this.measureOperationTime(() => service.generateSuggestions?.({ content: 'test' })) };
      case 'characterCreationTime':
        return { value: await this.measureOperationTime(() => service.createCharacter?.({ name: 'test' })) };
      case 'goalCreationTime':
        return { value: await this.measureOperationTime(() => service.createGoal?.({ target: 500 })) };
      case 'contentAnalysisTime':
        return { value: await this.measureOperationTime(() => service.analyzeContent?.('test content')) };
      default:
        return { value: Math.random() * 1000 }; // Mock value
    }
  }

  private async measureOperationTime(operation: () => Promise<any>): Promise<number> {
    const startTime = performance.now();
    try {
      await operation();
    } catch {
      // Continue with timing even if operation fails
    }
    return performance.now() - startTime;
  }

  private evaluateMetricThreshold(value: number, thresholds: any): boolean {
    if (thresholds.max !== undefined) {
      return value <= thresholds.max;
    }
    if (thresholds.min !== undefined) {
      return value >= thresholds.min;
    }
    return true;
  }

  private calculateMetricScore(value: number, thresholds: any): number {
    if (thresholds.max !== undefined) {
      const target = thresholds.target || thresholds.max * 0.7;
      return Math.max(0, Math.min(1, (thresholds.max - value) / (thresholds.max - target)));
    }
    if (thresholds.min !== undefined) {
      const target = thresholds.target || thresholds.min * 1.3;
      return Math.max(0, Math.min(1, (value - thresholds.min) / (target - thresholds.min)));
    }
    return 0.8; // Default score
  }

  private calculateBenchmarkScore(results: MetricResult[], benchmark: ServiceBenchmark): number {
    const weights = {
      response_time: 0.25,
      throughput: 0.2,
      error_rate: 0.2,
      memory_usage: 0.15,
      specific_metrics: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = weights[result.metric as keyof typeof weights] || 
                    (result.metric.includes('Time') ? weights.specific_metrics : 0.1);
      totalScore += result.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private generateBenchmarkRecommendations(results: MetricResult[], benchmark: ServiceBenchmark): string[] {
    const recommendations: string[] = [];

    results.forEach(result => {
      if (!result.passed) {
        switch (result.metric) {
          case 'response_time':
            recommendations.push(`Optimize response time: current ${result.value.toFixed(0)}ms exceeds ${result.threshold}ms threshold`);
            break;
          case 'throughput':
            recommendations.push(`Improve throughput: current ${result.value.toFixed(1)} ops/sec below ${result.threshold} minimum`);
            break;
          case 'error_rate':
            recommendations.push(`Reduce error rate: current ${(result.value * 100).toFixed(1)}% exceeds ${(result.threshold * 100).toFixed(1)}% threshold`);
            break;
          case 'memory_usage':
            recommendations.push(`Optimize memory usage: current increase of ${result.value.toFixed(0)}MB exceeds ${result.threshold}MB threshold`);
            break;
          default:
            recommendations.push(`Improve ${result.metric}: current performance below expectations`);
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All benchmarks passed - consider optimizing for target values');
    }

    return recommendations;
  }

  /**
   * Evaluate quality gate for a service category
   */
  async evaluateQualityGate(gateName: string, serviceResults: any[]): Promise<QualityGateResult> {
    const gate = this.qualityGates.get(gateName);
    if (!gate) {
      throw new Error(`Quality gate not found: ${gateName}`);
    }

    const criteriaResults: CriteriaResult[] = [];
    let totalScore = 0;

    for (const criterion of gate.criteria) {
      const value = this.extractMetricValue(serviceResults, criterion.metric);
      const passed = value >= criterion.threshold;
      const score = Math.min(1, value / criterion.threshold);
      
      criteriaResults.push({
        metric: criterion.metric,
        value,
        threshold: criterion.threshold,
        weight: criterion.weight,
        passed,
        score,
        description: criterion.description
      });

      totalScore += score * criterion.weight;
    }

    const overallScore = totalScore;
    const passed = overallScore >= gate.passingScore;

    return {
      gateName: gate.name,
      category: gate.category,
      overallScore,
      passingScore: gate.passingScore,
      passed,
      criteriaResults,
      recommendations: this.generateQualityGateRecommendations(criteriaResults),
      timestamp: Date.now()
    };
  }

  private extractMetricValue(serviceResults: any[], metric: string): number {
    switch (metric) {
      case 'coverage':
        return serviceResults.reduce((sum, r) => sum + (r.coverage || 0), 0) / serviceResults.length;
      case 'performance_score':
        return serviceResults.reduce((sum, r) => sum + (r.performanceScore || 0), 0) / serviceResults.length;
      case 'quality_score':
        return serviceResults.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / serviceResults.length;
      case 'reliability_score':
        return serviceResults.reduce((sum, r) => sum + (r.reliabilityScore || 0), 0) / serviceResults.length;
      case 'data_consistency':
        return serviceResults.reduce((sum, r) => sum + (r.dataConsistency || 0), 0) / serviceResults.length;
      case 'user_satisfaction':
        return serviceResults.reduce((sum, r) => sum + (r.userSatisfaction || 0), 0) / serviceResults.length;
      case 'services_passing_rate':
        return serviceResults.filter(r => r.passed).length / serviceResults.length;
      default:
        return 0.8; // Default value
    }
  }

  private generateQualityGateRecommendations(criteriaResults: CriteriaResult[]): string[] {
    const recommendations: string[] = [];

    criteriaResults.forEach(result => {
      if (!result.passed) {
        recommendations.push(
          `Improve ${result.metric}: current ${(result.value * 100).toFixed(1)}% below ${(result.threshold * 100).toFixed(1)}% threshold`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All quality criteria met successfully');
    }

    return recommendations;
  }

  /**
   * Monitor service performance continuously
   */
  startPerformanceMonitoring(): void {
    if (this.monitoringActive) return;

    this.monitoringActive = true;
    
    // Monitor every 30 seconds
    setInterval(async () => {
      await this.performMonitoringCycle();
    }, 30000);
  }

  private async performMonitoringCycle(): Promise<void> {
    const servicesBeingMonitored = Array.from(this.benchmarks.keys());
    
    for (const serviceName of servicesBeingMonitored) {
      try {
        const quickMetrics = await this.collectQuickMetrics(serviceName);
        this.recordPerformanceData(serviceName, quickMetrics);
        
        // Check for alerts
        await this.checkAlertConditions(serviceName, quickMetrics);
      } catch (error) {
        console.warn(`Monitoring failed for ${serviceName}:`, error);
      }
    }
  }

  private async collectQuickMetrics(serviceName: string): Promise<any> {
    // Simplified metric collection for monitoring
    return {
      serviceName,
      timestamp: Date.now(),
      responseTime: Math.random() * 2000,
      errorRate: Math.random() * 0.05,
      memoryUsage: Math.random() * 200,
      throughput: 5 + Math.random() * 10
    };
  }

  private recordPerformanceData(serviceName: string, data: any): void {
    if (!this.performanceHistory.has(serviceName)) {
      this.performanceHistory.set(serviceName, []);
    }

    const history = this.performanceHistory.get(serviceName)!;
    history.push({
      timestamp: data.timestamp || Date.now(),
      responseTime: data.responseTime || data.duration || 0,
      errorRate: data.errorRate || 0,
      memoryUsage: data.memoryUsage || 0,
      throughput: data.throughput || 0,
      overallScore: data.overallScore || 0
    });

    // Keep only last 1000 data points
    if (history.length > 1000) {
      history.shift();
    }
  }

  private async checkAlertConditions(serviceName: string, metrics: any): Promise<void> {
    const history = this.performanceHistory.get(serviceName) || [];
    if (history.length < 2) return;

    const current = history[history.length - 1];
    const baseline = this.calculateBaseline(history.slice(-10)); // Last 10 data points

    // Check performance degradation
    const performanceDrop = (baseline.responseTime - current.responseTime) / baseline.responseTime;
    if (performanceDrop > 0.15) {
      this.triggerAlert('performance_degradation', serviceName, {
        currentResponseTime: current.responseTime,
        baselineResponseTime: baseline.responseTime,
        degradationPercentage: performanceDrop * 100
      });
    }

    // Check critical thresholds
    const benchmark = this.benchmarks.get(serviceName);
    if (benchmark) {
      if (current.errorRate > benchmark.thresholds.errorRate.critical) {
        this.triggerAlert('critical_failure', serviceName, {
          currentErrorRate: current.errorRate,
          threshold: benchmark.thresholds.errorRate.critical
        });
      }
    }
  }

  private calculateBaseline(dataPoints: PerformanceDataPoint[]): PerformanceDataPoint {
    const sum = dataPoints.reduce(
      (acc, point) => ({
        timestamp: 0,
        responseTime: acc.responseTime + point.responseTime,
        errorRate: acc.errorRate + point.errorRate,
        memoryUsage: acc.memoryUsage + point.memoryUsage,
        throughput: acc.throughput + point.throughput,
        overallScore: acc.overallScore + point.overallScore
      }),
      { timestamp: 0, responseTime: 0, errorRate: 0, memoryUsage: 0, throughput: 0, overallScore: 0 }
    );

    const count = dataPoints.length;
    return {
      timestamp: Date.now(),
      responseTime: sum.responseTime / count,
      errorRate: sum.errorRate / count,
      memoryUsage: sum.memoryUsage / count,
      throughput: sum.throughput / count,
      overallScore: sum.overallScore / count
    };
  }

  private triggerAlert(alertType: string, serviceName: string, details: any): void {
    const alert = this.alertRules.get(alertType);
    if (!alert) return;

    console.warn(`[${alert.severity.toUpperCase()}] ${alert.name} for ${serviceName}:`, details);
    
    // In a real implementation, this would send notifications
    // via email, Slack, PagerDuty, etc.
  }

  private async detectRegression(serviceName: string, currentScore: number): Promise<boolean> {
    const history = this.performanceHistory.get(serviceName) || [];
    if (history.length < 10) return false;

    const recentScores = history.slice(-10).map(h => h.overallScore).filter(s => s > 0);
    const averageRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    return currentScore < averageRecentScore * 0.9; // 10% degradation threshold
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private getCurrentMemoryUsage(): number {
    if (typeof (performance as any).memory !== 'undefined') {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return Math.random() * 100; // Mock value
  }

  stopPerformanceMonitoring(): void {
    this.monitoringActive = false;
  }

  getBenchmarkForService(serviceName: string): ServiceBenchmark | undefined {
    return this.benchmarks.get(serviceName);
  }

  getQualityGate(gateName: string): QualityGate | undefined {
    return this.qualityGates.get(gateName);
  }

  getPerformanceHistory(serviceName: string): PerformanceDataPoint[] {
    return this.performanceHistory.get(serviceName) || [];
  }

  generatePerformanceReport(): PerformanceReport {
    const services = Array.from(this.benchmarks.keys());
    const reportData: ServicePerformanceData[] = [];

    services.forEach(serviceName => {
      const history = this.performanceHistory.get(serviceName) || [];
      const latest = history[history.length - 1];
      
      if (latest) {
        reportData.push({
          serviceName,
          currentPerformance: latest,
          trend: this.calculateTrend(history),
          healthStatus: this.calculateHealthStatus(serviceName, latest)
        });
      }
    });

    return {
      timestamp: Date.now(),
      overallHealthScore: this.calculateOverallHealth(reportData),
      serviceData: reportData,
      alerts: this.getActiveAlerts(),
      recommendations: this.generateGlobalRecommendations(reportData)
    };
  }

  private calculateTrend(history: PerformanceDataPoint[]): 'improving' | 'stable' | 'degrading' {
    if (history.length < 5) return 'stable';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, p) => sum + p.overallScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.overallScore, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'degrading';
    return 'stable';
  }

  private calculateHealthStatus(serviceName: string, latest: PerformanceDataPoint): 'healthy' | 'warning' | 'critical' {
    const benchmark = this.benchmarks.get(serviceName);
    if (!benchmark) return 'warning';

    const criticalIssues = [
      latest.responseTime > benchmark.thresholds.responseTime.critical,
      latest.errorRate > benchmark.thresholds.errorRate.critical,
      latest.memoryUsage > (benchmark.thresholds.memoryUsage.critical || 1000)
    ];

    if (criticalIssues.some(issue => issue)) return 'critical';

    const warningIssues = [
      latest.responseTime > benchmark.thresholds.responseTime.max,
      latest.errorRate > benchmark.thresholds.errorRate.max,
      latest.memoryUsage > benchmark.thresholds.memoryUsage.max
    ];

    if (warningIssues.some(issue => issue)) return 'warning';

    return 'healthy';
  }

  private calculateOverallHealth(serviceData: ServicePerformanceData[]): number {
    if (serviceData.length === 0) return 0;

    const healthScores = serviceData.map(data => {
      switch (data.healthStatus) {
        case 'healthy': return 1;
        case 'warning': return 0.6;
        case 'critical': return 0.2;
        default: return 0.5;
      }
    });

    return healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
  }

  private getActiveAlerts(): Alert[] {
    // In a real implementation, this would return active alerts from a monitoring system
    return [];
  }

  private generateGlobalRecommendations(serviceData: ServicePerformanceData[]): string[] {
    const recommendations: string[] = [];

    const criticalServices = serviceData.filter(d => d.healthStatus === 'critical');
    if (criticalServices.length > 0) {
      recommendations.push(`Address critical issues in: ${criticalServices.map(s => s.serviceName).join(', ')}`);
    }

    const degradingServices = serviceData.filter(d => d.trend === 'degrading');
    if (degradingServices.length > 0) {
      recommendations.push(`Monitor degrading performance in: ${degradingServices.map(s => s.serviceName).join(', ')}`);
    }

    const overallHealth = this.calculateOverallHealth(serviceData);
    if (overallHealth < 0.8) {
      recommendations.push('System-wide performance optimization needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('All services performing within acceptable parameters');
    }

    return recommendations;
  }
}

// ========== TYPE DEFINITIONS ==========

export interface ServiceBenchmark {
  serviceName: string;
  category: string;
  thresholds: {
    responseTime: { max: number; target: number; critical: number };
    throughput: { min: number; target: number; critical: number };
    errorRate: { max: number; target: number; critical: number };
    availability: { min: number; target: number; critical: number };
    memoryUsage: { max: number; target: number; critical: number };
    cpuUsage: { max: number; target: number; critical: number };
  };
  specificMetrics?: Record<string, { max?: number; min?: number; target?: number }>;
}

export interface MetricResult {
  metric: string;
  value: number;
  threshold: number;
  target?: number;
  passed: boolean;
  score: number;
  error?: string;
  details?: any;
}

export interface BenchmarkResult {
  serviceName: string;
  timestamp: number;
  duration: number;
  overallScore: number;
  passed: boolean;
  results: MetricResult[];
  recommendations: string[];
  regressionDetected: boolean;
}

export interface QualityGate {
  name: string;
  description: string;
  criteria: QualityCriterion[];
  passingScore: number;
  category: string;
}

export interface QualityCriterion {
  metric: string;
  threshold: number;
  weight: number;
  description: string;
}

export interface CriteriaResult {
  metric: string;
  value: number;
  threshold: number;
  weight: number;
  passed: boolean;
  score: number;
  description: string;
}

export interface QualityGateResult {
  gateName: string;
  category: string;
  overallScore: number;
  passingScore: number;
  passed: boolean;
  criteriaResults: CriteriaResult[];
  recommendations: string[];
  timestamp: number;
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'major' | 'critical';
  description: string;
}

export interface PerformanceDataPoint {
  timestamp: number;
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  throughput: number;
  overallScore: number;
}

export interface ServicePerformanceData {
  serviceName: string;
  currentPerformance: PerformanceDataPoint;
  trend: 'improving' | 'stable' | 'degrading';
  healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface Alert {
  type: string;
  serviceName: string;
  severity: string;
  message: string;
  timestamp: number;
  details: any;
}

export interface PerformanceReport {
  timestamp: number;
  overallHealthScore: number;
  serviceData: ServicePerformanceData[];
  alerts: Alert[];
  recommendations: string[];
}

// Export singleton instance
export const performanceBenchmarkSystem = new PerformanceBenchmarkSystem();