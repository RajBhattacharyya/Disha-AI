import { alertService } from "../services/alertService"
import { geofencingService } from "../services/geofencingService"

async function testAlertSystem() {
  console.log("Testing alert service...")

  const testUserId = "test-user-id"

  // Test risk assessment
  const assessment = await alertService.assessUserRisk(testUserId)
  console.log("Risk Assessment:", assessment)

  // Test danger zones
  const testDisasterId = "test-disaster-id"
  const zones = await geofencingService.createDangerZones(testDisasterId)
  console.log(`Created ${zones.length} danger zones`)

  // Test user in danger zone
  const dangerCheck = await geofencingService.checkUserInDangerZone(testUserId)
  console.log("User in danger:", dangerCheck.inDanger)
  console.log("Matched zones:", dangerCheck.zones.length)
}

testAlertSystem().catch(console.error)
