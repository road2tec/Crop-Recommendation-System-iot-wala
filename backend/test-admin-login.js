/**
 * Admin Login Test Script
 * Test admin login via API call to identify frontend vs backend issues
 */

const axios = require('axios');

async function testAdminLogin() {
  console.log('🚀 Testing Admin Login API...\n');
  
  const baseURL = 'http://localhost:3001/api';
  const credentials = {
    email: 'admin@example.com',
    password: 'admin123'
  };
  
  try {
    console.log('📡 Making login request...');
    console.log('URL:', `${baseURL}/auth/login`);
    console.log('Credentials:', credentials);
    
    const response = await axios.post(`${baseURL}/auth/login`, credentials, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('\n✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Test admin endpoints
    if (response.data.token && response.data.user.role === 'admin') {
      console.log('\n🔐 Testing admin-only endpoint...');
      
      const adminResponse = await axios.get(`${baseURL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log('✅ Admin endpoint accessible!');
      console.log('Admin response status:', adminResponse.status);
      console.log('Number of users:', adminResponse.data.length || 0);
    }
    
  } catch (error) {
    console.log('\n❌ Login failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server is not running!');
      console.log('💡 Start the backend server with: npm run dev');
    } else if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Error message:', error.response.data?.error || error.response.data);
    } else if (error.code === 'ENOTFOUND') {
      console.log('🚨 Cannot resolve hostname!');
      console.log('💡 Check if backend server is running on correct port');
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Also test health endpoint
async function testServerHealth() {
  console.log('🏥 Testing server health...\n');
  
  try {
    const response = await axios.get('http://localhost:3001/api/health', {
      timeout: 5000
    });
    
    console.log('✅ Server is healthy!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running!');
      console.log('💡 Start the backend server first');
      return false;
    } else {
      console.log('❌ Health check failed:', error.message);
      return false;
    }
  }
  
  return true;
}

async function runTests() {
  console.log('🧪 Admin Login Diagnostic Tests\n');
  console.log('=====================================\n');
  
  // First check if server is running
  const serverHealthy = await testServerHealth();
  
  if (serverHealthy) {
    console.log('\n' + '='.repeat(40) + '\n');
    await testAdminLogin();
  }
  
  console.log('\n' + '='.repeat(40));
  console.log('🏁 Test completed');
}

runTests();