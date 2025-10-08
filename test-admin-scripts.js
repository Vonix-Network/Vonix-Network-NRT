#!/usr/bin/env node

// Test script for admin script functionality
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const USERNAME = process.argv[2] || 'admin';
const PASSWORD = process.argv[3] || 'password123';

async function testAdminScripts() {
  console.log('🧪 Testing Admin Script Functionality');
  console.log('=====================================');

  try {
    // Step 1: Login to get auth token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: USERNAME,
      password: PASSWORD
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Set up axios defaults with auth header
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Step 2: Test system status endpoint
    console.log('\n2. Testing system status endpoint...');
    const statusResponse = await api.get('/api/admin/scripts/status');
    console.log('✅ System status retrieved:');
    console.log(`   - Users: ${statusResponse.data.stats.users}`);
    console.log(`   - Forum Topics: ${statusResponse.data.stats.forumTopics}`);
    console.log(`   - Forum Posts: ${statusResponse.data.stats.forumPosts}`);
    console.log(`   - Database Size: ${statusResponse.data.database.sizeFormatted}`);

    // Step 3: Test user stats refresh (if confirmed)
    if (process.argv.includes('--run-scripts')) {
      console.log('\n3. Testing user stats refresh...');
      const refreshResponse = await api.post('/api/admin/scripts/refresh-user-stats');
      console.log('✅ User stats refresh completed:');
      console.log(`   - ${refreshResponse.data.message}`);
      console.log(`   - Updated: ${refreshResponse.data.details.updated} users`);

      console.log('\n4. Testing forum data cleanup...');
      const cleanupResponse = await api.post('/api/admin/scripts/cleanup-forum-data');
      console.log('✅ Forum data cleanup completed:');
      console.log(`   - ${cleanupResponse.data.message}`);

      console.log('\n5. Testing reputation recalculation...');
      const reputationResponse = await api.post('/api/admin/scripts/recalculate-reputation');
      console.log('✅ Reputation recalculation completed:');
      console.log(`   - ${reputationResponse.data.message}`);

      console.log('\n6. Testing database optimization...');
      const optimizeResponse = await api.post('/api/admin/scripts/optimize-database');
      console.log('✅ Database optimization completed:');
      console.log(`   - ${optimizeResponse.data.message}`);
    } else {
      console.log('\n3. Skipping script execution tests (use --run-scripts to run them)');
      console.log('   This is recommended to avoid modifying data during testing.');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nTo test the full functionality:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login to admin dashboard: http://localhost:3000/admin');
    console.log('3. Look for the new script execution buttons in Quick Actions');
    console.log('4. Try running "Refresh User Stats" to see it in action');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAdminScripts();
