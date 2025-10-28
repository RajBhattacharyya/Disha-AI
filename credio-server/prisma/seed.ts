import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create a disaster event
  const disaster = await prisma.disasterEvent.create({
    data: {
      type: 'FLOOD',
      severity: 'CRITICAL',
      location: { latitude: 12.34, longitude: 56.78, radius: 10, affectedAreas: ["District 1", "District 2"] },
      title: 'Major Flood in Valley',
      description: 'Severe flooding affecting key regions.',
      status: 'ACTIVE',
      dataSource: 'GOV_WEATHER_API',
      predictedImpact: { houses: 100, roads: 5 },
      affectedPopulation: 5000,
      startTime: new Date(),
      metadata: { rainfall: 120, riskLevel: 'HIGH' }
    }
  })

  // Create an emergency resource
  const resource = await prisma.emergencyResource.create({
    data: {
      type: 'SHELTER',
      name: 'Central Emergency Shelter',
      description: 'Main shelter in the affected area.',
      location: { latitude: 12.345, longitude: 56.789, address: "123 Main St" },
      contactPhone: '123-456-7890',
      contactEmail: 'shelter@example.com',
      availability: 'AVAILABLE',
      capacity: 500,
      isVerified: true,
      operatingHours: { open: "06:00", close: "22:00" }
    }
  })

  console.log('Seeded:', { disaster, resource })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
