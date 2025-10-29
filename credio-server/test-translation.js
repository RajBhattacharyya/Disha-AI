const BASE_URL = 'http://localhost:3001/api';

async function request(method, endpoint, data = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    let result;
    const text = await response.text();
    try {
        result = JSON.parse(text);
    } catch (e) {
        result = { error: text };
    }

    console.log(`\n${method} ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    return { response, result };
}

async function testTranslationEndpoints() {
    try {
        console.log('=== Testing Translation Endpoints ===\n');

        // Step 1: Register a user
        console.log('--- Step 1: Register User ---');
        const userData = {
            email: `translation${Date.now()}@example.com`,
            password: 'Test123!@#',
            name: 'Translation Test User',
            location: { latitude: 40.7128, longitude: -74.0060, address: 'New York, NY' },
            emergencyContacts: [],
            notificationPreferences: { push: true, sms: true, email: true }
        };

        const { result: registerResult } = await request('POST', '/auth/register', userData);
        if (!registerResult.success) {
            console.error('Registration failed');
            return;
        }

        const token = registerResult.data.token;
        console.log('User registered');

        // Step 2: Translate English to Spanish
        console.log('\n--- Step 2: Translate English to Spanish ---');
        await request('POST', '/translate', {
            text: 'Hello, how are you?',
            targetLang: 'es'
        }, token);

        // Step 3: Translate with emergency context
        console.log('\n--- Step 3: Translate Emergency Message ---');
        await request('POST', '/translate', {
            text: 'I need help immediately. There is a fire.',
            targetLang: 'fr',
            context: 'emergency'
        }, token);

        // Step 4: Translate to multiple languages
        console.log('\n--- Step 4: Translate to German ---');
        await request('POST', '/translate', {
            text: 'Where is the nearest hospital?',
            targetLang: 'de'
        }, token);

        console.log('\n--- Step 5: Translate to Japanese ---');
        await request('POST', '/translate', {
            text: 'Please call emergency services.',
            targetLang: 'ja'
        }, token);

        console.log('\n--- Step 6: Translate to Chinese ---');
        await request('POST', '/translate', {
            text: 'I am lost and need directions.',
            targetLang: 'zh'
        }, token);

        // Step 7: Translate longer text
        console.log('\n--- Step 7: Translate Longer Text ---');
        await request('POST', '/translate', {
            text: 'During an earthquake, drop to your hands and knees, cover your head and neck, and hold on to something sturdy. Stay away from windows and heavy objects that could fall.',
            targetLang: 'es',
            context: 'safety instructions'
        }, token);

        // Step 8: Detect language
        console.log('\n--- Step 8: Detect Language (English) ---');
        await request('POST', '/translate/detect', {
            text: 'This is an English sentence.'
        }, token);

        console.log('\n--- Step 9: Detect Language (Spanish) ---');
        await request('POST', '/translate/detect', {
            text: 'Hola, ¿cómo estás?'
        }, token);

        console.log('\n--- Step 10: Detect Language (French) ---');
        await request('POST', '/translate/detect', {
            text: 'Bonjour, comment allez-vous?'
        }, token);

        console.log('\n--- Step 11: Detect Language (German) ---');
        await request('POST', '/translate/detect', {
            text: 'Guten Tag, wie geht es Ihnen?'
        }, token);

        console.log('\n--- Step 12: Detect Language (Japanese) ---');
        await request('POST', '/translate/detect', {
            text: 'こんにちは、お元気ですか？'
        }, token);

        // Step 13: Translate with medical context
        console.log('\n--- Step 13: Translate Medical Terms ---');
        await request('POST', '/translate', {
            text: 'I have chest pain and difficulty breathing.',
            targetLang: 'es',
            context: 'medical emergency'
        }, token);

        // Step 14: Translate disaster-related text
        console.log('\n--- Step 14: Translate Disaster Warning ---');
        await request('POST', '/translate', {
            text: 'Tsunami warning! Move to higher ground immediately!',
            targetLang: 'ja',
            context: 'disaster alert'
        }, token);

        // Test error cases
        console.log('\n--- Step 15: Test Empty Text ---');
        await request('POST', '/translate', {
            text: '',
            targetLang: 'es'
        }, token);

        console.log('\n--- Step 16: Test Missing Target Language ---');
        await request('POST', '/translate', {
            text: 'Hello world'
        }, token);

        console.log('\n--- Step 17: Test Invalid Target Language ---');
        await request('POST', '/translate', {
            text: 'Hello world',
            targetLang: 'invalid'
        }, token);

        console.log('\n--- Step 18: Test Text Too Long (>5000 chars) ---');
        const longText = 'a'.repeat(5001);
        await request('POST', '/translate', {
            text: longText,
            targetLang: 'es'
        }, token);

        console.log('\n--- Step 19: Test Detect Language with Empty Text ---');
        await request('POST', '/translate/detect', {
            text: ''
        }, token);

        console.log('\n--- Step 20: Test Detect Language with Text Too Long ---');
        const longDetectText = 'a'.repeat(1001);
        await request('POST', '/translate/detect', {
            text: longDetectText
        }, token);

        console.log('\n--- Step 21: Test Without Authentication ---');
        await request('POST', '/translate', {
            text: 'Hello',
            targetLang: 'es'
        }, null); // No token

        console.log('\n--- Step 22: Test Rate Limiting (Multiple Requests) ---');
        console.log('Sending 10 rapid requests to test rate limiter...');
        for (let i = 0; i < 10; i++) {
            await request('POST', '/translate', {
                text: `Test message ${i}`,
                targetLang: 'es'
            }, token);
        }

        console.log('\n--- Step 23: Translate Special Characters ---');
        await request('POST', '/translate', {
            text: 'Emergency! @#$%^&*() Call 911!!!',
            targetLang: 'es'
        }, token);

        console.log('\n--- Step 24: Translate Numbers and Dates ---');
        await request('POST', '/translate', {
            text: 'The meeting is on January 15, 2025 at 3:30 PM.',
            targetLang: 'fr'
        }, token);

        console.log('\n--- Step 25: Detect Mixed Language Text ---');
        await request('POST', '/translate/detect', {
            text: 'Hello, je suis here.'
        }, token);

        console.log('\n=== All Translation Endpoint Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testTranslationEndpoints();
