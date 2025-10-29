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
        console.log('=== Testing Emergency Endpoints ===\n');

        // Step 1: Register a regular user
        console.log('--- Step 1: Register Regular User ---');
        const userData = {
            email: `emergency${Date.now()}@example.com`,
            password: 'Test123!@#',
            name: 'Emergency Test User',
            location: { latitude: 40.7128, longitude: -74.0060, address: 'New York, NY' },
            emergencyContacts: [],
            notificationPreferences: { push: true, sms: true, email: true }
        };

        const { result: userRegister } = await request('POST', '/auth/register', userData);
        if (!userRegister.success) {
            console.error('User registration failed');
            return;
        }

        const userToken = userRegister.data.token;
        const userId = userRegister.data.user.id;
        console.log('User registered:', userId);

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

        // Step 6: Register a responder
        console.log('\n--- Step 6: Register Responder ---');
        const responderData = {
            email: `responder${Date.now()}@example.com`,
            password: 'Test123!@#',
            name: 'Emergency Responder',
            role: 'RESPONDER',
            location: { latitude: 40.7128, longitude: -74.0060, address: 'New York, NY' },
            emergencyContacts: [],
            notificationPreferences: { push: true, sms: true, email: true }
        };

        const { result: responderRegister } = await request('POST', '/auth/register', responderData);
        const responderToken = responderRegister.data?.token;
        const responderId = responderRegister.data?.user?.id;
        console.log('Responder registered:', responderId);

        // Step 7: Assign responder to SOS
        console.log('\n--- Step 7: Assign Responder to SOS ---');
        await request('PATCH', `/emergency/sos/${sosId}/assign`, null, responderToken);

        // Step 8: Update SOS status (by responder)
        console.log('\n--- Step 8: Update SOS Status (Responder) ---');
        await request('PATCH', `/emergency/sos/${sosId}`, {
            status: 'IN_PROGRESS',
            notes: 'Arrived at scene, providing medical assistance'
        }, responderToken);

        // Step 9: Get updated SOS tracking
        console.log('\n--- Step 9: Get Updated SOS Tracking ---');
        await request('GET', `/emergency/sos/${sosId}`, null, userToken);

        // Step 10: Update SOS to resolved
        console.log('\n--- Step 10: Resolve SOS ---');
        await request('PATCH', `/emergency/sos/${sosId}`, {
            status: 'RESOLVED',
            notes: 'Patient stabilized and transported to hospital'
        }, responderToken);

        // Step 11: Cancel second SOS (by user)
        if (sos2Id) {
            console.log('\n--- Step 11: Cancel SOS (User) ---');
            await request('PATCH', `/emergency/sos/${sos2Id}/cancel`, null, userToken);
        }

        // Step 12: Get emergency resources
        console.log('\n--- Step 12: Get Emergency Resources (Nearby) ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&radius=10', null, userToken);

        // Step 13: Get resources with type filter
        console.log('\n--- Step 13: Get Resources (Hospitals Only) ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&type=HOSPITAL&limit=5', null, userToken);

        // Step 14: Get resources with availability filter
        console.log('\n--- Step 14: Get Available Resources ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&availability=AVAILABLE', null, userToken);

        // Test error cases
        console.log('\n--- Step 15: Test Invalid Emergency Type ---');
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'INVALID_TYPE',
            severity: 'HIGH'
        }, userToken);

        console.log('\n--- Step 16: Test Invalid Severity ---');
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'MEDICAL',
            severity: 'SUPER_HIGH'
        }, userToken);

        console.log('\n--- Step 17: Test Invalid Location (Latitude) ---');
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 100,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'MEDICAL',
            severity: 'HIGH'
        }, userToken);

        console.log('\n--- Step 18: Test Description Too Long ---');
        const longDescription = 'a'.repeat(501);
        await request('POST', '/emergency/sos', {
            location: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: 'Test Address'
            },
            emergencyType: 'MEDICAL',
            description: longDescription,
            severity: 'HIGH'
        }, userToken);

        console.log('\n--- Step 19: Test Access Denied (Different User SOS) ---');
        // Create another user
        const user2Data = {
            email: `user2${Date.now()}@example.com`,
            password: 'Test123!@#',
            name: 'User 2',
            location: { latitude: 40.7128, longitude: -74.0060, address: 'New York, NY' },
            emergencyContacts: [],
            notificationPreferences: { push: true, sms: true, email: true }
        };
        const { result: user2Register } = await request('POST', '/auth/register', user2Data);
        const user2Token = user2Register.data?.token;

        // Try to access first user's SOS
        await request('GET', `/emergency/sos/${sosId}`, null, user2Token);

        console.log('\n--- Step 20: Test Invalid SOS ID ---');
        await request('GET', '/emergency/sos/invalid-uuid', null, userToken);

        console.log('\n--- Step 21: Test Non-existent SOS ---');
        await request('GET', '/emergency/sos/00000000-0000-0000-0000-000000000000', null, userToken);

        console.log('\n--- Step 22: Test Invalid Status Update ---');
        await request('PATCH', `/emergency/sos/${sosId}`, {
            status: 'INVALID_STATUS'
        }, userToken);

        console.log('\n--- Step 23: Test Cancel Already Resolved SOS ---');
        await request('PATCH', `/emergency/sos/${sosId}/cancel`, null, userToken);

        console.log('\n--- Step 24: Test Invalid Resource Query (Latitude) ---');
        await request('GET', '/emergency/resources?latitude=invalid&longitude=-74.0060', null, userToken);

        console.log('\n--- Step 25: Test Resource Query with Invalid Type ---');
        await request('GET', '/emergency/resources?latitude=40.7128&longitude=-74.0060&type=INVALID_TYPE', null, userToken);

        console.log('\n=== All Emergency Endpoint Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testEmergencyEndpoints();
