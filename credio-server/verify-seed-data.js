const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
    console.log('\n=== DATABASE SEED VERIFICATION ===\n');

    // Check disasters
    const disasters = await prisma.disasterEvent.findMany();
    console.log(`✓ Disaster Events: ${disasters.length}`);
    disasters.forEach(d => {
        console.log(`  - ${d.type}: ${d.title} (${d.severity}, ${d.status})`);
    });

    // Check emergency resources
    const resources = await prisma.emergencyResource.findMany();
    console.log(`\n✓ Emergency Resources: ${resources.length}`);
    const resourcesByType = resources.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
    }, {});
    Object.entries(resourcesByType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
    });

    // Check SOS requests
    const sosRequests = await prisma.sOSRequest.findMany();
    console.log(`\n✓ SOS Requests: ${sosRequests.length}`);
    const sosByStatus = sosRequests.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {});
    Object.entries(sosByStatus).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
    });

    console.log('\n=== VERIFICATION COMPLETE ===\n');
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
