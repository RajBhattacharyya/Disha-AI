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
        console.log('=== Testing Translation Endpoints (Reusing Existing User) ===\n');

        // Step 1: Login with existing user
        console.log('--- Step 1: Login with Existing User ---');
        const { result: loginResult } = await request('POST', '/auth/login', {
            email: 'usertest1761744239181@example.com',
            password: 'Test123!@#'
        });

        if (!loginResult.success) {
            console.error('Login failed');
            return;
        }

        const token = loginResult.data.token;
        console.log('User logged in');

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

        // Step 4: Translate to German
        console.log('\n--- Step 4: Translate to German ---');
        await request('POST', '/translate', {
            text: 'Where is the nearest hospital?',
            targetLang: 'de'
        }, token);

        // Step 5: Translate longer text
        console.log('\n--- Step 5: Translate Longer Text ---');
        await request('POST', '/translate', {
            text: 'During an earthquake, drop to your hands and knees, cover your head and neck, and hold on to something sturdy.',
            targetLang: 'es',
            context: 'safety instructions'
        }, token);

        // Step 6: Detect language (English)
        console.log('\n--- Step 6: Detect Language (English) ---');
        await request('POST', '/translate/detect', {
            text: 'This is an English sentence.'
        }, token);

        // Step 7: Detect language (Spanish)
        console.log('\n--- Step 7: Detect Language (Spanish) ---');
        await request('POST', '/translate/detect', {
            text: 'Hola, ¿cómo estás?'
        }, token);

        // Step 8: Detect language (French)
        console.log('\n--- Step 8: Detect Language (French) ---');
        await request('POST', '/translate/detect', {
            text: 'Bonjour, comment allez-vous?'
        }, token);

        // Step 9: Translate with medical context
        console.log('\n--- Step 9: Translate Medical Terms ---');
        await request('POST', '/translate', {
            text: 'I have chest pain and difficulty breathing.',
            targetLang: 'es',
            context: 'medical emergency'
        }, token);

        // Test error cases
        console.log('\n--- Step 10: Test Empty Text ---');
        await request('POST', '/translate', {
            text: '',
            targetLang: 'es'
        }, token);

        console.log('\n--- Step 11: Test Missing Target Language ---');
        await request('POST', '/translate', {
            text: 'Hello world'
        }, token);

        console.log('\n--- Step 12: Test Text Too Long (>5000 chars) ---');
        const longText = 'a'.repeat(5001);
        await request('POST', '/translate', {
            text: longText,
            targetLang: 'es'
        }, token);

        console.log('\n--- Step 13: Test Detect Language with Empty Text ---');
        await request('POST', '/translate/detect', {
            text: ''
        }, token);

        console.log('\n--- Step 14: Test Without Authentication ---');
        await request('POST', '/translate', {
            text: 'Hello',
            targetLang: 'es'
        }, null);

        console.log('\n--- Step 15: Translate Special Characters ---');
        await request('POST', '/translate', {
            text: 'Emergency! Call 100!!!',
            targetLang: 'es'
        }, token);

        console.log('\n=== All Translation Endpoint Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testTranslationEndpoints();
