const bcrypt = require('bcryptjs');

async function testAdminLogin() {
    console.log('Testing admin login credentials...\n');

    const testPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    console.log('Test password:', testPassword);
    console.log('Hashed password:', hashedPassword);

    // Test comparison
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Password match test:', isMatch);

    console.log('\n=== Admin Login Credentials ===');
    console.log('Email: admin@credio.com');
    console.log('Password: Admin@123456');
    console.log('Role: ADMIN');
    console.log('================================\n');

    // Test API call
    console.log('Testing login API...');
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@credio.com',
                password: 'Admin@123456'
            })
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (data.success && data.data.user) {
            console.log('\n✅ Login successful!');
            console.log('User role:', data.data.user.role);
            console.log('User email:', data.data.user.email);
            console.log('User name:', data.data.user.name);
        } else {
            console.log('\n❌ Login failed!');
        }
    } catch (error) {
        console.error('Error testing login:', error.message);
    }
}

testAdminLogin();
