#!/usr/bin/env node

/**
 * Health Check Script
 * Tests all critical services and endpoints
 * Usage: node scripts/health-check.js
 */

const http = require('http');
const https = require('https');
require('dotenv').config();

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 5000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const protocol = USE_HTTPS ? https : http;
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      timeout: 5000
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Check a service endpoint
 */
async function checkEndpoint(name, path, expectedStatus = 200) {
  try {
    const { statusCode, data } = await makeRequest(path);
    
    if (statusCode === expectedStatus) {
      console.log(`${colors.green}✓${colors.reset} ${name}: ${colors.green}OK${colors.reset}`);
      return { name, status: 'ok', details: data };
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} ${name}: ${colors.yellow}Unexpected status ${statusCode}${colors.reset}`);
      return { name, status: 'warning', statusCode, details: data };
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}: ${colors.red}${error.message}${colors.reset}`);
    return { name, status: 'error', error: error.message };
  }
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Vonix Network - Health Check${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`Target: ${USE_HTTPS ? 'https' : 'http'}://${HOST}:${PORT}\n`);

  const results = [];

  // 1. Check main health endpoint
  console.log('Checking core services...\n');
  results.push(await checkEndpoint('Main Health Check', '/api/health'));
  
  // 2. Check status endpoint
  results.push(await checkEndpoint('Status Endpoint', '/api/status'));
  
  // 3. Check API documentation
  console.log('\nChecking API documentation...\n');
  results.push(await checkEndpoint('Swagger UI', '/api-docs/', 301)); // Usually redirects
  
  // 4. Check public endpoints
  console.log('\nChecking public endpoints...\n');
  results.push(await checkEndpoint('Server List', '/api/servers'));
  results.push(await checkEndpoint('Blog Posts', '/api/blog/posts'));
  results.push(await checkEndpoint('Forum Categories', '/api/forum/categories'));
  
  // 5. Check WebSocket (just check if endpoint exists)
  console.log('\nChecking WebSocket...\n');
  console.log(`${colors.blue}ℹ${colors.reset} WebSocket: ws://${HOST}:${PORT}/ws/chat`);
  console.log(`  ${colors.yellow}Note: WebSocket requires manual testing${colors.reset}`);

  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}\n`);

  const ok = results.filter(r => r.status === 'ok').length;
  const warning = results.filter(r => r.status === 'warning').length;
  const error = results.filter(r => r.status === 'error').length;

  console.log(`${colors.green}✓ Passed:${colors.reset}  ${ok}`);
  console.log(`${colors.yellow}⚠ Warning:${colors.reset} ${warning}`);
  console.log(`${colors.red}✗ Failed:${colors.reset}  ${error}`);

  if (error > 0) {
    console.log(`\n${colors.red}Health check failed!${colors.reset}`);
    console.log('Please check the errors above and ensure the server is running.\n');
    process.exit(1);
  } else if (warning > 0) {
    console.log(`\n${colors.yellow}Health check passed with warnings.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}All health checks passed!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run checks
runHealthChecks().catch((error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset} ${error.message}\n`);
  process.exit(1);
});
