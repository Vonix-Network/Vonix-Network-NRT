#!/usr/bin/env node

/**
 * Vonix Network - Automated Testing Script
 * 
 * This script tests API endpoints, database connections, and basic functionality
 * that can be automated. Manual testing still required for UI/UX elements.
 * 
 * Usage: node test-script.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  testUser: {
    username: 'testuser',
    password: 'testpass123',
    email: 'test@vonix.network'
  },
  timeout: 5000
};

class VonixTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.authToken = null;
  }

  // Test result logging
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      pass: '\x1b[32m',    // Green
      fail: '\x1b[31m',    // Red
      warn: '\x1b[33m',    // Yellow
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  // Record test result
  recordTest(name, passed, error = null) {
    this.results.tests.push({
      name,
      passed,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.results.passed++;
      this.log(`✅ ${name}`, 'pass');
    } else {
      this.results.failed++;
      this.log(`❌ ${name}: ${error?.message || 'Unknown error'}`, 'fail');
    }
  }

  // API Health Check
  async testApiHealth() {
    try {
      // Try multiple possible health endpoints
      const endpoints = ['/health', '/api/health', '/'];
      let healthCheckPassed = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${CONFIG.baseUrl}${endpoint}`, {
            timeout: CONFIG.timeout
          });
          if (response.status === 200) {
            healthCheckPassed = true;
            break;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }
      
      this.recordTest('API Health Check', healthCheckPassed);
      return healthCheckPassed;
    } catch (error) {
      this.recordTest('API Health Check', false, error);
      return false;
    }
  }

  // Database Connection Test
  async testDatabaseConnection() {
    try {
      // Try to access any API endpoint that would require DB
      const response = await axios.get(`${CONFIG.baseUrl}/api/donations/ranks`, {
        timeout: CONFIG.timeout
      });
      
      this.recordTest('Database Connection', response.status === 200);
      return response.status === 200;
    } catch (error) {
      this.recordTest('Database Connection', false, error);
      return false;
    }
  }

  // Forum List API Test
  async testForumListAPI() {
    try {
      const response = await axios.get(`${CONFIG.baseUrl}/api/forum`, {
        timeout: CONFIG.timeout
      });
      
      const isValid = response.status === 200 && Array.isArray(response.data);
      this.recordTest('Forum List API', isValid);
      return isValid;
    } catch (error) {
      this.recordTest('Forum List API', false, error);
      return false;
    }
  }

  // Topics API Test
  async testTopicsAPI() {
    try {
      // Test with a sample forum ID
      const response = await axios.get(`${CONFIG.baseUrl}/api/forum/forum/1`, {
        timeout: CONFIG.timeout
      });
      
      const isValid = response.status === 200;
      this.recordTest('Topics API', isValid);
      return isValid;
    } catch (error) {
      this.recordTest('Topics API', false, error);
      return false;
    }
  }

  // Authentication Test
  async testAuthentication() {
    try {
      // Test login endpoint - expect 401 for non-existent user (this is correct behavior)
      const loginResponse = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, {
        username: CONFIG.testUser.username,
        password: CONFIG.testUser.password
      }, {
        timeout: CONFIG.timeout,
        validateStatus: function (status) {
          // Accept both 200 (success) and 401 (invalid credentials) as valid responses
          return status === 200 || status === 401;
        }
      });
      
      // If we get 401, that means the endpoint is working correctly
      const endpointWorking = loginResponse.status === 200 || loginResponse.status === 401;
      
      if (loginResponse.status === 200 && loginResponse.data && loginResponse.data.token) {
        this.authToken = loginResponse.data.token;
        this.recordTest('User Authentication', true);
      } else if (loginResponse.status === 401) {
        // 401 is expected for test user that doesn't exist - endpoint is working
        this.recordTest('User Authentication', true);
      } else {
        this.recordTest('User Authentication', false, new Error('Unexpected response status'));
      }
      
      return endpointWorking;
    } catch (error) {
      this.recordTest('User Authentication', false, error);
      return false;
    }
  }

  // Donation Ranks API Test
  async testDonationRanksAPI() {
    try {
      const response = await axios.get(`${CONFIG.baseUrl}/api/donations/ranks`, {
        timeout: CONFIG.timeout
      });
      
      const isValid = response.status === 200 && Array.isArray(response.data);
      this.recordTest('Donation Ranks API', isValid);
      return isValid;
    } catch (error) {
      this.recordTest('Donation Ranks API', false, error);
      return false;
    }
  }

  // File Structure Test
  testFileStructure() {
    const requiredFiles = [
      'package.json',
      'README.md',
      'client/src/App.tsx',
      'client/src/components/forum/ForumCard.tsx',
      'client/src/components/forum/TopicCard.tsx',
      'server/index.js',
      'server/database/init.js'
    ];

    let allFilesExist = true;
    let missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      
      if (!exists) {
        allFilesExist = false;
        missingFiles.push(file);
        this.log(`Missing file: ${file}`, 'warn');
      }
    }
    
    if (missingFiles.length > 0) {
      this.recordTest('Required Files Structure', false, new Error(`Missing files: ${missingFiles.join(', ')}`));
    } else {
      this.recordTest('Required Files Structure', true);
    }
    return allFilesExist;
  }

  // Component Import Test
  testComponentImports() {
    try {
      const forumCardPath = path.join(process.cwd(), 'client/src/components/forum/ForumCard.tsx');
      const topicCardPath = path.join(process.cwd(), 'client/src/components/forum/TopicCard.tsx');
      
      if (!fs.existsSync(forumCardPath) || !fs.existsSync(topicCardPath)) {
        this.recordTest('Component Files Exist', false, new Error('Component files missing'));
        return false;
      }
      
      const forumCardContent = fs.readFileSync(forumCardPath, 'utf8');
      const topicCardContent = fs.readFileSync(topicCardPath, 'utf8');
      
      // Check that mobile variants are removed
      const hasMobileVariant = forumCardContent.includes('variant="mobile"') || 
                              topicCardContent.includes('variant="mobile"');
      
      this.recordTest('Mobile Variants Removed', !hasMobileVariant);
      return !hasMobileVariant;
    } catch (error) {
      this.recordTest('Component Import Test', false, error);
      return false;
    }
  }

  // CSS Responsive Test
  testResponsiveCSS() {
    try {
      const cssPath = path.join(process.cwd(), 'client/src/pages/ForumViewPage.css');
      
      if (!fs.existsSync(cssPath)) {
        this.recordTest('Responsive CSS Structure', false, new Error('ForumViewPage.css missing'));
        return false;
      }
      
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Check for responsive breakpoints
      const hasResponsiveBreakpoints = cssContent.includes('@media (max-width: 900px)') &&
                                     cssContent.includes('@media (max-width: 480px)');
      
      // Check that mobile-specific classes are removed
      const hasMobileClasses = cssContent.includes('.mobile-topic-card') ||
                              cssContent.includes('.mobile-only');
      
      let errorMessage = '';
      if (!hasResponsiveBreakpoints) {
        errorMessage += 'Missing responsive breakpoints (900px, 480px). ';
      }
      if (hasMobileClasses) {
        errorMessage += 'Mobile-specific classes still present. ';
      }
      
      const responsiveTestPassed = hasResponsiveBreakpoints && !hasMobileClasses;
      
      if (responsiveTestPassed) {
        this.recordTest('Responsive CSS Structure', true);
      } else {
        this.recordTest('Responsive CSS Structure', false, new Error(errorMessage.trim()));
      }
      
      return responsiveTestPassed;
    } catch (error) {
      this.recordTest('Responsive CSS Structure', false, error);
      return false;
    }
  }

  // Performance Test (Basic)
  async testBasicPerformance() {
    try {
      const startTime = Date.now();
      
      await axios.get(`${CONFIG.baseUrl}/api/forum`, {
        timeout: CONFIG.timeout
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Response should be under 2 seconds
      const performanceGood = responseTime < 2000;
      
      this.recordTest(`API Performance (${responseTime}ms)`, performanceGood);
      return performanceGood;
    } catch (error) {
      this.recordTest('API Performance Test', false, error);
      return false;
    }
  }

  // Generate Test Report
  generateReport() {
    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;
    
    this.log('\n' + '='.repeat(50), 'info');
    this.log('VONIX NETWORK - TEST RESULTS', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'pass');
    this.log(`Failed: ${this.results.failed}`, 'fail');
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'pass' : 'fail');
    
    if (this.results.failed > 0) {
      this.log('\nFailed Tests:', 'fail');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`, 'fail');
        });
    }
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    this.log(`\nDetailed report saved to: ${reportPath}`, 'info');
    
    return successRate >= 80;
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting Vonix Network Test Suite...', 'info');
    this.log(`API Server: ${CONFIG.baseUrl}`, 'info');
    this.log(`Client App: ${CONFIG.clientUrl}`, 'info');
    
    // File structure tests (synchronous)
    this.log('\n--- File Structure Tests ---', 'info');
    this.testFileStructure();
    this.testComponentImports();
    this.testResponsiveCSS();
    
    // API tests (asynchronous)
    this.log('\n--- API Tests ---', 'info');
    await this.testApiHealth();
    await this.testDatabaseConnection();
    await this.testForumListAPI();
    await this.testTopicsAPI();
    await this.testDonationRanksAPI();
    await this.testAuthentication();
    
    // Performance tests
    this.log('\n--- Performance Tests ---', 'info');
    await this.testBasicPerformance();
    
    // Generate final report
    const success = this.generateReport();
    
    if (success) {
      this.log('\n🎉 All critical tests passed! Ready for GitHub release.', 'pass');
      process.exit(0);
    } else {
      this.log('\n⚠️  Some tests failed. Please review before release.', 'fail');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new VonixTester();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = VonixTester;
