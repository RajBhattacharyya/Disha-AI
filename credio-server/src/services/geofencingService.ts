import { prisma } from "../prismaClient"
import Redis from "ioredis"
import { logger } from "../utils/logger"
import { alertService } from "./alertService"
import { DangerZone, Location } from "../types/alert.types"

const redis = new Redis(process.env.REDIS_URL!)

export class GeofencingService {
    // Create danger zones for a disaster
    async createDangerZones(disasterId: string): Promise<DangerZone[]> {
        try {
            const disaster = await prisma.disasterEvent.findUnique({
                where: { id: disasterId },
            })

            if (!disaster) {
                throw new Error("Disaster not found")
            }

            const location = disaster.location as any
            const baseRadius = location.radius || 50

            // Create concentric zones based on severity
            const zones: DangerZone[] = [
                {
                    id: `${disasterId}-red`,
                    center: location,
                    radius: baseRadius * 0.3, // Inner 30%
                    severity: "RED",
                    disasterId,
                    label: "Immediate Danger - Evacuate Now",
                },
                {
                    id: `${disasterId}-orange`,
                    center: location,
                    radius: baseRadius * 0.6, // Middle 60%
                    severity: "ORANGE",
                    disasterId,
                    label: "High Risk - Prepare to Evacuate",
                },
                {
                    id: `${disasterId}-yellow`,
                    center: location,
                    radius: baseRadius, // Full radius
                    severity: "YELLOW",
                    disasterId,
                    label: "Elevated Risk - Stay Alert",
                },
            ]

            // Cache zones in Redis with 1 hour expiry
            await redis.set(
                `danger-zones:${disasterId}`,
                JSON.stringify(zones),
                "EX",
                3600
            )

            logger.info("Danger zones created", { disasterId, zones: zones.length })
            return zones
        } catch (error) {
            logger.error("Danger zone creation failed", { error, disasterId })
            return []
        }
    }

    // Get cached danger zones
    async getDangerZones(disasterId: string): Promise<DangerZone[]> {
        const cached = await redis.get(`danger-zones:${disasterId}`)

        if (cached) {
            return JSON.parse(cached)
        }

        // Regenerate if not cached
        return await this.createDangerZones(disasterId)
    }

    // Check if user is in any danger zone
    async checkUserInDangerZone(
        userId: string
    ): Promise<{ inDanger: boolean; zones: DangerZone[] }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { location: true },
            })

            if (!user?.location) {
                return { inDanger: false, zones: [] }
            }

            // Get all active disasters
            const activeDisasters = await prisma.disasterEvent.findMany({
                where: { status: "ACTIVE" },
            })

            const matchedZones: DangerZone[] = []

            for (const disaster of activeDisasters) {
                const zones = await this.getDangerZones(disaster.id)

                for (const zone of zones) {
                    const distance = alertService.calculateDistance(
                        user.location as unknown as Location,
                        zone.center
                    )

                    if (distance <= zone.radius) {
                        matchedZones.push(zone)
                    }
                }
            }

            // Sort by severity (RED > ORANGE > YELLOW)
            const sortedZones = matchedZones.sort((a, b) => {
                const severityOrder = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 }
                return severityOrder[b.severity] - severityOrder[a.severity]
            })

            return {
                inDanger: sortedZones.length > 0,
                zones: sortedZones,
            }
        } catch (error) {
            logger.error("Danger zone check failed", { error, userId })
            return { inDanger: false, zones: [] }
        }
    }

    // Monitor zone changes and trigger re-assessment
    async monitorZoneChanges(disasterId: string): Promise<void> {
        try {
            const disaster = await prisma.disasterEvent.findUnique({
                where: { id: disasterId },
            })

            if (!disaster || disaster.status !== "ACTIVE") {
                logger.info("Disaster not active, skipping zone monitoring", {
                    disasterId,
                })
                return
            }

            // Recalculate zones based on updated disaster data
            await this.createDangerZones(disasterId)

            // Trigger re-assessment for users in area
            const location = disaster.location as any
            await alertService.reassessUsersInArea(location, location.radius || 50)

            logger.info("Zone monitoring completed", { disasterId })
        } catch (error) {
            logger.error("Zone monitoring failed", { error, disasterId })
        }
    }

    // Get all active danger zones (for map visualization)
    async getAllActiveDangerZones(): Promise<DangerZone[]> {
        const activeDisasters = await prisma.disasterEvent.findMany({
            where: { status: "ACTIVE" },
        })

        const allZones: DangerZone[] = []

        for (const disaster of activeDisasters) {
            const zones = await this.getDangerZones(disaster.id)
            allZones.push(...zones)
        }

        return allZones
    }
}

export const geofencingService = new GeofencingService()
