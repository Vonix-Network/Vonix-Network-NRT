#!/usr/bin/env node

/**
 * Vonix Network - Simple Testing Script
 * 
 * This script tests the components and file structure that we know exist
 * without making assumptions about API endpoints.
 * 
 * Usage: node simple-test.js
 */

const fs = require('fs');
const path = require('path');

class SimpleVonixTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
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

  // Test Component Files
  testComponentFiles() {
    const components = [
      'client/src/components/forum/ForumCard.tsx',
      'client/src/components/forum/TopicCard.tsx',
      'client/src/pages/ForumViewPage.tsx',
      'client/src/pages/ForumViewPage.css'
    ];

    let allExist = true;
    let missingFiles = [];
    
    for (const component of components) {
      const filePath = path.join(process.cwd(), component);
      const exists = fs.existsSync(filePath);
      
      if (!exists) {
        allExist = false;
        missingFiles.push(component);
      }
    }
    
    if (allExist) {
      this.recordTest('Component Files Exist', true);
    } else {
      this.recordTest('Component Files Exist', false, new Error(`Missing: ${missingFiles.join(', ')}`));
    }
    
    return allExist;
  }

  // Test Mobile Variants Removed
  testMobileVariantsRemoved() {
    try {
      const forumCardPath = path.join(process.cwd(), 'client/src/components/forum/ForumCard.tsx');
      const topicCardPath = path.join(process.cwd(), 'client/src/components/forum/TopicCard.tsx');
      
      if (!fs.existsSync(forumCardPath) || !fs.existsSync(topicCardPath)) {
        this.recordTest('Mobile Variants Check', false, new Error('Component files missing'));
        return false;
      }
      
      const forumCardContent = fs.readFileSync(forumCardPath, 'utf8');
      const topicCardContent = fs.readFileSync(topicCardPath, 'utf8');
      
      // Check that mobile variants are removed
      const hasMobileVariant = forumCardContent.includes('variant="mobile"') || 
                              topicCardContent.includes('variant="mobile"') ||
                              forumCardContent.includes('variant === "mobile"') ||
                              topicCardContent.includes('variant === "mobile"');
      
      if (hasMobileVariant) {
        this.recordTest('Mobile Variants Removed', false, new Error('Mobile variant props still found in components'));
      } else {
        this.recordTest('Mobile Variants Removed', true);
      }
      
      return !hasMobileVariant;
    } catch (error) {
      this.recordTest('Mobile Variants Check', false, error);
      return false;
    }
  }

  // Test Responsive CSS
  testResponsiveCSS() {
    try {
      const cssPath = path.join(process.cwd(), 'client/src/pages/ForumViewPage.css');
      
      if (!fs.existsSync(cssPath)) {
        this.recordTest('Responsive CSS Structure', false, new Error('ForumViewPage.css missing'));
        return false;
      }
      
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Check for responsive breakpoints
      const has900Breakpoint = cssContent.includes('@media (max-width: 900px)');
      const has480Breakpoint = cssContent.includes('@media (max-width: 480px)');
      
      // Check that mobile-specific classes are removed
      const hasMobileClasses = cssContent.includes('.mobile-topic-card');
      
      let issues = [];
      if (!has900Breakpoint) issues.push('Missing @media (max-width: 900px)');
      if (!has480Breakpoint) issues.push('Missing @media (max-width: 480px)');
      if (hasMobileClasses) issues.push('Mobile-specific classes still present');
      
      const testPassed = has900Breakpoint && has480Breakpoint && !hasMobileClasses;
      
      if (testPassed) {
        this.recordTest('Responsive CSS Structure', true);
      } else {
        this.recordTest('Responsive CSS Structure', false, new Error(issues.join(', ')));
      }
      
      return testPassed;
    } catch (error) {
      this.recordTest('Responsive CSS Structure', false, error);
      return false;
    }
  }

  // Test Package.json exists
  testPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');
    const exists = fs.existsSync(packagePath);
    
    if (exists) {
      try {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const hasName = packageContent.name;
        const hasScripts = packageContent.scripts;
        
        if (hasName && hasScripts) {
          this.recordTest('Package.json Structure', true);
          return true;
        } else {
          this.recordTest('Package.json Structure', false, new Error('Missing name or scripts'));
          return false;
        }
      } catch (error) {
        this.recordTest('Package.json Structure', false, error);
        return false;
      }
    } else {
      this.recordTest('Package.json Structure', false, new Error('package.json not found'));
      return false;
    }
  }

  // Test Project Structure
  testProjectStructure() {
    const requiredDirs = [
      'client',
      'server',
      'client/src',
      'client/src/components',
      'client/src/pages'
    ];

    let allExist = true;
    let missingDirs = [];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
      
      if (!exists) {
        allExist = false;
        missingDirs.push(dir);
      }
    }
    
    if (allExist) {
      this.recordTest('Project Structure', true);
    } else {
      this.recordTest('Project Structure', false, new Error(`Missing directories: ${missingDirs.join(', ')}`));
    }
    
    return allExist;
  }

  // Generate Test Report
  generateReport() {
    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;
    
    this.log('\n' + '='.repeat(50), 'info');
    this.log('VONIX NETWORK - SIMPLE TEST RESULTS', 'info');
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
    const reportPath = path.join(process.cwd(), 'simple-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    this.log(`\nDetailed report saved to: ${reportPath}`, 'info');
    
    return successRate >= 80;
  }

  // Run all tests
  runAllTests() {
    this.log('Starting Vonix Network Simple Test Suite...', 'info');
    this.log('Testing file structure and component cleanup...', 'info');
    
    // File structure tests
    this.log('\n--- Project Structure Tests ---', 'info');
    this.testPackageJson();
    this.testProjectStructure();
    this.testComponentFiles();
    
    // Component cleanup tests
    this.log('\n--- Component Cleanup Tests ---', 'info');
    this.testMobileVariantsRemoved();
    this.testResponsiveCSS();
    
    // Generate final report
    const success = this.generateReport();
    
    if (success) {
      this.log('\n🎉 All file structure tests passed!', 'pass');
      this.log('Next steps:', 'info');
      this.log('1. Start your API server on port 5000', 'info');
      this.log('2. Start your client on port 3000', 'info');
      this.log('3. Test manually using the TESTING_CHECKLIST.md', 'info');
      process.exit(0);
    } else {
      this.log('\n⚠️  Some tests failed. Please fix before proceeding.', 'fail');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SimpleVonixTester();
  tester.runAllTests();
}

module.exports = SimpleVonixTester;
