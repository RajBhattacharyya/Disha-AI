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

async function testUserEndpoints() {
    try {
        console.log('=== Testing User Endpoints ===\n');

        // Step 1: Register a new user
        console.log('--- Step 1: Register New User ---');
        const registerData = {
            email: `usertest${Date.now()}@example.com`,
            password: 'Test123!@#',
            name: 'User Test',
            location: { latitude: 40.7128, longitude: -74.0060, address: 'New York, NY' },
            emergencyContacts: [],
            notificationPreferences: { push: true, sms: true, email: true }
        };

        const { result: registerResult } = await request('POST', '/auth/register', registerData);

        if (!registerResult.success) {
            console.error('Registration failed');
            return;
        }

        const token = registerResult.data.token;
        const userId = registerResult.data.user.id;
        console.log('User registered:', userId);

        // Step 2: Get user profile
        console.log('\n--- Step 2: Get User Profile ---');
        await request('GET', `/users/${userId}`, null, token);

        // Step 3: Update user profile
        console.log('\n--- Step 3: Update User Profile ---');
        await request('PATCH', `/users/${userId}`, {
            name: 'Updated User Name',
            phoneNumber: '+1234567890',
            preferredLanguage: 'es'
        }, token);

        // Step 4: Verify profile update
        console.log('\n--- Step 4: Verify Profile Update ---');
        await request('GET', `/users/${userId}`, null, token);

        // Step 5: Update user location
        console.log('\n--- Step 5: Update User Location ---');
        await request('PATCH', `/users/${userId}/location`, {
            location: {
                latitude: 34.0522,
                longitude: -118.2437,
                address: 'Los Angeles, CA'
            }
        }, token);

        // Step 6: Update notification preferences
        console.log('\n--- Step 6: Update Notification Preferences ---');
        await request('PATCH', `/users/${userId}/notifications`, {
            push: false,
            sms: true,
            email: false
        }, token);

        // Step 7: Verify notification update
        console.log('\n--- Step 7: Verify Notification Update ---');
        await request('GET', `/users/${userId}`, null, token);

        // Step 8: Add emergency contact
        console.log('\n--- Step 8: Add Emergency Contact ---');
        const { result: contact1Result } = await request('POST', `/users/${userId}/emergency-contacts`, {
            name: 'John Doe',
            phone: '+1234567890',
            relationship: 'Brother'
        }, token);

        // Step 9: Add another emergency contact
        console.log('\n--- Step 9: Add Second Emergency Contact ---');
        await request('POST', `/users/${userId}/emergency-contacts`, {
            name: 'Jane Smith',
            phone: '+0987654321',
            relationship: 'Sister'
        }, token);

        // Step 10: Verify contacts added
        console.log('\n--- Step 10: Verify Emergency Contacts ---');
        const { result: profileResult } = await request('GET', `/users/${userId}`, null, token);
        const contacts = profileResult.data?.user?.emergencyContacts || [];
        console.log('Total contacts:', contacts.length);

        // Step 11: Remove an emergency contact
        if (contacts.length > 0) {
            console.log('\n--- Step 11: Remove Emergency Contact ---');
            const contactId = contacts[0].id;
            await request('DELETE', `/users/${userId}/emergency-contacts/${contactId}`, null, token);
        }

        // Step 12: Verify contact removal
        console.log('\n--- Step 12: Verify Contact Removal ---');
        await request('GET', `/users/${userId}`, null, token);

        // Test error cases
        console.log('\n--- Step 13: Test Access Denied (Different User) ---');
        await request('GET', '/users/00000000-0000-0000-0000-000000000000', null, token);

        console.log('\n--- Step 14: Test Invalid UUID ---');
        await request('GET', '/users/invalid-uuid', null, token);

        console.log('\n--- Step 15: Test Invalid Phone Number ---');
        await request('PATCH', `/users/${userId}`, {
            phoneNumber: 'invalid-phone'
        }, token);

        console.log('\n--- Step 16: Test Invalid Location (Latitude out of range) ---');
        await request('PATCH', `/users/${userId}/location`, {
            location: {
                latitude: 100,
                longitude: -118.2437
            }
        }, token);

        console.log('\n--- Step 17: Test Invalid Notification Preference ---');
        await request('PATCH', `/users/${userId}/notifications`, {
            push: 'not-a-boolean'
        }, token);

        console.log('\n--- Step 18: Test Missing Required Fields (Emergency Contact) ---');
        await request('POST', `/users/${userId}/emergency-contacts`, {
            name: 'Test Contact'
            // Missing phone and relationship
        }, token);

        console.log('\n--- Step 19: Test Update Profile with Short Name ---');
        await request('PATCH', `/users/${userId}`, {
            name: 'A' // Too short (min 2 chars)
        }, token);

        console.log('\n=== All User Endpoint Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testUserEndpoints();
