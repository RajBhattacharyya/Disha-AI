const BASE_URL = 'http://localhost:3001/api';

// Helper function to make requests
async function request(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const result = await response.json();
  
  console.log(`\n${method} ${endpoint}`);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(result, null, 2));
  
  return { response, result };
}

async function testAlertEndpoints() {
  try {
    console.log('=== Testing Alert Endpoints ===\n');

    // Step 1: Register a test user
    console.log('--- Step 1: Register User ---');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'Test User',
      location: { lat: 40.7128, lng: -74.0060 },
      emergencyContacts: [{ name: 'Emergency Contact', phone: '+1234567890' }],
      notificationPreferences: { push: true, sms: true, email: true }
    };
    
    const { result: registerResult } = await request('POST', '/auth/register', registerData);
    
    if (!registerResult.success) {
      console.error('Registration failed:', registerResult);
      return;
    }

    const token = registerResult.data.token;
    const userId = registerResult.data.user.id;
    console.log('User registered successfully. Token:', token.substring(0, 20) + '...');

    // Step 2: Get alerts (should be empty initially)
    console.log('\n--- Step 2: Get Alerts (Empty) ---');
    await request('GET', '/alerts', null, token);

    // Step 3: Get unread count (should be 0)
    console.log('\n--- Step 3: Get Unread Count ---');
    await request('GET', '/alerts/unread-count', null, token);

    // Step 4: Create a disaster event and alert (using direct DB or admin endpoint)
    // For now, we'll test with query parameters
    console.log('\n--- Step 4: Get Alerts with Filters ---');
    await request('GET', '/alerts?isRead=false&limit=10&offset=0', null, token);

    // Step 5: Test with isRead=true filter
    console.log('\n--- Step 5: Get Read Alerts ---');
    await request('GET', '/alerts?isRead=true', null, token);

    // Step 6: Mark all as read (should work even with no alerts)
    console.log('\n--- Step 6: Mark All Alerts as Read ---');
    await request('PATCH', '/alerts/read-all', null, token);

    console.log('\n=== All Alert Endpoint Tests Completed ===');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run tests
testAlertEndpoints();
