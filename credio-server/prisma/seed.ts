import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create dummy users first (needed for SOS requests)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'user1@example.com' },
      update: {},
      create: {
        email: 'user1@example.com',
        phoneNumber: '+1234567890',
        name: 'John Doe',
        password: '$2b$10$dummyhashedpassword1',
        preferredLanguage: 'en',
        location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
        emergencyContacts: [{ name: 'Jane Doe', phone: '+1234567891' }],
        notificationPreferences: { push: true, sms: true, email: true },
      },
    }),
    prisma.user.upsert({
      where: { email: 'user2@example.com' },
      update: {},
      create: {
        email: 'user2@example.com',
        phoneNumber: '+1234567892',
        name: 'Alice Smith',
        password: '$2b$10$dummyhashedpassword2',
        preferredLanguage: 'en',
        location: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
        emergencyContacts: [{ name: 'Bob Smith', phone: '+1234567893' }],
        notificationPreferences: { push: true, sms: false, email: true },
      },
    }),
  ]);

  console.log('Created users:', users.length);

  // Create disaster events
  const disasters = await Promise.all([
    prisma.disasterEvent.create({
      data: {
        type: 'FLOOD',
        severity: 'HIGH',
        location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY', radius: 50 },
        title: 'Major Flooding in New York City',
        description: 'Heavy rainfall has caused severe flooding in lower Manhattan and surrounding areas. Water levels are rising rapidly.',
        status: 'ACTIVE',
        dataSource: 'NOAA Weather Service',
        predictedImpact: {
          affectedAreas: ['Manhattan', 'Brooklyn', 'Queens'],
          estimatedDuration: '48 hours',
          riskLevel: 'HIGH'
        },
        affectedPopulation: 500000,
        startTime: new Date('2025-10-28T08:00:00Z'),
        metadata: { tags: ['flood', 'rainfall', 'urban'], verified: true },
      },
    }),
    prisma.disasterEvent.create({
      data: {
        type: 'EARTHQUAKE',
        severity: 'CRITICAL',
        location: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA', radius: 100 },
        title: 'Major Earthquake Strikes Los Angeles',
        description: 'A magnitude 7.2 earthquake has struck the Los Angeles area. Multiple aftershocks expected.',
        status: 'ACTIVE',
        dataSource: 'USGS Earthquake Hazards Program',
        predictedImpact: {
          magnitude: 7.2,
          depth: '10 km',
          aftershocksExpected: true,
          structuralDamage: 'SEVERE'
        },
        affectedPopulation: 2000000,
        startTime: new Date('2025-10-29T06:30:00Z'),
        metadata: { tags: ['earthquake', 'seismic', 'structural'], verified: true },
      },
    }),
    prisma.disasterEvent.create({
      data: {
        type: 'WILDFIRE',
        severity: 'HIGH',
        location: { lat: 37.7749, lng: -122.4194, address: 'San Francisco Bay Area, CA', radius: 75 },
        title: 'Wildfire Spreading in Bay Area',
        description: 'Fast-moving wildfire threatening residential areas. Evacuation orders in effect.',
        status: 'ACTIVE',
        dataSource: 'CAL FIRE',
        predictedImpact: {
          acres: 15000,
          containment: '20%',
          windSpeed: '35 mph',
          evacuationZones: ['Zone A', 'Zone B', 'Zone C']
        },
        affectedPopulation: 150000,
        startTime: new Date('2025-10-27T14:00:00Z'),
        metadata: { tags: ['wildfire', 'evacuation', 'air-quality'], verified: true },
      },
    }),
    prisma.disasterEvent.create({
      data: {
        type: 'CYCLONE',
        severity: 'MEDIUM',
        location: { lat: 25.7617, lng: -80.1918, address: 'Miami, FL', radius: 200 },
        title: 'Tropical Cyclone Approaching Florida Coast',
        description: 'Category 2 cyclone expected to make landfall within 24 hours. Residents advised to prepare.',
        status: 'MONITORING',
        dataSource: 'National Hurricane Center',
        predictedImpact: {
          category: 2,
          windSpeed: '110 mph',
          stormSurge: '6-8 feet',
          landfall: '24 hours'
        },
        affectedPopulation: 800000,
        startTime: new Date('2025-10-30T00:00:00Z'),
        metadata: { tags: ['cyclone', 'hurricane', 'coastal'], verified: true },
      },
    }),
    prisma.disasterEvent.create({
      data: {
        type: 'LANDSLIDE',
        severity: 'MEDIUM',
        location: { lat: 47.6062, lng: -122.3321, address: 'Seattle, WA', radius: 20 },
        title: 'Landslide Risk in Seattle Hills',
        description: 'Heavy rains have saturated hillsides, creating landslide conditions in several neighborhoods.',
        status: 'RESOLVED',
        dataSource: 'Seattle Emergency Management',
        predictedImpact: {
          affectedNeighborhoods: ['Queen Anne', 'Magnolia'],
          soilSaturation: '95%',
          riskLevel: 'MODERATE'
        },
        affectedPopulation: 50000,
        startTime: new Date('2025-10-20T10:00:00Z'),
        endTime: new Date('2025-10-25T18:00:00Z'),
        metadata: { tags: ['landslide', 'soil', 'hillside'], verified: true },
      },
    }),
  ]);

  console.log('Created disaster events:', disasters.length);

  // Create emergency resources
  const resources = await Promise.all([
    // Shelters
    prisma.emergencyResource.create({
      data: {
        type: 'SHELTER',
        name: 'Red Cross Emergency Shelter - Manhattan',
        description: 'Large capacity emergency shelter with food, water, and medical support',
        location: { lat: 40.7580, lng: -73.9855, address: '123 Main St, New York, NY 10001' },
        contactPhone: '+1-212-555-0100',
        contactEmail: 'shelter.manhattan@redcross.org',
        website: 'https://redcross.org/manhattan-shelter',
        availability: 'AVAILABLE',
        capacity: 500,
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    prisma.emergencyResource.create({
      data: {
        type: 'SHELTER',
        name: 'Community Center Emergency Shelter - LA',
        description: 'Temporary shelter for earthquake evacuees',
        location: { lat: 34.0522, lng: -118.2437, address: '456 Oak Ave, Los Angeles, CA 90001' },
        contactPhone: '+1-213-555-0200',
        contactEmail: 'shelter.la@community.org',
        availability: 'LIMITED',
        capacity: 200,
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    // Hospitals
    prisma.emergencyResource.create({
      data: {
        type: 'HOSPITAL',
        name: 'New York General Hospital',
        description: 'Full-service emergency hospital with trauma center',
        location: { lat: 40.7489, lng: -73.9680, address: '789 Hospital Rd, New York, NY 10016' },
        contactPhone: '+1-212-555-0300',
        contactEmail: 'emergency@nygh.org',
        website: 'https://nygh.org',
        availability: 'AVAILABLE',
        capacity: 150,
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    prisma.emergencyResource.create({
      data: {
        type: 'HOSPITAL',
        name: 'LA Medical Center',
        description: 'Emergency medical services and trauma care',
        location: { lat: 34.0689, lng: -118.2451, address: '321 Medical Plaza, Los Angeles, CA 90033' },
        contactPhone: '+1-213-555-0400',
        contactEmail: 'emergency@lamc.org',
        website: 'https://lamc.org',
        availability: 'AVAILABLE',
        capacity: 200,
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    // Rescue Teams
    prisma.emergencyResource.create({
      data: {
        type: 'RESCUE_TEAM',
        name: 'NYC Search and Rescue Unit',
        description: 'Professional search and rescue team for disaster response',
        location: { lat: 40.7128, lng: -74.0060, address: '555 Rescue St, New York, NY 10004' },
        contactPhone: '+1-212-555-0500',
        contactEmail: 'dispatch@nycrescue.org',
        availability: 'AVAILABLE',
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    prisma.emergencyResource.create({
      data: {
        type: 'RESCUE_TEAM',
        name: 'LA County Fire Department Rescue',
        description: 'Fire department rescue and emergency response',
        location: { lat: 34.0522, lng: -118.2437, address: '777 Fire Station Rd, Los Angeles, CA 90012' },
        contactPhone: '+1-213-555-0600',
        contactEmail: 'rescue@lafd.org',
        website: 'https://lafd.org',
        availability: 'AVAILABLE',
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    // Food and Water
    prisma.emergencyResource.create({
      data: {
        type: 'FOOD',
        name: 'Emergency Food Distribution Center',
        description: 'Free food and water distribution for disaster victims',
        location: { lat: 40.7282, lng: -73.9942, address: '888 Relief Ave, Brooklyn, NY 11201' },
        contactPhone: '+1-718-555-0700',
        contactEmail: 'food@reliefcenter.org',
        availability: 'AVAILABLE',
        isVerified: true,
        operatingHours: { monday: '8am-8pm', tuesday: '8am-8pm', wednesday: '8am-8pm', thursday: '8am-8pm', friday: '8am-8pm', saturday: '9am-6pm', sunday: '9am-6pm' },
      },
    }),
    prisma.emergencyResource.create({
      data: {
        type: 'WATER',
        name: 'Clean Water Distribution Point',
        description: 'Potable water distribution for affected areas',
        location: { lat: 34.0407, lng: -118.2468, address: '999 Water St, Los Angeles, CA 90015' },
        contactPhone: '+1-213-555-0800',
        contactEmail: 'water@ladwp.org',
        availability: 'AVAILABLE',
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    // Medical
    prisma.emergencyResource.create({
      data: {
        type: 'MEDICAL',
        name: 'Mobile Medical Unit - Manhattan',
        description: 'Mobile medical clinic providing emergency healthcare',
        location: { lat: 40.7589, lng: -73.9851, address: 'Times Square, New York, NY 10036' },
        contactPhone: '+1-212-555-0900',
        contactEmail: 'mobile@nychealth.org',
        availability: 'AVAILABLE',
        capacity: 50,
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    // Police
    prisma.emergencyResource.create({
      data: {
        type: 'POLICE',
        name: 'NYPD Emergency Response',
        description: 'Police emergency services and disaster coordination',
        location: { lat: 40.7128, lng: -74.0060, address: '1 Police Plaza, New York, NY 10038' },
        contactPhone: '911',
        contactEmail: 'emergency@nypd.org',
        website: 'https://nypd.org',
        availability: 'AVAILABLE',
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
    // Fire Station
    prisma.emergencyResource.create({
      data: {
        type: 'FIRE_STATION',
        name: 'FDNY Station 1',
        description: 'Fire department emergency response and rescue',
        location: { lat: 40.7180, lng: -74.0027, address: '100 Duane St, New York, NY 10007' },
        contactPhone: '911',
        contactEmail: 'station1@fdny.org',
        website: 'https://fdny.org',
        availability: 'AVAILABLE',
        isVerified: true,
        operatingHours: { open24: true },
      },
    }),
  ]);

  console.log('Created emergency resources:', resources.length);

  // Create SOS requests
  const sosRequests = await Promise.all([
    prisma.sOSRequest.create({
      data: {
        userId: users[0].id,
        location: { lat: 40.7128, lng: -74.0060, address: 'Lower Manhattan, NY' },
        emergencyType: 'TRAPPED',
        status: 'PENDING',
        description: 'Trapped in flooded basement, water rising quickly. Need immediate rescue!',
        severity: 'CRITICAL',
        mediaUrls: [],
      },
    }),
    prisma.sOSRequest.create({
      data: {
        userId: users[1].id,
        location: { lat: 34.0522, lng: -118.2437, address: 'Downtown LA, CA' },
        emergencyType: 'INJURY',
        status: 'DISPATCHED',
        description: 'Injured during earthquake, broken leg, need medical assistance',
        severity: 'HIGH',
        mediaUrls: [],
      },
    }),
    prisma.sOSRequest.create({
      data: {
        userId: users[0].id,
        location: { lat: 40.7580, lng: -73.9855, address: 'Midtown Manhattan, NY' },
        emergencyType: 'MEDICAL',
        status: 'RESOLVED',
        description: 'Elderly person needs medication refill during evacuation',
        severity: 'MEDIUM',
        mediaUrls: [],
        resolvedAt: new Date('2025-10-28T15:30:00Z'),
      },
    }),
    prisma.sOSRequest.create({
      data: {
        userId: users[1].id,
        location: { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
        emergencyType: 'FIRE',
        status: 'IN_PROGRESS',
        description: 'Wildfire approaching home, need evacuation assistance',
        severity: 'HIGH',
        mediaUrls: [],
      },
    }),
    prisma.sOSRequest.create({
      data: {
        userId: users[0].id,
        location: { lat: 40.7489, lng: -73.9680, address: 'East Side Manhattan, NY' },
        emergencyType: 'NATURAL_DISASTER',
        status: 'PENDING',
        description: 'Building structural damage from flooding, unsafe to stay',
        severity: 'HIGH',
        mediaUrls: [],
      },
    }),
  ]);

  console.log('Created SOS requests:', sosRequests.length);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
