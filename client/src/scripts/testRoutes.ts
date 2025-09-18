/**
 * Route Testing Script
 * Run this script to test all routes in the application
 */

import { runRouteTests, RouteTester } from '../utils/routeTester';

async function main() {
  console.log('🚀 Starting ASTRAL_NOTES Route Testing...\n');

  try {
    const tester = new RouteTester({
      baseUrl: 'http://localhost:7892',
      timeout: 10000, // 10 second timeout
      retries: 1
    });

    console.log('Testing all routes...');
    const results = await tester.testAllRoutes();
    
    // Generate and save report
    const report = tester.generateReport();
    console.log(report);
    
    // Get issues that need fixing
    const issues = tester.getIssuesFound();
    
    if (issues.missingRoutes.length > 0) {
      console.log('\n❌ Missing Routes Found:');
      issues.missingRoutes.forEach(route => {
        console.log(`  - ${route}`);
      });
    }
    
    if (issues.errorRoutes.length > 0) {
      console.log('\n🐛 Routes with Errors:');
      issues.errorRoutes.forEach(route => {
        console.log(`  - ${route.path}: ${route.error}`);
      });
    }
    
    if (issues.recommendedFixes.length > 0) {
      console.log('\n🔧 Recommended Fixes:');
      issues.recommendedFixes.forEach(fix => {
        console.log(`  - ${fix}`);
      });
    }

    // Performance analysis
    const performanceData = await tester.testNavigationPerformance();
    console.log(`\n📊 Performance Summary:`);
    console.log(`  - Average Load Time: ${performanceData.averageLoadTime.toFixed(0)}ms`);
    console.log(`  - Slow Routes (>2s): ${performanceData.slowRoutes.length}`);
    
    if (performanceData.slowRoutes.length > 0) {
      console.log('\n🐌 Slow Routes:');
      performanceData.slowRoutes.forEach(route => {
        console.log(`  - ${route.path}: ${route.loadTime}ms`);
      });
    }

    const passedRoutes = results.filter(r => r.status === 'pass');
    const failedRoutes = results.filter(r => r.status === 'fail');
    
    console.log(`\n📈 Final Summary:`);
    console.log(`  ✅ Passed: ${passedRoutes.length}/${results.length}`);
    console.log(`  ❌ Failed: ${failedRoutes.length}/${results.length}`);
    console.log(`  📊 Success Rate: ${((passedRoutes.length / results.length) * 100).toFixed(1)}%`);

    if (failedRoutes.length === 0) {
      console.log('\n🎉 All routes are working correctly!');
    } else {
      console.log(`\n⚠️  ${failedRoutes.length} routes need attention.`);
    }

  } catch (error) {
    console.error('❌ Error running route tests:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as testRoutes };