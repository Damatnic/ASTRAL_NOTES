/**
 * Quick Notes Comprehensive Test Suite
 * Master test runner that orchestrates all Quick Notes testing and generates comprehensive reports
 */

import { quickNotesCrudTests } from './quickNotesCrudTests';
import { quickNotesAutoSaveTests } from './quickNotesAutoSaveTests';
import { quickNotesSearchTests } from './quickNotesSearchTests';
import { quickNotesAttachmentTests } from './quickNotesAttachmentTests';
import { quickNotesImportExportTests } from './quickNotesImportExportTests';
import { quickNotesTestDataGenerator } from './quickNotesTestDataGenerator';

export interface ComprehensiveTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

export interface TestSuiteResult {
  suiteName: string;
  results: ComprehensiveTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export interface ComprehensiveTestReport {
  executionId: string;
  timestamp: string;
  environment: {
    userAgent: string;
    platform: string;
    language: string;
    storageAvailable: boolean;
    localStorageSize: number;
  };
  summary: {
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalDuration: number;
    passRate: number;
    averageTestTime: number;
  };
  suiteResults: TestSuiteResult[];
  coverage: {
    crudOperations: TestCoverageResult;
    autoSave: TestCoverageResult;
    searchFiltering: TestCoverageResult;
    projectAttachment: TestCoverageResult;
    importExport: TestCoverageResult;
  };
  performance: {
    fastestTest: { name: string; duration: number };
    slowestTest: { name: string; duration: number };
    averageSuiteDuration: number;
    performanceIssues: string[];
  };
  dataQuality: {
    testDataGenerated: number;
    edgeCasesCovered: number;
    errorScenariosTested: number;
    dataIntegrityValidated: boolean;
  };
  recommendations: string[];
  issues: {
    critical: string[];
    warnings: string[];
    information: string[];
  };
}

export interface TestCoverageResult {
  totalFeatures: number;
  testedFeatures: number;
  coveragePercentage: number;
  missingTests: string[];
  featureTests: {
    [feature: string]: {
      tested: boolean;
      testCount: number;
      passRate: number;
    };
  };
}

export class QuickNotesComprehensiveTestSuite {
  private executionId: string;
  private startTime: number = 0;
  private endTime: number = 0;

  constructor() {
    this.executionId = this.generateExecutionId();
  }

  /**
   * Run the complete Quick Notes test suite
   */
  public async runComprehensiveTests(): Promise<ComprehensiveTestReport> {
    console.log('🚀 Starting Quick Notes Comprehensive Test Suite...');
    console.log(`📋 Execution ID: ${this.executionId}`);
    
    this.startTime = Date.now();
    
    const suiteResults: TestSuiteResult[] = [];
    
    try {
      // Run all test suites
      console.log('\n🔧 Running CRUD Operations Tests...');
      const crudResults = await quickNotesCrudTests.runAllTests();
      suiteResults.push(crudResults);
      
      console.log('\n💾 Running Auto-Save Tests...');
      const autoSaveResults = await quickNotesAutoSaveTests.runAllTests();
      suiteResults.push(autoSaveResults);
      
      console.log('\n🔍 Running Search & Filtering Tests...');
      const searchResults = await quickNotesSearchTests.runAllTests();
      suiteResults.push(searchResults);
      
      console.log('\n🔗 Running Project Attachment Tests...');
      const attachmentResults = await quickNotesAttachmentTests.runAllTests();
      suiteResults.push(attachmentResults);
      
      console.log('\n📁 Running Import/Export Tests...');
      const importExportResults = await quickNotesImportExportTests.runAllTests();
      suiteResults.push(importExportResults);
      
      this.endTime = Date.now();
      
      // Generate comprehensive report
      const report = this.generateComprehensiveReport(suiteResults);
      
      // Print summary
      this.printTestSummary(report);
      
      return report;
      
    } catch (error) {
      this.endTime = Date.now();
      console.error('❌ Comprehensive test suite failed:', error);
      throw error;
    }
  }

  /**
   * Generate detailed test report
   */
  private generateComprehensiveReport(suiteResults: TestSuiteResult[]): ComprehensiveTestReport {
    const summary = this.calculateSummary(suiteResults);
    const environment = this.getEnvironmentInfo();
    const coverage = this.analyzeCoverage(suiteResults);
    const performance = this.analyzePerformance(suiteResults);
    const dataQuality = this.analyzeDataQuality(suiteResults);
    const { recommendations, issues } = this.analyzeResults(suiteResults);

    return {
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      environment,
      summary,
      suiteResults,
      coverage,
      performance,
      dataQuality,
      recommendations,
      issues,
    };
  }

  /**
   * Calculate overall test summary
   */
  private calculateSummary(suiteResults: TestSuiteResult[]): ComprehensiveTestReport['summary'] {
    const totalSuites = suiteResults.length;
    const totalTests = suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = suiteResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = suiteResults.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = this.endTime - this.startTime;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageTestTime = totalTests > 0 ? totalDuration / totalTests : 0;

    return {
      totalSuites,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      passRate,
      averageTestTime,
    };
  }

  /**
   * Get environment information
   */
  private getEnvironmentInfo(): ComprehensiveTestReport['environment'] {
    const storageTest = () => {
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    };

    const getLocalStorageSize = () => {
      try {
        let size = 0;
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            size += localStorage[key].length + key.length;
          }
        }
        return size;
      } catch {
        return 0;
      }
    };

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      storageAvailable: storageTest(),
      localStorageSize: getLocalStorageSize(),
    };
  }

  /**
   * Analyze test coverage for each area
   */
  private analyzeCoverage(suiteResults: TestSuiteResult[]): ComprehensiveTestReport['coverage'] {
    return {
      crudOperations: this.analyzeSuiteCoverage('CRUD Operations', suiteResults),
      autoSave: this.analyzeSuiteCoverage('Auto-Save Functionality', suiteResults),
      searchFiltering: this.analyzeSuiteCoverage('Search & Filtering', suiteResults),
      projectAttachment: this.analyzeSuiteCoverage('Project Attachment System', suiteResults),
      importExport: this.analyzeSuiteCoverage('Import/Export Features', suiteResults),
    };
  }

  /**
   * Analyze coverage for a specific test suite
   */
  private analyzeSuiteCoverage(suiteName: string, suiteResults: TestSuiteResult[]): TestCoverageResult {
    const suite = suiteResults.find(s => s.suiteName.includes(suiteName.split(' ')[0]));
    
    if (!suite) {
      return {
        totalFeatures: 0,
        testedFeatures: 0,
        coveragePercentage: 0,
        missingTests: [],
        featureTests: {},
      };
    }

    // Define expected features for each suite
    const expectedFeatures = this.getExpectedFeatures(suiteName);
    const testedFeatures = this.getTestedFeatures(suite);
    
    const coverage = (testedFeatures.length / expectedFeatures.length) * 100;
    const missingTests = expectedFeatures.filter(feature => !testedFeatures.includes(feature));
    
    const featureTests: { [feature: string]: { tested: boolean; testCount: number; passRate: number } } = {};
    
    expectedFeatures.forEach(feature => {
      const relatedTests = suite.results.filter(test => 
        test.testName.toLowerCase().includes(feature.toLowerCase())
      );
      
      featureTests[feature] = {
        tested: relatedTests.length > 0,
        testCount: relatedTests.length,
        passRate: relatedTests.length > 0 
          ? (relatedTests.filter(test => test.passed).length / relatedTests.length) * 100 
          : 0,
      };
    });

    return {
      totalFeatures: expectedFeatures.length,
      testedFeatures: testedFeatures.length,
      coveragePercentage: coverage,
      missingTests,
      featureTests,
    };
  }

  /**
   * Get expected features for each test suite
   */
  private getExpectedFeatures(suiteName: string): string[] {
    const featureMap: { [key: string]: string[] } = {
      'CRUD Operations': [
        'Create', 'Read', 'Update', 'Delete', 'Bulk Operations', 
        'Data Integrity', 'Error Handling', 'Edge Cases', 'Performance'
      ],
      'Auto-Save Functionality': [
        'Auto Save', 'Debounce', 'Conflict Resolution', 'Offline Queue',
        'Save Status', 'Performance', 'Error Handling'
      ],
      'Search & Filtering': [
        'Text Search', 'Tag Filtering', 'Type Filtering', 'Date Range',
        'Sorting', 'Case Sensitivity', 'Special Characters', 'Performance'
      ],
      'Project Attachment System': [
        'Basic Attachment', 'Smart Suggestions', 'Attachment Rules',
        'Bulk Operations', 'Migration Wizard', 'Analytics', 'Performance'
      ],
      'Import/Export Features': [
        'Export', 'Import', 'Format Validation', 'Data Integrity',
        'Error Handling', 'Performance'
      ],
    };

    return featureMap[suiteName] || [];
  }

  /**
   * Get tested features from suite results
   */
  private getTestedFeatures(suite: TestSuiteResult): string[] {
    const features = new Set<string>();
    
    suite.results.forEach(test => {
      const testName = test.testName.toLowerCase();
      
      // Extract feature names from test names
      if (testName.includes('create')) features.add('Create');
      if (testName.includes('read') || testName.includes('get')) features.add('Read');
      if (testName.includes('update')) features.add('Update');
      if (testName.includes('delete')) features.add('Delete');
      if (testName.includes('bulk')) features.add('Bulk Operations');
      if (testName.includes('auto') && testName.includes('save')) features.add('Auto Save');
      if (testName.includes('debounce')) features.add('Debounce');
      if (testName.includes('search')) features.add('Text Search');
      if (testName.includes('tag')) features.add('Tag Filtering');
      if (testName.includes('filter')) features.add('Type Filtering');
      if (testName.includes('date')) features.add('Date Range');
      if (testName.includes('sort')) features.add('Sorting');
      if (testName.includes('case')) features.add('Case Sensitivity');
      if (testName.includes('special')) features.add('Special Characters');
      if (testName.includes('attach')) features.add('Basic Attachment');
      if (testName.includes('suggest')) features.add('Smart Suggestions');
      if (testName.includes('rule')) features.add('Attachment Rules');
      if (testName.includes('migration')) features.add('Migration Wizard');
      if (testName.includes('analytic')) features.add('Analytics');
      if (testName.includes('export')) features.add('Export');
      if (testName.includes('import')) features.add('Import');
      if (testName.includes('format')) features.add('Format Validation');
      if (testName.includes('integrity')) features.add('Data Integrity');
      if (testName.includes('error')) features.add('Error Handling');
      if (testName.includes('performance')) features.add('Performance');
      if (testName.includes('edge')) features.add('Edge Cases');
      if (testName.includes('conflict')) features.add('Conflict Resolution');
      if (testName.includes('offline')) features.add('Offline Queue');
      if (testName.includes('status')) features.add('Save Status');
    });

    return Array.from(features);
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(suiteResults: TestSuiteResult[]): ComprehensiveTestReport['performance'] {
    const allTests = suiteResults.flatMap(suite => 
      suite.results.map(test => ({
        name: `${suite.suiteName}: ${test.testName}`,
        duration: test.duration,
      }))
    );

    const sortedByDuration = allTests.sort((a, b) => a.duration - b.duration);
    const fastestTest = sortedByDuration[0] || { name: 'None', duration: 0 };
    const slowestTest = sortedByDuration[sortedByDuration.length - 1] || { name: 'None', duration: 0 };
    
    const averageSuiteDuration = suiteResults.reduce((sum, suite) => sum + suite.totalDuration, 0) / suiteResults.length;
    
    const performanceIssues: string[] = [];
    
    // Identify performance issues
    const slowTests = allTests.filter(test => test.duration > 1000);
    if (slowTests.length > 0) {
      performanceIssues.push(`${slowTests.length} tests took longer than 1 second`);
    }
    
    const verySlow = allTests.filter(test => test.duration > 5000);
    if (verySlow.length > 0) {
      performanceIssues.push(`${verySlow.length} tests took longer than 5 seconds`);
    }
    
    const avgTestTime = allTests.reduce((sum, test) => sum + test.duration, 0) / allTests.length;
    if (avgTestTime > 500) {
      performanceIssues.push(`Average test time is high: ${avgTestTime.toFixed(0)}ms`);
    }

    return {
      fastestTest,
      slowestTest,
      averageSuiteDuration,
      performanceIssues,
    };
  }

  /**
   * Analyze data quality metrics
   */
  private analyzeDataQuality(suiteResults: TestSuiteResult[]): ComprehensiveTestReport['dataQuality'] {
    const allTests = suiteResults.flatMap(suite => suite.results);
    
    // Count different types of tests
    const testDataGenerated = allTests.filter(test => 
      test.testName.toLowerCase().includes('data') || 
      test.testName.toLowerCase().includes('generate')
    ).length;
    
    const edgeCasesCovered = allTests.filter(test => 
      test.testName.toLowerCase().includes('edge') ||
      test.testName.toLowerCase().includes('special') ||
      test.testName.toLowerCase().includes('invalid') ||
      test.testName.toLowerCase().includes('empty')
    ).length;
    
    const errorScenariosTested = allTests.filter(test => 
      test.testName.toLowerCase().includes('error') ||
      test.testName.toLowerCase().includes('fail') ||
      test.testName.toLowerCase().includes('invalid')
    ).length;
    
    const integrityTests = allTests.filter(test => 
      test.testName.toLowerCase().includes('integrity') ||
      test.testName.toLowerCase().includes('roundtrip') ||
      test.testName.toLowerCase().includes('preservation')
    );
    
    const dataIntegrityValidated = integrityTests.length > 0 && integrityTests.every(test => test.passed);

    return {
      testDataGenerated,
      edgeCasesCovered,
      errorScenariosTested,
      dataIntegrityValidated,
    };
  }

  /**
   * Analyze results and generate recommendations
   */
  private analyzeResults(suiteResults: TestSuiteResult[]): {
    recommendations: string[];
    issues: { critical: string[]; warnings: string[]; information: string[] };
  } {
    const recommendations: string[] = [];
    const critical: string[] = [];
    const warnings: string[] = [];
    const information: string[] = [];
    
    const allTests = suiteResults.flatMap(suite => suite.results);
    const failedTests = allTests.filter(test => !test.passed);
    const totalTests = allTests.length;
    const passRate = totalTests > 0 ? (allTests.filter(test => test.passed).length / totalTests) * 100 : 0;
    
    // Analyze pass rates
    if (passRate < 90) {
      critical.push(`Low overall pass rate: ${passRate.toFixed(1)}%`);
      recommendations.push('Investigate and fix failing tests to improve system reliability');
    } else if (passRate < 95) {
      warnings.push(`Pass rate could be improved: ${passRate.toFixed(1)}%`);
      recommendations.push('Review failing tests for potential system improvements');
    } else {
      information.push(`Excellent pass rate: ${passRate.toFixed(1)}%`);
    }
    
    // Analyze individual suites
    suiteResults.forEach(suite => {
      const suitePassRate = (suite.passedTests / suite.totalTests) * 100;
      
      if (suitePassRate < 90) {
        critical.push(`${suite.suiteName} has low pass rate: ${suitePassRate.toFixed(1)}%`);
      } else if (suitePassRate < 95) {
        warnings.push(`${suite.suiteName} pass rate: ${suitePassRate.toFixed(1)}%`);
      }
      
      if (suite.totalDuration > 10000) {
        warnings.push(`${suite.suiteName} is slow: ${suite.totalDuration}ms`);
        recommendations.push(`Optimize ${suite.suiteName} test performance`);
      }
    });
    
    // Analyze specific failure patterns
    const errorPatterns = this.analyzeErrorPatterns(failedTests);
    errorPatterns.forEach(pattern => {
      if (pattern.count > 1) {
        warnings.push(`Multiple tests failing with similar errors: ${pattern.pattern}`);
        recommendations.push(`Investigate common cause for: ${pattern.pattern}`);
      }
    });
    
    // Coverage recommendations
    const lowCoverageSuites = suiteResults.filter(suite => 
      (suite.passedTests / suite.totalTests) < 0.8
    );
    
    if (lowCoverageSuites.length > 0) {
      recommendations.push('Add more comprehensive tests for low-coverage areas');
    }
    
    // Performance recommendations
    const slowTests = allTests.filter(test => test.duration > 1000);
    if (slowTests.length > 0) {
      recommendations.push('Optimize slow tests and consider performance improvements');
    }
    
    // General recommendations
    if (totalTests < 50) {
      recommendations.push('Consider adding more tests to improve coverage');
    }
    
    if (failedTests.length === 0) {
      recommendations.push('Excellent test results! Consider adding edge case tests');
    }
    
    return { recommendations, issues: { critical, warnings, information } };
  }

  /**
   * Analyze error patterns in failed tests
   */
  private analyzeErrorPatterns(failedTests: ComprehensiveTestResult[]): Array<{ pattern: string; count: number }> {
    const patterns = new Map<string, number>();
    
    failedTests.forEach(test => {
      if (test.error) {
        const error = test.error.toLowerCase();
        
        // Common error patterns
        if (error.includes('timeout')) {
          patterns.set('timeout', (patterns.get('timeout') || 0) + 1);
        }
        if (error.includes('not found')) {
          patterns.set('not found', (patterns.get('not found') || 0) + 1);
        }
        if (error.includes('null') || error.includes('undefined')) {
          patterns.set('null/undefined', (patterns.get('null/undefined') || 0) + 1);
        }
        if (error.includes('permission') || error.includes('access')) {
          patterns.set('access', (patterns.get('access') || 0) + 1);
        }
        if (error.includes('storage') || error.includes('localStorage')) {
          patterns.set('storage', (patterns.get('storage') || 0) + 1);
        }
        if (error.includes('json') || error.includes('parse')) {
          patterns.set('parsing', (patterns.get('parsing') || 0) + 1);
        }
      }
    });
    
    return Array.from(patterns.entries()).map(([pattern, count]) => ({ pattern, count }));
  }

  /**
   * Print test summary to console
   */
  private printTestSummary(report: ComprehensiveTestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 QUICK NOTES COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n🕒 Execution Time: ${(report.summary.totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`📋 Execution ID: ${report.executionId}`);
    console.log(`🌐 Environment: ${report.environment.platform} - ${report.environment.userAgent.split(' ')[0]}`);
    
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Test Suites: ${report.summary.totalSuites}`);
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   ✅ Passed: ${report.summary.passedTests}`);
    console.log(`   ❌ Failed: ${report.summary.failedTests}`);
    console.log(`   📊 Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    console.log(`   ⏱️  Average Test Time: ${report.summary.averageTestTime.toFixed(0)}ms`);
    
    console.log('\n🧪 TEST SUITES:');
    report.suiteResults.forEach(suite => {
      const passRate = (suite.passedTests / suite.totalTests) * 100;
      const statusIcon = passRate >= 95 ? '✅' : passRate >= 90 ? '⚠️' : '❌';
      console.log(`   ${statusIcon} ${suite.suiteName}: ${suite.passedTests}/${suite.totalTests} (${passRate.toFixed(1)}%) - ${suite.totalDuration}ms`);
    });
    
    console.log('\n🎯 COVERAGE:');
    Object.entries(report.coverage).forEach(([area, coverage]) => {
      const icon = coverage.coveragePercentage >= 90 ? '✅' : coverage.coveragePercentage >= 70 ? '⚠️' : '❌';
      console.log(`   ${icon} ${area}: ${coverage.coveragePercentage.toFixed(1)}% (${coverage.testedFeatures}/${coverage.totalFeatures} features)`);
    });
    
    console.log('\n🚀 PERFORMANCE:');
    console.log(`   ⚡ Fastest Test: ${report.performance.fastestTest.name} (${report.performance.fastestTest.duration}ms)`);
    console.log(`   🐌 Slowest Test: ${report.performance.slowestTest.name} (${report.performance.slowestTest.duration}ms)`);
    if (report.performance.performanceIssues.length > 0) {
      console.log('   ⚠️  Performance Issues:');
      report.performance.performanceIssues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
    }
    
    if (report.issues.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.issues.critical.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
    }
    
    if (report.issues.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.issues.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(recommendation => {
        console.log(`   💡 ${recommendation}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 Test execution completed successfully!');
    console.log('='.repeat(80));
  }

  /**
   * Export test report to file
   */
  public exportReport(report: ComprehensiveTestReport, format: 'json' | 'html' | 'markdown' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'html':
        return this.generateHtmlReport(report);
      
      case 'markdown':
        return this.generateMarkdownReport(report);
      
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: ComprehensiveTestReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Notes Test Report - ${report.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; border-left: 4px solid #007cba; border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-result { padding: 5px 0; border-bottom: 1px solid #eee; }
        .test-result:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Quick Notes Comprehensive Test Report</h1>
        <p><strong>Execution ID:</strong> ${report.executionId}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
        <p><strong>Environment:</strong> ${report.environment.platform} - ${report.environment.language}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <h2>${report.summary.totalTests}</h2>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <h2 class="${report.summary.passRate >= 95 ? 'passed' : report.summary.passRate >= 90 ? 'warning' : 'failed'}">${report.summary.passRate.toFixed(1)}%</h2>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <h2>${(report.summary.totalDuration / 1000).toFixed(2)}s</h2>
        </div>
        <div class="metric">
            <h3>Avg Test Time</h3>
            <h2>${report.summary.averageTestTime.toFixed(0)}ms</h2>
        </div>
    </div>
    
    <h2>Test Suites</h2>
    ${report.suiteResults.map(suite => {
      const passRate = (suite.passedTests / suite.totalTests) * 100;
      return `
        <div class="suite">
            <h3>${suite.suiteName}</h3>
            <p><strong>Tests:</strong> ${suite.passedTests}/${suite.totalTests} passed (${passRate.toFixed(1)}%)</p>
            <p><strong>Duration:</strong> ${suite.totalDuration}ms</p>
            <details>
                <summary>Test Details (${suite.results.length} tests)</summary>
                ${suite.results.map(test => `
                    <div class="test-result">
                        <span class="${test.passed ? 'passed' : 'failed'}">${test.passed ? '✅' : '❌'}</span>
                        <strong>${test.testName}</strong> (${test.duration}ms)
                        ${test.error ? `<br><small style="color: #dc3545;">Error: ${test.error}</small>` : ''}
                    </div>
                `).join('')}
            </details>
        </div>
      `;
    }).join('')}
    
    ${report.recommendations.length > 0 ? `
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    ` : ''}
    
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Generated by Quick Notes Comprehensive Test Suite</p>
    </footer>
</body>
</html>
    `;
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(report: ComprehensiveTestReport): string {
    return `# Quick Notes Comprehensive Test Report

**Execution ID:** ${report.executionId}  
**Timestamp:** ${report.timestamp}  
**Environment:** ${report.environment.platform} - ${report.environment.language}  

## Summary

| Metric | Value |
|--------|-------|
| Total Suites | ${report.summary.totalSuites} |
| Total Tests | ${report.summary.totalTests} |
| Passed Tests | ${report.summary.passedTests} |
| Failed Tests | ${report.summary.failedTests} |
| Pass Rate | ${report.summary.passRate.toFixed(1)}% |
| Total Duration | ${(report.summary.totalDuration / 1000).toFixed(2)}s |
| Average Test Time | ${report.summary.averageTestTime.toFixed(0)}ms |

## Test Suites

${report.suiteResults.map(suite => {
  const passRate = (suite.passedTests / suite.totalTests) * 100;
  const statusIcon = passRate >= 95 ? '✅' : passRate >= 90 ? '⚠️' : '❌';
  return `### ${statusIcon} ${suite.suiteName}

- **Tests:** ${suite.passedTests}/${suite.totalTests} passed (${passRate.toFixed(1)}%)
- **Duration:** ${suite.totalDuration}ms

<details>
<summary>Test Details</summary>

${suite.results.map(test => `- ${test.passed ? '✅' : '❌'} ${test.testName} (${test.duration}ms)${test.error ? `\n  - Error: ${test.error}` : ''}`).join('\n')}

</details>
`;
}).join('\n')}

## Coverage Analysis

${Object.entries(report.coverage).map(([area, coverage]) => {
  const icon = coverage.coveragePercentage >= 90 ? '✅' : coverage.coveragePercentage >= 70 ? '⚠️' : '❌';
  return `- ${icon} **${area}:** ${coverage.coveragePercentage.toFixed(1)}% (${coverage.testedFeatures}/${coverage.totalFeatures} features)`;
}).join('\n')}

## Performance Analysis

- **Fastest Test:** ${report.performance.fastestTest.name} (${report.performance.fastestTest.duration}ms)
- **Slowest Test:** ${report.performance.slowestTest.name} (${report.performance.slowestTest.duration}ms)
- **Average Suite Duration:** ${report.performance.averageSuiteDuration.toFixed(0)}ms

${report.performance.performanceIssues.length > 0 ? `
### Performance Issues
${report.performance.performanceIssues.map(issue => `- ⚠️ ${issue}`).join('\n')}
` : ''}

${report.issues.critical.length > 0 ? `
## 🚨 Critical Issues
${report.issues.critical.map(issue => `- ❌ ${issue}`).join('\n')}
` : ''}

${report.issues.warnings.length > 0 ? `
## ⚠️ Warnings
${report.issues.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
## 💡 Recommendations
${report.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}
` : ''}

---
*Generated by Quick Notes Comprehensive Test Suite*
`;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `qn_test_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const quickNotesComprehensiveTestSuite = new QuickNotesComprehensiveTestSuite();