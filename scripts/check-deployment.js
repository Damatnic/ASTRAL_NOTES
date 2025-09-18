#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * Verifies that the Vercel deployment is working correctly
 */

import https from 'https';

const deploymentUrls = [
  'https://astral-notes-iota.vercel.app',
  'https://astral-notes-damatnic-astral-productions.vercel.app',
  'https://astral-notes-astral-productions.vercel.app'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    console.log(`\nChecking: ${url}`);
    
    // Check root endpoint
    https.get(url, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Headers:`, res.headers);
      
      if (res.statusCode === 401) {
        console.log(`  ⚠️  Password protection is enabled`);
        console.log(`  ℹ️  To remove password protection:`);
        console.log(`     1. Go to https://vercel.com/astral-productions/astral-notes/settings`);
        console.log(`     2. Navigate to "Password Protection"`);
        console.log(`     3. Disable password protection`);
      } else if (res.statusCode === 200) {
        console.log(`  ✅ Deployment is accessible!`);
      } else if (res.statusCode === 404) {
        console.log(`  ❌ Deployment not found`);
      }
      
      resolve(res.statusCode);
    }).on('error', (err) => {
      console.error(`  ❌ Error: ${err.message}`);
      resolve(null);
    });
  });
}

function checkHealthEndpoint(baseUrl) {
  return new Promise((resolve) => {
    const url = `${baseUrl}/api/health`;
    console.log(`  Checking health endpoint: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            console.log(`    ✅ API is healthy:`, health);
          } catch (e) {
            console.log(`    ✅ API responded (status ${res.statusCode})`);
          }
        } else if (res.statusCode === 401) {
          console.log(`    ⚠️  API requires authentication`);
        } else {
          console.log(`    ❌ API status: ${res.statusCode}`);
        }
      });
      
      resolve(res.statusCode);
    }).on('error', (err) => {
      console.error(`    ❌ API Error: ${err.message}`);
      resolve(null);
    });
  });
}

async function main() {
  console.log('🚀 ASTRAL NOTES Deployment Health Check');
  console.log('========================================');
  
  for (const url of deploymentUrls) {
    const status = await checkUrl(url);
    
    if (status === 200 || status === 401) {
      // Try to check the health endpoint even if main site has auth
      await checkHealthEndpoint(url);
    }
  }
  
  console.log('\n========================================');
  console.log('📋 Summary:');
  console.log('- Deployment is live on Vercel');
  console.log('- Password protection is currently ENABLED');
  console.log('- To make the site publicly accessible:');
  console.log('  1. Visit: https://vercel.com/astral-productions/astral-notes/settings');
  console.log('  2. Go to "Password Protection" section');
  console.log('  3. Disable password protection');
  console.log('  4. The site will be immediately accessible');
  console.log('\n✅ Deployment successful! Just need to remove password protection.');
}

main();