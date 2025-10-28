export function generateTestDisasterData(type = "FLOOD") {
  return {
    type,
    severity: "HIGH",
    location: { latitude: 12.34, longitude: 56.78, radius: 7 },
    title: "Test Disaster",
    description: "Simulated disaster event",
    status: "ACTIVE",
    dataSource: "SIMULATION",
    predictedImpact: { houses: 10 },
    affectedPopulation: 100,
    startTime: new Date(),
    metadata: {},
  }
}
