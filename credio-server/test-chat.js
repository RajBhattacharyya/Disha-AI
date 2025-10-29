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

async function testChatEndpoints() {
    try {
        console.log('=== Testing Chat Endpoints ===\n');

        // Step 1: Login with existing user or register new one
        console.log('--- Step 1: Login ---');
        const loginData = {
            email: 'test1761742304615@example.com',
            password: 'Test123!@#'
        };

        let loginResult = await request('POST', '/auth/login', loginData);

        // If login fails, register a new user
        if (!loginResult.result.success) {
            console.log('\n--- Step 1b: Register New User ---');
            const registerData = {
                email: `chattest${Date.now()}@example.com`,
                password: 'Test123!@#',
                name: 'Chat Test User',
                location: { lat: 40.7128, lng: -74.0060 },
                emergencyContacts: [],
                notificationPreferences: { push: true, sms: true, email: true }
            };

            loginResult = await request('POST', '/auth/register', registerData);
        }

        if (!loginResult.result.success) {
            console.error('Authentication failed');
            return;
        }

        const token = loginResult.result.data.token;
        console.log('Authenticated successfully');

        // Step 2: Get user's chat sessions (should be empty initially)
        console.log('\n--- Step 2: Get User Chat Sessions (Empty) ---');
        await request('GET', '/chat/sessions', null, token);

        // Step 3: Create a new chat session
        console.log('\n--- Step 3: Create New Chat Session ---');
        const { result: createResult } = await request('POST', '/chat/sessions',
            { title: 'Test Chat Session' },
            token
        );

        if (!createResult.success) {
            console.error('Failed to create session');
            return;
        }

        const sessionId = createResult.data.session.id;
        console.log('Session created:', sessionId);

        // Step 4: Send a message to the chat
        console.log('\n--- Step 4: Send Message to Chat ---');
        const { result: messageResult } = await request('POST', '/chat/message',
            {
                sessionId: sessionId,
                message: 'What should I do during an earthquake?'
            },
            token
        );

        if (messageResult.success) {
            console.log('AI Response preview:', messageResult.data.response.substring(0, 100) + '...');
            console.log('Intent detected:', messageResult.data.intent);
        }

        // Step 5: Get chat history
        console.log('\n--- Step 5: Get Chat History ---');
        await request('GET', `/chat/sessions/${sessionId}`, null, token);

        // Step 6: Send another message
        console.log('\n--- Step 6: Send Follow-up Message ---');
        await request('POST', '/chat/message',
            {
                sessionId: sessionId,
                message: 'What about aftershocks?'
            },
            token
        );

        // Step 7: Get updated chat history with limit
        console.log('\n--- Step 7: Get Chat History with Limit ---');
        await request('GET', `/chat/sessions/${sessionId}?limit=2`, null, token);

        // Step 8: Get all sessions (should show our session)
        console.log('\n--- Step 8: Get All User Sessions ---');
        await request('GET', '/chat/sessions', null, token);

        // Step 9: Update session title
        console.log('\n--- Step 9: Update Session Title ---');
        await request('PATCH', `/chat/sessions/${sessionId}`,
            { title: 'Earthquake Safety Chat' },
            token
        );

        // Step 10: Verify title update
        console.log('\n--- Step 10: Verify Title Update ---');
        await request('GET', `/chat/sessions/${sessionId}`, null, token);

        // Step 11: Create another session
        console.log('\n--- Step 11: Create Second Session ---');
        const { result: session2Result } = await request('POST', '/chat/sessions',
            { title: 'Flood Preparedness' },
            token
        );
        const session2Id = session2Result.data?.session?.id;

        // Step 12: Send message using 'new' sessionId
        console.log('\n--- Step 12: Send Message with "new" Session ID ---');
        const { result: newSessionResult } = await request('POST', '/chat/message',
            {
                sessionId: 'new',
                message: 'How do I prepare for a flood?'
            },
            token
        );

        if (newSessionResult.success) {
            console.log('New session created:', newSessionResult.data.sessionId);
        }

        // Step 13: Get all sessions (should show multiple)
        console.log('\n--- Step 13: Get All Sessions ---');
        await request('GET', '/chat/sessions', null, token);

        // Step 14: Delete a session
        console.log('\n--- Step 14: Delete Session ---');
        await request('DELETE', `/chat/sessions/${sessionId}`, null, token);

        // Step 15: Verify deletion (should return 404 or show isActive=false)
        console.log('\n--- Step 15: Try to Access Deleted Session ---');
        await request('GET', `/chat/sessions/${sessionId}`, null, token);

        // Step 16: Get active sessions (deleted one should not appear)
        console.log('\n--- Step 16: Get Active Sessions Only ---');
        await request('GET', '/chat/sessions', null, token);

        // Test error cases
        console.log('\n--- Step 17: Test Invalid Session ID ---');
        await request('GET', '/chat/sessions/invalid-uuid', null, token);

        console.log('\n--- Step 18: Test Non-existent Session ---');
        await request('GET', '/chat/sessions/00000000-0000-0000-0000-000000000000', null, token);

        console.log('\n--- Step 19: Test Empty Message ---');
        await request('POST', '/chat/message',
            { sessionId: session2Id, message: '' },
            token
        );

        console.log('\n--- Step 20: Test Message Too Long ---');
        const longMessage = 'a'.repeat(2001);
        await request('POST', '/chat/message',
            { sessionId: session2Id, message: longMessage },
            token
        );

        console.log('\n=== All Chat Endpoint Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testChatEndpoints();
