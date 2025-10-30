/// <reference types="node" />
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 10)

  // Delete existing user with same phone if exists
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'admin@credio.com' },
        { phoneNumber: '+1234567890' }
      ]
    }
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@credio.com',
      name: 'Credio Admin',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      phoneNumber: '+1234567890',
      preferredLanguage: 'en',
      location: {},
      emergencyContacts: [],
      notificationPreferences: {
        push: true,
        sms: true,
        email: true,
      },
    },
  })

  console.log('✅ Admin user created:', {
    email: admin.email,
    role: admin.role,
  })

  // Create a test responder
  const responderPassword = await bcrypt.hash('Responder@123', 10)

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'responder@credio.com' },
        { phoneNumber: '+1234567891' }
      ]
    }
  })

  const responder = await prisma.user.create({
    data: {
      email: 'responder@credio.com',
      name: 'Test Responder',
      password: responderPassword,
      role: 'RESPONDER',
      isVerified: true,
      phoneNumber: '+1234567891',
      preferredLanguage: 'en',
      location: {},
      emergencyContacts: [],
      notificationPreferences: {
        push: true,
        sms: true,
        email: true,
      },
    },
  })

  console.log('✅ Responder user created:', {
    email: responder.email,
    role: responder.role,
  })

  // Create a test regular user
  const userPassword = await bcrypt.hash('User@123456', 10)

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'user@credio.com' },
        { phoneNumber: '+1234567892' }
      ]
    }
  })

  const user = await prisma.user.create({
    data: {
      email: 'user@credio.com',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
      isVerified: true,
      phoneNumber: '+1234567892',
      preferredLanguage: 'en',
      location: {},
      emergencyContacts: [],
      notificationPreferences: {
        push: true,
        sms: true,
        email: true,
      },
    },
  })

  console.log('✅ Regular user created:', {
    email: user.email,
    role: user.role,
  })

  console.log('\n📋 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('ADMIN:')
  console.log('  Email: admin@credio.com')
  console.log('  Password: Admin@123456')
  console.log('\nRESPONDER:')
  console.log('  Email: responder@credio.com')
  console.log('  Password: Responder@123')
  console.log('\nUSER:')
  console.log('  Email: user@credio.com')
  console.log('  Password: User@123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
