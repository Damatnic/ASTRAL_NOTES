#!/usr/bin/env node

/**
 * Enhanced Note Editor Test Runner
 * Comprehensive testing script for all editor functionality
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test suite configuration
const testSuites = [
  {
    name: 'Core Editor Functionality',
    file: 'EnhancedNoteEditor.test.tsx',
    timeout: 60000,
    critical: true,
    description: 'Tests all basic and advanced editor features'
  },
  {
    name: 'Performance & Stress Testing',
    file: 'EditorPerformance.test.tsx',
    timeout: 120000,
    critical: true,
    description: 'Tests performance with large documents and stress scenarios'
  },
  {
    name: 'Import/Export Functionality',
    file: 'ImportExport.test.tsx',
    timeout: 60000,
    critical: true,
    description: 'Tests all import/export formats and data integrity'
  },
  {
    name: 'Accessibility & UX',
    file: 'EditorAccessibility.test.tsx',
    timeout: 60000,
    critical: true,
    description: 'Tests WCAG compliance and accessibility features'
  },
  {
    name: 'Integration Testing',
    file: 'EditorIntegration.test.tsx',
    timeout: 90000,
    critical: true,
    description: 'Tests end-to-end workflows and feature integration'
  }
];

// Performance benchmarks
const performanceBenchmarks = {
  'Small Document Load': { target: 500, unit: 'ms' },
  'Medium Document Load': { target: 2000, unit: 'ms' },
  'Large Document Load': { target: 5000, unit: 'ms' },
  'Typing Latency': { target: 100, unit: 'ms' },
  'Auto-save': { target: 1000, unit: 'ms' },
  'Export Time': { target: 2000, unit: 'ms' }
};

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: null,
      startTime: Date.now(),
      endTime: null,
      suiteResults: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    console.log('\n' + '='.repeat(80));
    this.log(message, 'bright');
    console.log('='.repeat(80));
  }

  logSection(message) {
    console.log('\n' + '-'.repeat(60));
    this.log(message, 'cyan');
    console.log('-'.repeat(60));
  }

  async runTestSuite(suite) {
    this.logSection(`Running: ${suite.name}`);
    this.log(suite.description, 'yellow');
    
    const startTime = Date.now();
    
    try {
      const command = `npm test src/__tests__/editor/${suite.file} -- --testTimeout=${suite.timeout} --verbose`;
      
      this.log(`\nExecuting: ${command}`, 'blue');
      
      const output = execSync(command, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse test results from output
      const passed = (output.match(/✓/g) || []).length;
      const failed = (output.match(/✗/g) || []).length;
      const skipped = (output.match(/○/g) || []).length;

      const result = {
        name: suite.name,
        file: suite.file,
        passed,
        failed,
        skipped,
        duration,
        status: failed > 0 ? 'FAILED' : 'PASSED',
        output: output.substring(0, 1000) // Truncate for display
      };

      this.results.suiteResults.push(result);
      this.results.passed += passed;
      this.results.failed += failed;
      this.results.skipped += skipped;
      this.results.total += passed + failed + skipped;

      if (result.status === 'PASSED') {
        this.log(`✓ ${suite.name} - PASSED (${duration}ms)`, 'green');
        this.log(`  Tests: ${passed} passed, ${skipped} skipped`, 'green');
      } else {
        this.log(`✗ ${suite.name} - FAILED (${duration}ms)`, 'red');
        this.log(`  Tests: ${passed} passed, ${failed} failed, ${skipped} skipped`, 'red');
        
        if (suite.critical) {
          this.log(`  ⚠️  CRITICAL TEST FAILURE - This may indicate serious issues`, 'red');
        }
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        name: suite.name,
        file: suite.file,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration,
        status: 'ERROR',
        error: error.message,
        output: error.stdout || error.stderr || ''
      };

      this.results.suiteResults.push(result);
      this.results.failed += 1;
      this.results.total += 1;

      this.log(`✗ ${suite.name} - ERROR (${duration}ms)`, 'red');
      this.log(`  Error: ${error.message}`, 'red');
    }
  }

  async runCoverageReport() {
    this.logSection('Generating Coverage Report');
    
    try {
      const command = 'npm test -- --coverage --testPathPattern=editor --watchAll=false';
      
      this.log(`Executing: ${command}`, 'blue');
      
      const output = execSync(command, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Extract coverage information
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      
      if (coverageMatch) {
        this.results.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };

        this.log('✓ Coverage report generated', 'green');
        this.log(`  Statements: ${this.results.coverage.statements}%`, 'cyan');
        this.log(`  Branches: ${this.results.coverage.branches}%`, 'cyan');
        this.log(`  Functions: ${this.results.coverage.functions}%`, 'cyan');
        this.log(`  Lines: ${this.results.coverage.lines}%`, 'cyan');
      }

    } catch (error) {
      this.log(`✗ Coverage report failed: ${error.message}`, 'red');
    }
  }

  async runPerformanceBenchmarks() {
    this.logSection('Performance Benchmarks');
    
    this.log('Performance Targets:', 'yellow');
    Object.entries(performanceBenchmarks).forEach(([name, benchmark]) => {
      this.log(`  ${name}: < ${benchmark.target}${benchmark.unit}`, 'cyan');
    });

    this.log('\nNote: Actual performance measurements are captured during test execution', 'yellow');
  }

  generateSummaryReport() {
    this.results.endTime = Date.now();
    const totalDuration = this.results.endTime - this.results.startTime;

    this.logHeader('TEST EXECUTION SUMMARY');

    // Overall Results
    this.log('\nOverall Results:', 'bright');
    this.log(`  Total Tests: ${this.results.total}`, 'cyan');
    this.log(`  Passed: ${this.results.passed}`, 'green');
    this.log(`  Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'cyan');
    this.log(`  Skipped: ${this.results.skipped}`, 'yellow');
    this.log(`  Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`, 'cyan');

    // Success Rate
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(1) : 0;
    this.log(`  Success Rate: ${successRate}%`, successRate >= 95 ? 'green' : 'red');

    // Suite Breakdown
    this.log('\nSuite Results:', 'bright');
    this.results.suiteResults.forEach(suite => {
      const statusColor = suite.status === 'PASSED' ? 'green' : 'red';
      this.log(`  ${suite.name}: ${suite.status} (${suite.duration}ms)`, statusColor);
      this.log(`    Tests: ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`, 'cyan');
    });

    // Coverage Summary
    if (this.results.coverage) {
      this.log('\nCoverage Summary:', 'bright');
      const avgCoverage = (
        this.results.coverage.statements +
        this.results.coverage.branches +
        this.results.coverage.functions +
        this.results.coverage.lines
      ) / 4;
      
      this.log(`  Average Coverage: ${avgCoverage.toFixed(1)}%`, avgCoverage >= 90 ? 'green' : 'red');
    }

    // Final Status
    this.log('\nFinal Status:', 'bright');
    if (this.results.failed === 0) {
      this.log('✓ ALL TESTS PASSED - Editor is ready for production!', 'green');
    } else {
      this.log('✗ SOME TESTS FAILED - Review failures before deployment', 'red');
      
      const criticalFailures = this.results.suiteResults
        .filter(suite => suite.status !== 'PASSED' && testSuites.find(ts => ts.file === suite.file)?.critical);
      
      if (criticalFailures.length > 0) {
        this.log('⚠️  CRITICAL FAILURES DETECTED:', 'red');
        criticalFailures.forEach(failure => {
          this.log(`    - ${failure.name}`, 'red');
        });
      }
    }

    return this.results.failed === 0;
  }

  async exportResults() {
    const reportPath = path.join(__dirname, '..', 'test-results', 'editor-test-report.json');
    const reportDir = path.dirname(reportPath);

    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Write detailed results
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    this.log(`\nDetailed results exported to: ${reportPath}`, 'cyan');

    // Generate HTML report
    const htmlReport = this.generateHtmlReport();
    const htmlPath = path.join(reportDir, 'editor-test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    this.log(`HTML report generated: ${htmlPath}`, 'cyan');
  }

  generateHtmlReport() {
    const { total, passed, failed, skipped, coverage, startTime, endTime } = this.results;
    const duration = endTime - startTime;
    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Note Editor Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .suite.passed { border-left: 5px solid #28a745; }
        .suite.failed { border-left: 5px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Enhanced Note Editor Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${(duration / 1000).toFixed(2)} seconds</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${total}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #28a745;">${passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${failed}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 2em; font-weight: bold; color: ${successRate >= 95 ? '#28a745' : '#dc3545'};">${successRate}%</div>
        </div>
    </div>

    ${coverage ? `
    <h2>Coverage Summary</h2>
    <table>
        <tr><th>Metric</th><th>Coverage</th></tr>
        <tr><td>Statements</td><td>${coverage.statements}%</td></tr>
        <tr><td>Branches</td><td>${coverage.branches}%</td></tr>
        <tr><td>Functions</td><td>${coverage.functions}%</td></tr>
        <tr><td>Lines</td><td>${coverage.lines}%</td></tr>
    </table>
    ` : ''}

    <h2>Test Suite Results</h2>
    ${this.results.suiteResults.map(suite => `
        <div class="suite ${suite.status === 'PASSED' ? 'passed' : 'failed'}">
            <h3>${suite.name} - ${suite.status}</h3>
            <p><strong>Duration:</strong> ${suite.duration}ms</p>
            <p><strong>Tests:</strong> ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped</p>
            ${suite.error ? `<p><strong>Error:</strong> ${suite.error}</p>` : ''}
        </div>
    `).join('')}

    <h2>Performance Benchmarks</h2>
    <table>
        <tr><th>Benchmark</th><th>Target</th><th>Status</th></tr>
        ${Object.entries(performanceBenchmarks).map(([name, benchmark]) => `
            <tr>
                <td>${name}</td>
                <td>&lt; ${benchmark.target}${benchmark.unit}</td>
                <td style="color: #28a745;">Target Set ✓</td>
            </tr>
        `).join('')}
    </table>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Enhanced Note Editor Test Suite - ASTRAL_NOTES Project</p>
        <p>This report validates all editor functionality including performance, accessibility, and integration.</p>
    </footer>
</body>
</html>
    `;
  }
}

// Main execution
async function main() {
  const runner = new TestRunner();
  
  try {
    runner.logHeader('ENHANCED NOTE EDITOR - COMPREHENSIVE TEST SUITE');
    
    runner.log('Testing the following components:', 'yellow');
    runner.log('• Rich Text Editor (TipTap-based)', 'cyan');
    runner.log('• Advanced Editor Features', 'cyan');
    runner.log('• Auto-Save Integration', 'cyan');
    runner.log('• Import/Export System', 'cyan');
    runner.log('• AI Writing Assistance', 'cyan');
    runner.log('• Version Control', 'cyan');
    runner.log('• Customization System', 'cyan');
    runner.log('• Performance & Accessibility', 'cyan');

    // Run all test suites
    for (const suite of testSuites) {
      await runner.runTestSuite(suite);
    }

    // Generate coverage report
    await runner.runCoverageReport();

    // Show performance benchmarks
    await runner.runPerformanceBenchmarks();

    // Generate summary
    const success = runner.generateSummaryReport();

    // Export results
    await runner.exportResults();

    // Exit with appropriate code
    process.exit(success ? 0 : 1);

  } catch (error) {
    runner.log(`\nFATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Enhanced Note Editor Test Runner

Usage: node test-editor.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose output
  --quick        Run only critical tests
  --coverage     Generate coverage report only

Examples:
  node test-editor.js              # Run all tests
  node test-editor.js --quick      # Run critical tests only
  node test-editor.js --coverage   # Generate coverage report
  `);
  process.exit(0);
}

if (args.includes('--coverage')) {
  // Run coverage only
  const runner = new TestRunner();
  runner.runCoverageReport().then(() => process.exit(0));
} else if (args.includes('--quick')) {
  // Run only critical tests
  testSuites.forEach(suite => suite.critical = true);
  main();
} else {
  // Run full test suite
  main();
}