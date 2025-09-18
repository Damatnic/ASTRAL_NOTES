#!/usr/bin/env node

/**
 * ASTRAL_NOTES Test Suite Runner
 * Command-line interface for running test suites with options
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const SUITE_PATHS = {
  'ui-smoke': 'src/__tests__/suites/ui-smoke',
  'ui-components': 'src/__tests__/suites/ui-components',
  'ai-services': 'src/__tests__/suites/services/ai-services.test.ts',
  'routing': 'src/__tests__/suites/routing/routing-app.test.tsx',
  'quick-notes': 'src/__tests__/suites/quick-notes',
  'project-management': 'src/__tests__/suites/project-management',
  'enhanced-editor': 'src/__tests__/suites/editor',
  'performance': 'src/__tests__/suites/performance',
  'accessibility': 'src/__tests__/suites/accessibility',
  'integration': 'src/__tests__/suites/integration',
  'master': 'src/__tests__/astral-notes-test-suite.ts',
  'all': 'src/__tests__/**/*.test.{ts,tsx}'
};

const CATEGORIES = {
  unit: ['ui-components', 'ai-services'],
  integration: ['routing', 'quick-notes', 'project-management', 'enhanced-editor', 'integration'],
  performance: ['performance'],
  accessibility: ['accessibility'],
  all: Object.keys(SUITE_PATHS).filter(key => key !== 'all' && key !== 'master')
};

async function runTestSuite(suite, options = {}) {
  console.log(`🧪 Running test suite: ${suite}`);
  
  const suitePath = SUITE_PATHS[suite];
  if (!suitePath) {
    console.error(`❌ Unknown test suite: ${suite}`);
    process.exit(1);
  }

  const vitestArgs = [
    'run',
    suitePath,
    options.watch ? '--watch' : '',
    options.coverage ? '--coverage' : '',
    options.ui ? '--ui' : '',
    options.reporter ? `--reporter=${options.reporter}` : '--reporter=verbose',
    options.timeout ? `--testTimeout=${options.timeout}` : '',
    options.bail ? '--bail' : '',
    options.verbose ? '--verbose' : '',
  ].filter(Boolean);

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    CI: options.ci ? 'true' : 'false',
    TEST_SUITE: suite,
    TEST_TIMEOUT: options.timeout || '30000',
  };

  try {
    const result = execSync(`npx vitest ${vitestArgs.join(' ')}`, {
      stdio: 'inherit',
      env,
      cwd: process.cwd(),
    });
    
    console.log(`✅ Test suite '${suite}' completed successfully`);
    return 0;
  } catch (error) {
    console.error(`❌ Test suite '${suite}' failed`);
    return error.status || 1;
  }
}

async function runCategory(category, options = {}) {
  console.log(`🎯 Running test category: ${category}`);
  
  const suites = CATEGORIES[category];
  if (!suites) {
    console.error(`❌ Unknown test category: ${category}`);
    process.exit(1);
  }

  let failedSuites = 0;
  
  if (options.parallel) {
    console.log(`🚀 Running ${suites.length} suites in parallel`);
    const processes = suites.map(suite => runTestSuite(suite, options));
    const results = await Promise.allSettled(processes);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected' || result.value !== 0) {
        failedSuites++;
        console.error(`❌ Suite '${suites[index]}' failed`);
      }
    });
  } else {
    console.log(`⏩ Running ${suites.length} suites sequentially`);
    for (const suite of suites) {
      const result = await runTestSuite(suite, options);
      if (result !== 0) {
        failedSuites++;
        if (options.bail) break;
      }
    }
  }

  if (failedSuites > 0) {
    console.error(`❌ ${failedSuites} suite(s) failed`);
    process.exit(1);
  } else {
    console.log(`✅ All suites in category '${category}' passed`);
  }
}

async function generateReport(options = {}) {
  console.log('📊 Generating comprehensive test report...');
  
  try {
    // Run master test suite to generate report
    await runTestSuite('master', { 
      ...options, 
      reporter: 'json,html,junit',
      coverage: true 
    });
    
    // Generate additional reports
    const reportDir = './test-results';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    console.log('📈 Generating coverage report...');
    execSync('npx vitest run --coverage --reporter=html', { stdio: 'inherit' });
    
    console.log('📊 Report generated successfully');
    console.log(`📁 Reports available in: ${path.resolve(reportDir)}`);
    
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
    process.exit(1);
  }
}

async function watchMode(suite = 'all') {
  console.log(`👀 Starting watch mode for: ${suite}`);
  
  const suitePath = SUITE_PATHS[suite] || SUITE_PATHS.all;
  
  const vitestProcess = spawn('npx', ['vitest', 'watch', suitePath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    }
  });

  vitestProcess.on('close', (code) => {
    console.log(`Watch mode exited with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping watch mode...');
    vitestProcess.kill('SIGINT');
    process.exit(0);
  });
}

function listSuites() {
  console.log('📋 Available test suites:');
  console.log('');
  
  Object.entries(SUITE_PATHS).forEach(([name, path]) => {
    console.log(`  ${name.padEnd(20)} ${path}`);
  });
  
  console.log('');
  console.log('📂 Available categories:');
  console.log('');
  
  Object.entries(CATEGORIES).forEach(([name, suites]) => {
    console.log(`  ${name.padEnd(20)} [${suites.join(', ')}]`);
  });
}

function validateEnvironment() {
  console.log('🔍 Validating test environment...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    console.error(`❌ Node.js ${nodeVersion} is not supported. Please use Node.js 16 or higher.`);
    process.exit(1);
  }
  
  // Check if vitest is available
  try {
    execSync('npx vitest --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Vitest is not available. Please run: npm install');
    process.exit(1);
  }
  
  // Check test files exist
  const testDir = './src/__tests__';
  if (!fs.existsSync(testDir)) {
    console.error(`❌ Test directory not found: ${testDir}`);
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

// CLI Configuration
const argv = yargs
  .scriptName('test-runner')
  .usage('$0 <command> [options]')
  .command('run [suite]', 'Run a specific test suite', (yargs) => {
    yargs.positional('suite', {
      describe: 'Test suite to run',
      choices: Object.keys(SUITE_PATHS),
      default: 'all'
    });
  })
  .command('category <category>', 'Run all suites in a category', (yargs) => {
    yargs.positional('category', {
      describe: 'Test category to run',
      choices: Object.keys(CATEGORIES),
      demandOption: true
    });
  })
  .command('watch [suite]', 'Run tests in watch mode', (yargs) => {
    yargs.positional('suite', {
      describe: 'Test suite to watch',
      choices: Object.keys(SUITE_PATHS),
      default: 'all'
    });
  })
  .command('report', 'Generate comprehensive test report')
  .command('list', 'List available test suites and categories')
  .command('validate', 'Validate test environment')
  .option('coverage', {
    alias: 'c',
    type: 'boolean',
    description: 'Generate coverage report'
  })
  .option('watch', {
    alias: 'w',
    type: 'boolean',
    description: 'Run in watch mode'
  })
  .option('ui', {
    alias: 'u',
    type: 'boolean',
    description: 'Open test UI'
  })
  .option('parallel', {
    alias: 'p',
    type: 'boolean',
    description: 'Run suites in parallel',
    default: false
  })
  .option('bail', {
    alias: 'b',
    type: 'boolean',
    description: 'Stop on first failure',
    default: false
  })
  .option('reporter', {
    alias: 'r',
    type: 'string',
    description: 'Test reporter',
    choices: ['verbose', 'json', 'html', 'junit'],
    default: 'verbose'
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    description: 'Test timeout in milliseconds',
    default: 30000
  })
  .option('ci', {
    type: 'boolean',
    description: 'Run in CI mode',
    default: false
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Verbose output',
    default: false
  })
  .help()
  .alias('help', 'h')
  .example('$0 run ai-services', 'Run AI services test suite')
  .example('$0 category unit --coverage', 'Run unit tests with coverage')
  .example('$0 watch enhanced-editor', 'Watch enhanced editor tests')
  .example('$0 run all --parallel --coverage', 'Run all tests in parallel with coverage')
  .argv;

// Main execution
async function main() {
  const command = argv._[0];
  
  try {
    switch (command) {
      case 'run':
        await runTestSuite(argv.suite, argv);
        break;
      
      case 'category':
        await runCategory(argv.category, argv);
        break;
      
      case 'watch':
        await watchMode(argv.suite);
        break;
      
      case 'report':
        await generateReport(argv);
        break;
      
      case 'list':
        listSuites();
        break;
      
      case 'validate':
        validateEnvironment();
        break;
      
      default:
        console.log('🚀 Welcome to ASTRAL_NOTES Test Suite Runner');
        console.log('');
        console.log('Usage examples:');
        console.log('  npm run test:suite ai-services     # Run AI services tests');
        console.log('  npm run test:category unit         # Run all unit tests');
        console.log('  npm run test:watch                 # Start watch mode');
        console.log('  npm run test:report                # Generate reports');
        console.log('');
        console.log('Use --help for more options');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  runCategory,
  generateReport,
  watchMode,
  listSuites,
  validateEnvironment
};


