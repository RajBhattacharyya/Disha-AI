const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAlertEndpoints() {
    try {
        // First login to get token
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'user@credio.com',
            password: 'User@123456'
        });

        const token = loginRes.data.data.token;
        console.log('✓ Login successful');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // Get alerts
        console.log('\n2. Getting alerts...');
        const alertsRes = await axios.get(`${BASE_URL}/api/alerts`, config);
        console.log('✓ Alerts:', alertsRes.data.data.alerts.length);

        if (alertsRes.data.data.alerts.length > 0) {
            const alertId = alertsRes.data.data.alerts[0].id;
            console.log('Alert ID:', alertId);

            // Mark as read
            console.log('\n3. Marking alert as read...');
            const readRes = await axios.patch(`${BASE_URL}/api/alerts/${alertId}/read`, {}, config);
            console.log('✓ Mark as read:', readRes.data.success);

            // Get alert by ID
            console.log('\n4. Getting alert by ID...');
            const alertRes = await axios.get(`${BASE_URL}/api/alerts/${alertId}`, config);
            console.log('✓ Alert retrieved:', alertRes.data.data.alert.id);

            // Dismiss alert
            console.log('\n5. Dismissing alert...');
            const dismissRes = await axios.delete(`${BASE_URL}/api/alerts/${alertId}`, config);
            console.log('✓ Alert dismissed:', dismissRes.data.success);
        } else {
            console.log('No alerts to test with');
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testAlertEndpoints();
