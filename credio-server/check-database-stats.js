const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStats() {
    try {
        console.log('Checking database statistics...\n');

        const totalUsers = await prisma.user.count();
        const activeDisasters = await prisma.disasterEvent.count({ where: { status: 'ACTIVE' } });
        const pendingSOS = await prisma.sOSRequest.count({ where: { status: 'PENDING' } });
        const alertsSent24h = await prisma.alert.count({
            where: {
                sentAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });
        const responders = await prisma.user.count({ where: { role: 'RESPONDER' } });

        console.log('📊 Database Statistics:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Total Users:', totalUsers);
        console.log('Active Disasters:', activeDisasters);
        console.log('Pending SOS:', pendingSOS);
        console.log('Alerts (24h):', alertsSent24h);
        console.log('Responders:', responders);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Show some sample data
        console.log('Sample Users:');
        const users = await prisma.user.findMany({ take: 5, select: { name: true, email: true, role: true } });
        users.forEach(u => console.log(`  - ${u.name} (${u.email}) - ${u.role}`));

        console.log('\nSample Disasters:');
        const disasters = await prisma.disasterEvent.findMany({ take: 5, select: { title: true, type: true, status: true } });
        if (disasters.length > 0) {
            disasters.forEach(d => console.log(`  - ${d.title} (${d.type}) - ${d.status}`));
        } else {
            console.log('  No disasters found');
        }

        console.log('\nSample SOS Requests:');
        const sos = await prisma.sOSRequest.findMany({ take: 5, select: { emergencyType: true, status: true, severity: true } });
        if (sos.length > 0) {
            sos.forEach(s => console.log(`  - ${s.emergencyType} (${s.severity}) - ${s.status}`));
        } else {
            console.log('  No SOS requests found');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseStats();
