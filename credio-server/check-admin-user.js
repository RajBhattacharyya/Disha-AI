const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUser() {
    try {
        console.log('Checking admin user in database...\n');

        const admin = await prisma.user.findUnique({
            where: { email: 'admin@credio.com' }
        });

        if (!admin) {
            console.log('❌ Admin user NOT found in database!');
            console.log('Please run: npm run seed');
            return;
        }

        console.log('✅ Admin user found!');
        console.log('ID:', admin.id);
        console.log('Email:', admin.email);
        console.log('Name:', admin.name);
        console.log('Role:', admin.role);
        console.log('Is Verified:', admin.isVerified);
        console.log('Phone:', admin.phoneNumber);

        // Test password
        const testPassword = 'Admin@123456';
        const isPasswordCorrect = await bcrypt.compare(testPassword, admin.password);

        console.log('\nPassword Test:');
        console.log('Test password:', testPassword);
        console.log('Password matches:', isPasswordCorrect ? '✅ YES' : '❌ NO');

        if (!isPasswordCorrect) {
            console.log('\n⚠️  Password does not match! The admin password may have been changed.');
            console.log('Please run: npm run seed');
        }

        if (admin.role !== 'ADMIN') {
            console.log('\n⚠️  User role is not ADMIN! Current role:', admin.role);
            console.log('Please run: npm run seed');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUser();
