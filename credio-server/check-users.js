const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
    });
    console.log('Users:', JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

checkUsers();
