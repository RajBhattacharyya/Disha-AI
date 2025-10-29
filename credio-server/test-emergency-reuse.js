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

async function testEmergencyEndpoints() {
    try {
        console.log('=== Testing Emergency Endpoints (Reusing Existing User) ===\n');

        // Step 1: Login with existing user from previous test
        console.log('--- Step 1: Login with Existing User ---');
        const { result: loginResult } = await request('POST', '/auth/login', {
            email: 'usertest1761744239181@example.com',
            password: 'Test123!@#'
        });

        if (!loginResult.success) {
            console.error('Login failed - user may not exist');
            console.log('Please run test-user.js first to create a test user');
            return;
        }

        const userToken = loginResult.data.token;
        const userId = loginResult.data.user.id;
        console.log('User logged in:', userId);

        // Step 2: Create SOS request
        console.log('\n--- Step 2: Create SOS Request ---');
        const { result: sosResult } = await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: '123 Emergency St, New York, NY'
            },
            emergencyType: 'MEDICAL',
            description: 'Person injured, needs immediate medical attention',
            severity: 'HIGH',
            mediaUrls: []
        }, userToken);

        if (!sosResult.success) {
            console.error('SOS creation failed');
            return;
        }

        const sosId = sosResult.data.sosId;
        console.log('SOS created:', sosId);

        // Step 3: Get SOS tracking info
        console.log('\n--- Step 3: Get SOS Tracking Info ---');
        await request('GET', `/emergency/sos/${sosId}`, null, userToken);

        // Step 4: Get user's SOS history
        console.log('\n--- Step 4: Get User SOS History ---');
        await request('GET', '/emergency/sos/history', null, userToken);

        // Step 5: Create another SOS with different type
        console.log('\n--- Step 5: Create Fire Emergency SOS ---');
        const { result: sos2Result } = await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7580,
                longitude: -73.9855,
                address: 'Times Square, New York, NY'
            },
            emergencyType: 'FIRE',
            description: 'Building fire on 5th floor',
            severity: 'CRITICAL',
            mediaUrls: ['https://example.com/fire-photo.jpg']
        }, userToken);

        const sos2Id = sos2Result.data?.sosId;

        // Step 6: Update SOS status (by user)
        console.log('\n--- Step 6: Update SOS Status ---');
        await request('PATCH', `/emergency/sos/${sosId}`, {
            status: 'RESOLVED',
            notes: 'Situation resolved'
        }, userToken);

        // Step 7: Cancel second SOS (by user)
        if (sos2Id) {
            console.log('\n--- Step 7: Cancel SOS (User) ---');
            await request('PATCH', `/emergency/sos/${sos2Id}/cancel`, null, userToken);
        }

        // Step 8: Get emergency resources
        console.log('\n--- Step 8: Get Emergency Resources (Nearby) ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&radius=10', null, userToken);

        // Step 9: Get resources with type filter
        console.log('\n--- Step 9: Get Resources (Hospitals Only) ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&type=HOSPITAL&limit=5', null, userToken);

        // Step 10: Get resources with availability filter
        console.log('\n--- Step 10: Get Available Resources ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&availability=AVAILABLE', null, userToken);

        // Test error cases
        console.log('\n--- Step 11: Test Invalid Emergency Type ---');
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'INVALID_TYPE',
            severity: 'HIGH'
        }, userToken);

        console.log('\n--- Step 12: Test Invalid Severity ---');
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'MEDICAL',
            severity: 'SUPER_HIGH'
        }, userToken);

        console.log('\n--- Step 13: Test Invalid Location (Latitude) ---');
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 100,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'MEDICAL',
            severity: 'HIGH'
        }, userToken);

        console.log('\n--- Step 14: Test Invalid SOS ID ---');
        await request('GET', '/emergency/sos/invalid-uuid', null, userToken);

        console.log('\n--- Step 15: Test Non-existent SOS ---');
        await request('GET', '/emergency/sos/00000000-0000-0000-0000-000000000000', null, userToken);

        console.log('\n--- Step 16: Test Invalid Resource Query (Latitude) ---');
        await request('GET', '/emergency/resources?latitude=invalid&longitude=-74.0060', null, userToken);

        console.log('\n=== All Emergency Endpoint Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testEmergencyEndpoints();
