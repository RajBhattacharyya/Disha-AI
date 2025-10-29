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

async function testChatFix() {
    try {
        console.log('=== Testing Chat Fix - Different Responses ===\n');

        // Login
        console.log('--- Step 1: Login ---');
        const loginData = {
            email: 'test1761742304615@example.com',
            password: 'Test123!@#'
        };

        let loginResult = await request('POST', '/auth/login', loginData);

        if (!loginResult.result.success) {
            console.error('Login failed. Please use an existing user or update credentials.');
            return;
        }

        const token = loginResult.result.data.token;
        console.log('✓ Authenticated successfully');

        // Create new session
        console.log('\n--- Step 2: Create New Chat Session ---');
        const { result: createResult } = await request('POST', '/chat/sessions',
            { title: 'Test Different Responses' },
            token
        );

        if (!createResult.success) {
            console.error('Failed to create session');
            return;
        }

        const sessionId = createResult.data.session.id;
        console.log('✓ Session created:', sessionId);

        // Send first message
        console.log('\n--- Step 3: Send First Message ---');
        const { result: msg1 } = await request('POST', '/chat/message',
            {
                sessionId: sessionId,
                message: 'What should I do during an earthquake?'
            },
            token
        );

        if (msg1.success) {
            console.log('✓ Response 1 (first 150 chars):', msg1.data.response.substring(0, 150) + '...');
            console.log('✓ Intent:', msg1.data.intent);
        }

        // Send second different message
        console.log('\n--- Step 4: Send Second Different Message ---');
        const { result: msg2 } = await request('POST', '/chat/message',
            {
                sessionId: sessionId,
                message: 'How do I prepare for a hurricane?'
            },
            token
        );

        if (msg2.success) {
            console.log('✓ Response 2 (first 150 chars):', msg2.data.response.substring(0, 150) + '...');
            console.log('✓ Intent:', msg2.data.intent);
        }

        // Send third different message
        console.log('\n--- Step 5: Send Third Different Message ---');
        const { result: msg3 } = await request('POST', '/chat/message',
            {
                sessionId: sessionId,
                message: 'Where can I find emergency shelters?'
            },
            token
        );

        if (msg3.success) {
            console.log('✓ Response 3 (first 150 chars):', msg3.data.response.substring(0, 150) + '...');
            console.log('✓ Intent:', msg3.data.intent);
        }

        // Verify chat history has all messages
        console.log('\n--- Step 6: Verify Chat History ---');
        const { result: history } = await request('GET', `/chat/sessions/${sessionId}`, null, token);

        if (history.success) {
            console.log('✓ Total messages in history:', history.data.totalMessages);
            console.log('✓ Messages should be 6 (3 user + 3 assistant)');

            if (history.data.totalMessages === 6) {
                console.log('✅ SUCCESS: All messages saved correctly!');
            } else {
                console.log('❌ ISSUE: Expected 6 messages, got', history.data.totalMessages);
            }

            // Show last few messages
            const messages = history.data.messages;
            console.log('\n--- Last 3 Messages ---');
            messages.slice(-3).forEach((msg, idx) => {
                console.log(`${idx + 1}. ${msg.role}: ${msg.content.substring(0, 80)}...`);
            });
        }

        // Compare responses
        console.log('\n--- Step 7: Response Comparison ---');
        const responses = [msg1.data.response, msg2.data.response, msg3.data.response];
        const allSame = responses.every(r => r === responses[0]);

        if (allSame) {
            console.log('❌ ISSUE: All responses are identical!');
            console.log('This indicates the bug is still present.');
        } else {
            console.log('✅ SUCCESS: Responses are different!');
            console.log('The chat API is working correctly.');
        }

        console.log('\n=== Test Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testChatFix();
