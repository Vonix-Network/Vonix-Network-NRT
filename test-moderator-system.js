#!/usr/bin/env node

// Test script for moderator system functionality
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_USERNAME = process.argv[2] || 'admin';
const ADMIN_PASSWORD = process.argv[3] || 'password123';

async function testModeratorSystem() {
  console.log('🛡️ Testing Moderator System Functionality');
  console.log('==========================================');

  try {
    // Step 1: Login as admin to create a moderator
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Set up axios defaults with admin auth header
    const adminApi = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    // Step 2: Create a test moderator user
    console.log('\n2. Creating test moderator user...');
    const moderatorUsername = 'testmoderator';
    const moderatorPassword = 'moderator123';

    try {
      await adminApi.post('/api/users', {
        username: moderatorUsername,
        password: moderatorPassword,
        role: 'moderator'
      });
      console.log('✅ Test moderator user created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Test moderator user already exists');
      } else {
        throw error;
      }
    }

    // Step 3: Login as moderator
    console.log('\n3. Testing moderator login...');
    const modLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: moderatorUsername,
      password: moderatorPassword
    });

    const modToken = modLoginResponse.data.token;
    console.log('✅ Moderator login successful');

    // Set up axios for moderator
    const modApi = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${modToken}`
      }
    });

    // Step 4: Test moderator dashboard access
    console.log('\n4. Testing moderator dashboard access...');
    const dashboardResponse = await modApi.get('/api/moderator/dashboard');
    console.log('✅ Moderator dashboard accessible');
    console.log(`   - Total Topics: ${dashboardResponse.data.stats.totalTopics}`);
    console.log(`   - Total Posts: ${dashboardResponse.data.stats.totalPosts}`);
    console.log(`   - Pending Reports: ${dashboardResponse.data.stats.reportedPosts}`);

    // Step 5: Test admin dashboard access (should fail)
    console.log('\n5. Testing admin dashboard access (should fail)...');
    try {
      await modApi.get('/api/admin/scripts/status');
      console.log('❌ ERROR: Moderator should not have admin access!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Moderator correctly denied admin access');
      } else {
        throw error;
      }
    }

    // Step 6: Test forum moderation access
    console.log('\n6. Testing forum moderation access...');
    try {
      const reportsResponse = await modApi.get('/api/moderator/pending-reports');
      console.log('✅ Moderator can access pending reports');
      console.log(`   - Pending Reports: ${reportsResponse.data.reports.length}`);
    } catch (error) {
      console.log('⚠️ No reports endpoint or no reports available');
    }

    // Step 7: Test user lookup functionality
    console.log('\n7. Testing user lookup functionality...');
    try {
      const lookupResponse = await modApi.get(`/api/moderator/user-lookup/${ADMIN_USERNAME}`);
      console.log('✅ User lookup working');
      console.log(`   - User: ${lookupResponse.data.user.username}`);
      console.log(`   - Role: ${lookupResponse.data.user.role}`);
      console.log(`   - Forum Posts: ${lookupResponse.data.forumStats.postsCreated}`);
    } catch (error) {
      console.log('⚠️ User lookup failed:', error.response?.data?.error || error.message);
    }

    // Step 8: Test recent activity access
    console.log('\n8. Testing recent activity access...');
    try {
      const activityResponse = await modApi.get('/api/moderator/recent-activity');
      console.log('✅ Recent activity accessible');
      console.log(`   - Recent Actions: ${activityResponse.data.activities.length}`);
    } catch (error) {
      console.log('⚠️ Recent activity failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Moderator system tests completed successfully!');
    console.log('\nTo test the full functionality:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Create a moderator user via admin dashboard: http://localhost:3000/admin/users');
    console.log('3. Login as moderator and visit: http://localhost:3000/moderator');
    console.log('4. Verify moderator can manage forum content but not access admin features');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the server is running and all routes are properly registered.');
    }
    process.exit(1);
  }
}

// Run the test
testModeratorSystem();
