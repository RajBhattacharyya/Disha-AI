const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSOSRequests() {
    try {
        console.log('Checking SOS requests in database...\n');

        const sosRequests = await prisma.sOSRequest.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        console.log(`📊 Total SOS Requests: ${sosRequests.length}\n`);

        if (sosRequests.length > 0) {
            console.log('Recent SOS Requests:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            sosRequests.forEach((sos, index) => {
                console.log(`\n${index + 1}. ${sos.emergencyType} (${sos.severity})`);
                console.log(`   User: ${sos.user?.name || 'Unknown'} (${sos.user?.email})`);
                console.log(`   Status: ${sos.status}`);
                console.log(`   Location: ${sos.location?.address || 'N/A'}`);
                console.log(`   Created: ${sos.createdAt.toLocaleString()}`);
                console.log(`   ID: ${sos.id}`);
            });
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log('No SOS requests found in database.\n');
        }

        // Count by status
        const statusCounts = await prisma.sOSRequest.groupBy({
            by: ['status'],
            _count: true,
        });

        console.log('SOS Requests by Status:');
        statusCounts.forEach(s => {
            console.log(`  ${s.status}: ${s._count}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSOSRequests();
