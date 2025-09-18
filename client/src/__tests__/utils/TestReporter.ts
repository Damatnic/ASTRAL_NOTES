/**
 * Test Reporter
 * Comprehensive reporting system for test results, coverage, and analytics
 */

import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

export interface ReportingConfig {
  formats: string[];
  outputDir: string;
  includeMetrics: boolean;
  generateTrends: boolean;
}

export interface TestReport {
  metadata: {
    timestamp: string;
    version: string;
    environment: string;
    executionTime: number;
    reportId: string;
  };
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    successRate: number;
  };
  coverage: {
    global: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
    bySuite: Map<string, any>;
    trends: any[];
  };
  performance: {
    executionTimes: Map<string, number>;
    memoryUsage: number;
    averageResponseTime: number;
    slowestTests: any[];
    performanceTrends: any[];
  };
  quality: {
    accessibilityScore: number;
    codeQualityScore: number;
    testQualityScore: number;
    qualityTrends: any[];
  };
  suiteDetails: Map<string, any>;
  errors: any[];
  recommendations: string[];
  outputPath: string;
}

export class TestReporter {
  private config: ReportingConfig;
  private reportHistory: TestReport[] = [];

  constructor(config: ReportingConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('📊 Initializing Test Reporter...');
    
    // Ensure output directory exists
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create output directory:', error);
    }
    
    // Load previous reports for trend analysis
    if (this.config.generateTrends) {
      await this.loadReportHistory();
    }
    
    console.log('✅ Test Reporter initialized');
  }

  async generateReport(testState: any): Promise<TestReport> {
    console.log('📈 Generating comprehensive test report...');
    
    const reportId = `report-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const report: TestReport = {
      metadata: {
        timestamp,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'test',
        executionTime: testState.executionTime || 0,
        reportId,
      },
      summary: this.generateSummary(testState),
      coverage: await this.generateCoverageReport(testState),
      performance: await this.generatePerformanceReport(testState),
      quality: await this.generateQualityReport(testState),
      suiteDetails: testState.suiteResults || new Map(),
      errors: testState.errors || [],
      recommendations: this.generateRecommendations(testState),
      outputPath: '',
    };
    
    // Generate reports in all requested formats
    const outputPaths = await this.generateMultiFormatReports(report);
    report.outputPath = outputPaths.join(', ');
    
    // Store for trend analysis
    this.reportHistory.push(report);
    await this.saveReportHistory();
    
    console.log('✅ Test report generated:', report.outputPath);
    return report;
  }

  private generateSummary(testState: any): TestReport['summary'] {
    const totalTests = testState.totalTests || 0;
    const passedTests = testState.passedTests || 0;
    const failedTests = testState.failedTests || 0;
    const skippedTests = testState.skippedTests || 0;
    
    return {
      totalSuites: testState.suiteResults?.size || 0,
      passedSuites: Array.from(testState.suiteResults?.values() || [])
        .filter((suite: any) => suite.passed).length,
      failedSuites: Array.from(testState.suiteResults?.values() || [])
        .filter((suite: any) => !suite.passed).length,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
    };
  }

  private async generateCoverageReport(testState: any): Promise<TestReport['coverage']> {
    const suiteResults = Array.from(testState.suiteResults?.values() || []);
    
    // Calculate global coverage
    const globalCoverage = {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };
    
    if (suiteResults.length > 0) {
      globalCoverage.statements = suiteResults.reduce((sum: number, suite: any) => 
        sum + (suite.coverage?.statements || 0), 0) / suiteResults.length;
      globalCoverage.branches = suiteResults.reduce((sum: number, suite: any) => 
        sum + (suite.coverage?.branches || 0), 0) / suiteResults.length;
      globalCoverage.functions = suiteResults.reduce((sum: number, suite: any) => 
        sum + (suite.coverage?.functions || 0), 0) / suiteResults.length;
      globalCoverage.lines = suiteResults.reduce((sum: number, suite: any) => 
        sum + (suite.coverage?.lines || 0), 0) / suiteResults.length;
    }
    
    // Generate coverage by suite
    const bySuite = new Map();
    suiteResults.forEach((suite: any) => {
      if (suite.coverage) {
        bySuite.set(suite.name, suite.coverage);
      }
    });
    
    // Generate coverage trends
    const trends = this.generateCoverageTrends();
    
    return {
      global: globalCoverage,
      bySuite,
      trends,
    };
  }

  private async generatePerformanceReport(testState: any): Promise<TestReport['performance']> {
    const suiteResults = Array.from(testState.suiteResults?.values() || []);
    
    const executionTimes = new Map();
    let totalMemoryUsage = 0;
    let totalResponseTime = 0;
    const slowestTests: any[] = [];
    
    suiteResults.forEach((suite: any) => {
      executionTimes.set(suite.name, suite.executionTime || 0);
      
      if (suite.performanceMetrics) {
        totalMemoryUsage += suite.performanceMetrics.memoryUsage || 0;
        totalResponseTime += suite.performanceMetrics.averageLoadTime || 0;
        
        if (suite.executionTime > 5000) { // Slow tests > 5 seconds
          slowestTests.push({
            suite: suite.name,
            executionTime: suite.executionTime,
            tests: suite.totalTests,
          });
        }
      }
    });
    
    const performanceTrends = this.generatePerformanceTrends();
    
    return {
      executionTimes,
      memoryUsage: totalMemoryUsage,
      averageResponseTime: suiteResults.length > 0 ? totalResponseTime / suiteResults.length : 0,
      slowestTests: slowestTests.sort((a, b) => b.executionTime - a.executionTime).slice(0, 10),
      performanceTrends,
    };
  }

  private async generateQualityReport(testState: any): Promise<TestReport['quality']> {
    const suiteResults = Array.from(testState.suiteResults?.values() || []);
    
    // Calculate accessibility score
    const accessibilityScores = suiteResults
      .filter((suite: any) => suite.accessibilityScore)
      .map((suite: any) => suite.accessibilityScore);
    const accessibilityScore = accessibilityScores.length > 0 
      ? accessibilityScores.reduce((sum, score) => sum + score, 0) / accessibilityScores.length 
      : 0;
    
    // Calculate code quality score based on coverage and test success
    const coverageScore = testState.coverage?.global?.statements || 0;
    const successRate = testState.totalTests > 0 
      ? (testState.passedTests / testState.totalTests) * 100 
      : 0;
    const codeQualityScore = (coverageScore * 0.6) + (successRate * 0.4);
    
    // Calculate test quality score
    const testQualityScore = this.calculateTestQualityScore(suiteResults);
    
    const qualityTrends = this.generateQualityTrends();
    
    return {
      accessibilityScore,
      codeQualityScore,
      testQualityScore,
      qualityTrends,
    };
  }

  private calculateTestQualityScore(suiteResults: any[]): number {
    let totalScore = 0;
    let scoredSuites = 0;
    
    suiteResults.forEach((suite: any) => {
      if (suite.totalTests > 0) {
        // Base score on test coverage and execution time
        const coverageScore = (suite.coverage?.statements || 0) * 0.4;
        const successScore = (suite.passedTests / suite.totalTests) * 100 * 0.4;
        const performanceScore = suite.executionTime < 10000 ? 20 : 10; // Prefer faster tests
        
        totalScore += coverageScore + successScore + performanceScore;
        scoredSuites++;
      }
    });
    
    return scoredSuites > 0 ? totalScore / scoredSuites : 0;
  }

  private generateRecommendations(testState: any): string[] {
    const recommendations: string[] = [];
    const suiteResults = Array.from(testState.suiteResults?.values() || []);
    
    // Coverage recommendations
    const lowCoverageSuites = suiteResults.filter((suite: any) => 
      suite.coverage?.statements < 80
    );
    if (lowCoverageSuites.length > 0) {
      recommendations.push(
        `Improve test coverage for ${lowCoverageSuites.length} suite(s): ${
          lowCoverageSuites.map((s: any) => s.name).join(', ')
        }`
      );
    }
    
    // Performance recommendations
    const slowSuites = suiteResults.filter((suite: any) => 
      suite.executionTime > 10000
    );
    if (slowSuites.length > 0) {
      recommendations.push(
        `Optimize slow test suites: ${slowSuites.map((s: any) => s.name).join(', ')}`
      );
    }
    
    // Failure recommendations
    const failedSuites = suiteResults.filter((suite: any) => !suite.passed);
    if (failedSuites.length > 0) {
      recommendations.push(
        `Fix failing test suites: ${failedSuites.map((s: any) => s.name).join(', ')}`
      );
    }
    
    // Test quality recommendations
    const lowTestCount = suiteResults.filter((suite: any) => 
      suite.totalTests < 10 && suite.name !== 'performance'
    );
    if (lowTestCount.length > 0) {
      recommendations.push(
        `Add more tests to: ${lowTestCount.map((s: any) => s.name).join(', ')}`
      );
    }
    
    return recommendations;
  }

  private async generateMultiFormatReports(report: TestReport): Promise<string[]> {
    const outputPaths: string[] = [];
    
    for (const format of this.config.formats) {
      let outputPath: string;
      
      switch (format) {
        case 'json':
          outputPath = await this.generateJSONReport(report);
          break;
        case 'html':
          outputPath = await this.generateHTMLReport(report);
          break;
        case 'junit':
          outputPath = await this.generateJUnitReport(report);
          break;
        case 'console':
          this.generateConsoleReport(report);
          outputPath = 'console';
          break;
        default:
          console.warn(`Unknown report format: ${format}`);
          continue;
      }
      
      outputPaths.push(outputPath);
    }
    
    return outputPaths;
  }

  private async generateJSONReport(report: TestReport): Promise<string> {
    const outputPath = path.join(this.config.outputDir, `${report.metadata.reportId}.json`);
    
    // Convert Maps to objects for JSON serialization
    const jsonReport = {
      ...report,
      coverage: {
        ...report.coverage,
        bySuite: Object.fromEntries(report.coverage.bySuite),
      },
      performance: {
        ...report.performance,
        executionTimes: Object.fromEntries(report.performance.executionTimes),
      },
      suiteDetails: Object.fromEntries(report.suiteDetails),
    };
    
    try {
      await fs.writeFile(outputPath, JSON.stringify(jsonReport, null, 2));
    } catch (error) {
      console.warn('Could not write JSON report:', error);
      return 'json-report-failed';
    }
    
    return outputPath;
  }

  private async generateHTMLReport(report: TestReport): Promise<string> {
    const outputPath = path.join(this.config.outputDir, `${report.metadata.reportId}.html`);
    
    const html = this.buildHTMLReport(report);
    
    try {
      await fs.writeFile(outputPath, html);
    } catch (error) {
      console.warn('Could not write HTML report:', error);
      return 'html-report-failed';
    }
    
    return outputPath;
  }

  private buildHTMLReport(report: TestReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASTRAL_NOTES Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
        .content { padding: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #667eea; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .danger { border-left-color: #dc3545; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .suite-grid { display: grid; gap: 15px; }
        .suite-card { background: #f8f9fa; border-radius: 8px; padding: 15px; border-left: 4px solid #28a745; }
        .suite-card.failed { border-left-color: #dc3545; }
        .recommendations { background: #e3f2fd; border-radius: 8px; padding: 20px; }
        .recommendations ul { margin: 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 ASTRAL_NOTES Test Report</h1>
            <p>Generated on ${report.metadata.timestamp}</p>
            <p>Execution Time: ${Math.round(report.metadata.executionTime)}ms</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Summary</h2>
                <div class="metric-grid">
                    <div class="metric-card success">
                        <div class="metric-value">${report.summary.successRate.toFixed(1)}%</div>
                        <div class="metric-label">Success Rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${report.summary.totalTests}</div>
                        <div class="metric-label">Total Tests</div>
                    </div>
                    <div class="metric-card success">
                        <div class="metric-value">${report.summary.passedTests}</div>
                        <div class="metric-label">Passed</div>
                    </div>
                    <div class="metric-card ${report.summary.failedTests > 0 ? 'danger' : 'success'}">
                        <div class="metric-value">${report.summary.failedTests}</div>
                        <div class="metric-label">Failed</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📈 Coverage</h2>
                <div class="metric-grid">
                    <div class="metric-card ${report.coverage.global.statements >= 90 ? 'success' : report.coverage.global.statements >= 80 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.coverage.global.statements.toFixed(1)}%</div>
                        <div class="metric-label">Statements</div>
                    </div>
                    <div class="metric-card ${report.coverage.global.branches >= 85 ? 'success' : report.coverage.global.branches >= 75 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.coverage.global.branches.toFixed(1)}%</div>
                        <div class="metric-label">Branches</div>
                    </div>
                    <div class="metric-card ${report.coverage.global.functions >= 90 ? 'success' : report.coverage.global.functions >= 80 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.coverage.global.functions.toFixed(1)}%</div>
                        <div class="metric-label">Functions</div>
                    </div>
                    <div class="metric-card ${report.coverage.global.lines >= 90 ? 'success' : report.coverage.global.lines >= 80 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.coverage.global.lines.toFixed(1)}%</div>
                        <div class="metric-label">Lines</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>⚡ Performance</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">${Math.round(report.performance.averageResponseTime)}ms</div>
                        <div class="metric-label">Avg Response Time</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${Math.round(report.performance.memoryUsage / (1024 * 1024))}MB</div>
                        <div class="metric-label">Memory Usage</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🎯 Quality Metrics</h2>
                <div class="metric-grid">
                    <div class="metric-card ${report.quality.accessibilityScore >= 95 ? 'success' : report.quality.accessibilityScore >= 85 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.quality.accessibilityScore.toFixed(1)}</div>
                        <div class="metric-label">Accessibility Score</div>
                    </div>
                    <div class="metric-card ${report.quality.codeQualityScore >= 90 ? 'success' : report.quality.codeQualityScore >= 80 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.quality.codeQualityScore.toFixed(1)}</div>
                        <div class="metric-label">Code Quality</div>
                    </div>
                    <div class="metric-card ${report.quality.testQualityScore >= 90 ? 'success' : report.quality.testQualityScore >= 80 ? 'warning' : 'danger'}">
                        <div class="metric-value">${report.quality.testQualityScore.toFixed(1)}</div>
                        <div class="metric-label">Test Quality</div>
                    </div>
                </div>
            </div>
            
            ${report.recommendations.length > 0 ? `
            <div class="section">
                <h2>💡 Recommendations</h2>
                <div class="recommendations">
                    <ul>
                        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private async generateJUnitReport(report: TestReport): Promise<string> {
    const outputPath = path.join(this.config.outputDir, `${report.metadata.reportId}.xml`);
    
    const xml = this.buildJUnitXML(report);
    
    try {
      await fs.writeFile(outputPath, xml);
    } catch (error) {
      console.warn('Could not write JUnit report:', error);
      return 'junit-report-failed';
    }
    
    return outputPath;
  }

  private buildJUnitXML(report: TestReport): string {
    const suiteDetails = Array.from(report.suiteDetails.values());
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="ASTRAL_NOTES" tests="${report.summary.totalTests}" failures="${report.summary.failedTests}" time="${report.metadata.executionTime / 1000}">
${suiteDetails.map(suite => `
  <testsuite name="${suite.name}" tests="${suite.totalTests}" failures="${suite.failedTests}" time="${suite.executionTime / 1000}">
    ${Array.from({length: suite.passedTests}, (_, i) => `
    <testcase name="${suite.name}-test-${i + 1}" time="${(suite.executionTime / suite.totalTests) / 1000}" />
    `).join('')}
    ${Array.from({length: suite.failedTests}, (_, i) => `
    <testcase name="${suite.name}-failed-test-${i + 1}" time="${(suite.executionTime / suite.totalTests) / 1000}">
      <failure message="Test failed">Test failure details</failure>
    </testcase>
    `).join('')}
  </testsuite>
`).join('')}
</testsuites>`;
  }

  private generateConsoleReport(report: TestReport): void {
    console.log('\n🚀 ASTRAL_NOTES Test Report');
    console.log('='.repeat(50));
    console.log(`📅 Generated: ${report.metadata.timestamp}`);
    console.log(`⏱️  Execution Time: ${Math.round(report.metadata.executionTime)}ms`);
    console.log(`🎯 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`📊 Tests: ${report.summary.totalTests} total, ${report.summary.passedTests} passed, ${report.summary.failedTests} failed`);
    console.log(`📈 Coverage: ${report.coverage.global.statements.toFixed(1)}% statements`);
    console.log(`♿ Accessibility: ${report.quality.accessibilityScore.toFixed(1)}/100`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    console.log('='.repeat(50));
  }

  private generateCoverageTrends(): any[] {
    // Mock trend data - in real implementation, this would use historical data
    return [];
  }

  private generatePerformanceTrends(): any[] {
    // Mock trend data - in real implementation, this would use historical data
    return [];
  }

  private generateQualityTrends(): any[] {
    // Mock trend data - in real implementation, this would use historical data
    return [];
  }

  private async loadReportHistory(): Promise<void> {
    // In real implementation, load from persistent storage
    this.reportHistory = [];
  }

  private async saveReportHistory(): Promise<void> {
    // In real implementation, save to persistent storage
    // Keep only last 50 reports for trend analysis
    if (this.reportHistory.length > 50) {
      this.reportHistory = this.reportHistory.slice(-50);
    }
  }
}