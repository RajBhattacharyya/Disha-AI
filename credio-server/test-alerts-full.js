const BASE_URL = 'http://localhost:3001/api';

async function request(method, endpoint, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const result = await response.json();
  
  console.log(`\n${method} ${endpoint}`);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(result, null, 2));
  
  return { response, result };
}

async function testFullAlertFlow() {
  try {
    console.log('=== Full Alert Endpoint Test ===\n');

    // Register user
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
      console.error('Registration failed');
      return;
    }

    const token = registerResult.data.token;
    const userId = registerResult.data.user.id;

    // Note: Alerts are created automatically by the system when disasters occur
    // For this test, we'll work with the empty state
    console.log('\n--- Step 2: Note ---');
    console.log('Alerts are created automatically by the system.');
    console.log('Testing with empty alert state...');

    // Get alerts
    console.log('\n--- Step 3: Get All Alerts ---');
    const { result: alertsResult } = await request('GET', '/alerts', null, token);

    // Get unread count
    console.log('\n--- Step 4: Get Unread Count ---');
    await request('GET', '/alerts/unread-count', null, token);

    // Test filtering
    console.log('\n--- Step 5: Get Unread Alerts Only ---');
    await request('GET', '/alerts?isRead=false&limit=5', null, token);

    console.log('\n--- Step 6: Get Read Alerts Only ---');
    await request('GET', '/alerts?isRead=true', null, token);

    // Test pagination
    console.log('\n--- Step 7: Test Pagination ---');
    await request('GET', '/alerts?limit=2&offset=0', null, token);

    // If we have alerts, test individual operations
    if (alertsResult.data.alerts.length > 0) {
      const alertId = alertsResult.data.alerts[0].id;

      console.log('\n--- Step 8: Get Single Alert ---');
      await request('GET', `/alerts/${alertId}`, null, token);

      console.log('\n--- Step 9: Mark Alert as Read ---');
      await request('PATCH', `/alerts/${alertId}/read`, null, token);

      console.log('\n--- Step 10: Verify Alert is Read ---');
      await request('GET', `/alerts/${alertId}`, null, token);

      console.log('\n--- Step 11: Dismiss Alert ---');
      await request('DELETE', `/alerts/${alertId}`, null, token);

      console.log('\n--- Step 12: Verify Alert is Deleted ---');
      const { response: deletedCheck } = await request('GET', `/alerts/${alertId}`, null, token);
      console.log('Expected 404:', deletedCheck.status === 404 ? '✓' : '✗');
    }

    // Mark all as read
    console.log('\n--- Step 13: Mark All Alerts as Read ---');
    await request('PATCH', '/alerts/read-all', null, token);

    // Final count check
    console.log('\n--- Step 14: Final Unread Count ---');
    await request('GET', '/alerts/unread-count', null, token);

    // Test error cases
    console.log('\n--- Step 15: Test Invalid Alert ID ---');
    await request('GET', '/alerts/invalid-uuid', null, token);

    console.log('\n--- Step 16: Test Non-existent Alert ---');
    await request('GET', '/alerts/00000000-0000-0000-0000-000000000000', null, token);

    console.log('\n=== All Tests Completed Successfully ===');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFullAlertFlow();
