const fetch = require('node-fetch');

async function testAdminStatsAPI() {
    console.log('Testing admin stats API...\n');

    try {
        // First login to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@credio.com',
                password: 'Admin@123456'
            })
        });

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            console.error('❌ Login failed:', loginData);
            return;
        }

        console.log('✅ Login successful');
        console.log('Token:', loginData.data.token.substring(0, 20) + '...');
        console.log('User role:', loginData.data.user.role);

        // Now test the stats endpoint
        console.log('\n2. Fetching admin stats...');
        const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${loginData.data.token}`
            }
        });

        const statsData = await statsResponse.json();

        console.log('\nResponse status:', statsResponse.status);
        console.log('Response data:', JSON.stringify(statsData, null, 2));

        if (statsData.success) {
            console.log('\n✅ Stats API working!');
            console.log('Stats:', statsData.data);
        } else {
            console.log('\n❌ Stats API failed:', statsData);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminStatsAPI();
