/**
 * Simple route validation script for Node.js
 * Tests basic HTTP connectivity to all routes
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:7892';

const routes = [
  '/',
  '/dashboard',
  '/projects',
  '/quick-notes',
  '/search',
  '/settings',
  '/ai-hub',
  '/ai-writing',
  '/professional',
  '/productivity',
  '/workflows',
  '/test-dashboard',
  // Dynamic routes with test IDs
  '/projects/test-project-1',
  '/projects/test-project-1/edit',
  '/projects/test-project-1/notes/new',
  '/projects/test-project-1/notes/test-note-1',
  '/notes/test-note-1/edit'
];

async function testRoute(path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      resolve({
        path,
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 300
      });
    });
    
    req.on('error', (error) => {
      resolve({
        path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function validateAllRoutes() {
  console.log('🚀 Starting route validation...\n');
  
  const results = [];
  const startTime = Date.now();
  
  for (const route of routes) {
    console.log(`Testing ${route}...`);
    const result = await testRoute(route);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${route} - ${result.status}`);
    } else {
      console.log(`❌ ${route} - ${result.status} ${result.error || ''}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const totalTime = Date.now() - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Results Summary:');
  console.log(`Total routes tested: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Total time: ${totalTime}ms`);
  console.log(`📈 Success rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🔧 Failed routes:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.path}: ${result.status} ${result.error || ''}`);
    });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  validateAllRoutes().catch(console.error);
}

module.exports = { validateAllRoutes, testRoute };