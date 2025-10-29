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

async function testDeletion() {
  try {
    console.log('=== Testing Chat Session Deletion Fix ===\n');

    // Login
    console.log('--- Step 1: Login ---');
    const loginData = {
      email: 'test1761742304615@example.com',
      password: 'Test123!@#'
    };
    
    const loginResult = await request('POST', '/auth/login', loginData);
    const token = loginResult.result.data.token;

    // Create session
    console.log('\n--- Step 2: Create Session ---');
    const { result: createResult } = await request('POST', '/chat/sessions', 
      { title: 'Test Deletion' }, 
      token
    );
    const sessionId = createResult.data.session.id;

    // Send a message
    console.log('\n--- Step 3: Send Message ---');
    await request('POST', '/chat/message', 
      { sessionId, message: 'Test message' }, 
      token
    );

    // Delete session
    console.log('\n--- Step 4: Delete Session ---');
    await request('DELETE', `/chat/sessions/${sessionId}`, null, token);

    // Try to access deleted session (should be 404)
    console.log('\n--- Step 5: Try to Access Deleted Session (Should be 404) ---');
    const { response } = await request('GET', `/chat/sessions/${sessionId}`, null, token);
    console.log(response.status === 404 ? '✅ PASS: Returns 404' : '❌ FAIL: Should return 404');

    // Try to send message to deleted session (should be 404)
    console.log('\n--- Step 6: Try to Send Message to Deleted Session (Should be 404) ---');
    const { response: msgResponse } = await request('POST', '/chat/message', 
      { sessionId, message: 'Another test' }, 
      token
    );
    console.log(msgResponse.status === 404 ? '✅ PASS: Returns 404' : '❌ FAIL: Should return 404');

    console.log('\n=== Test Completed ===');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDeletion();
