const BASE_URL = 'http://localhost:3001/api';

async function request(method, endpoint, data = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    return { response, result };
}

async function testChatDebug() {
    try {
        console.log('=== Debug Test - Check Server Logs ===\n');

        // Login
        const loginData = {
            email: 'test1761742304615@example.com',
            password: 'Test123!@#'
        };

        let loginResult = await request('POST', '/auth/login', loginData);

        if (!loginResult.result.success) {
            console.error('Login failed');
            return;
        }

        const token = loginResult.result.data.token;
        console.log('✓ Logged in\n');

        // Create new session
        const { result: createResult } = await request('POST', '/chat/sessions',
            { title: 'Debug Test' },
            token
        );

        const sessionId = createResult.data.session.id;
        console.log('✓ Session created:', sessionId, '\n');

        // Send 3 very different messages
        const messages = [
            'What is an earthquake?',
            'How do I prepare for a hurricane?',
            'Where can I find emergency shelters?'
        ];

        console.log('Sending 3 different messages...\n');
        console.log('CHECK YOUR SERVER LOGS for:');
        console.log('- "Processing query" with different queries');
        console.log('- "Intent detected" with different intents');
        console.log('- "Generating response for query" with different queries');
        console.log('- "Response generated" with different response lengths\n');

        for (let i = 0; i < messages.length; i++) {
            console.log(`\n--- Message ${i + 1}: "${messages[i]}" ---`);

            const { result } = await request('POST', '/chat/message',
                { sessionId, message: messages[i] },
                token
            );

            if (result.success) {
                console.log('Response length:', result.data.response.length);
                console.log('Intent:', result.data.intent);
                console.log('First 100 chars:', result.data.response.substring(0, 100));

                // Wait a bit between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.log('ERROR:', result.error);
            }
        }

        console.log('\n\n=== Now check your server logs to see if queries are different ===');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testChatDebug();
