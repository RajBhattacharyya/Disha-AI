import { prisma } from "../prismaClient"
import { logger } from "../utils/logger"
import { translationService } from "./translationService"
import { alertDeliveryService } from "./alertDeliveryService"
import { Severity, AlertType, DeliveryMethod } from "@prisma/client"
import {
    Location,
    RiskAssessment,
    GeoTarget,
} from "../types/alert.types"

export class AlertService {
    // Assess risk for individual user
    async assessUserRisk(userId: string): Promise<RiskAssessment> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { location: true },
            })

            if (!user?.location) {
                return { level: "UNKNOWN", disasters: [] }
            }

            // Find active disasters within 50km
            const nearbyDisasters = await this.findNearbyDisasters(
                user.location as unknown as Location,
                50
            )

            if (nearbyDisasters.length === 0) {
                return { level: "SAFE", disasters: [] }
            }

            // Calculate risk based on distance and severity
            let maxRisk = 0
            const threateningDisasters = []

            for (const disaster of nearbyDisasters) {
                const distance = this.calculateDistance(
                    user.location as unknown as Location,
                    disaster.location
                )
                const riskScore = this.calculateRiskScore(disaster, distance)

                if (riskScore > maxRisk) {
                    maxRisk = riskScore
                }

                if (riskScore > 30) {
                    // Threshold for alerting
                    threateningDisasters.push({ disaster, distance, riskScore })
                }
            }

            return {
                level: this.getRiskLevel(maxRisk),
                disasters: threateningDisasters,
                maxRiskScore: maxRisk,
            }
        } catch (error) {
            logger.error("Risk assessment failed", { error, userId })
            return { level: "UNKNOWN", disasters: [] }
        }
    }

    // Calculate risk score (0-100)
    private calculateRiskScore(disaster: any, distance: number): number {
        const severityScores: Record<Severity, number> = {
            LOW: 20,
            MEDIUM: 50,
            HIGH: 75,
            CRITICAL: 100,
        }

        const baseSeverity = severityScores[disaster.severity as Severity] || 0

        // Risk decreases with distance
        const effectiveRadius = disaster.location?.radius || 50
        const distanceFactor = Math.max(0, 1 - distance / effectiveRadius)

        return baseSeverity * distanceFactor
    }

    // Get risk level from score
    private getRiskLevel(
        score: number
    ): "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
        if (score >= 80) return "CRITICAL"
        if (score >= 60) return "HIGH"
        if (score >= 40) return "MEDIUM"
        if (score >= 20) return "LOW"
        return "SAFE"
    }

    // Create and send alert
    async createAlert(
        disasterId: string,
        targeting: GeoTarget
    ): Promise<any[]> {
        try {
            const disaster = await prisma.disasterEvent.findUnique({
                where: { id: disasterId },
            })

            if (!disaster) {
                throw new Error("Disaster not found")
            }

            // Find affected users
            const affectedUsers = await this.findUsersInRadius(
                disaster.location as unknown as Location,
                targeting.radius || (disaster.location as any).radius || 50
            )

            logger.info(`Creating alert for ${affectedUsers.length} users`, {
                disasterId,
            })

            // Generate alert message
            const message = await this.generateAlertMessage(disaster)

            // Translate to users' preferred languages
            const uniqueLangs = [
                ...new Set(affectedUsers.map((u) => u.preferredLanguage)),
            ]
            const translations: { [key: string]: string } = {}

            for (const lang of uniqueLangs) {
                if (lang !== "en") {
                    translations[lang] = await translationService.translateText(
                        message,
                        lang,
                        "Emergency disaster alert"
                    )
                } else {
                    translations[lang] = message
                }
            }

            // Create alert records
            const alerts = await Promise.all(
                affectedUsers.map((user) =>
                    prisma.alert.create({
                        data: {
                            disasterId,
                            userId: user.id,
                            alertType: this.determineAlertType(disaster),
                            message,
                            translatedMessages: translations,
                            deliveryMethod: this.getPrismaDeliveryMethod(disaster.severity),
                            deliveryStatus: "PENDING",
                            location: disaster.location as any,
                            isRead: false,
                        },
                    })
                )
            )

            // Queue for delivery
            await alertDeliveryService.queueAlertDelivery(alerts)

            logger.info("Alerts created and queued", { count: alerts.length })
            return alerts
        } catch (error) {
            logger.error("Alert creation failed", { error, disasterId })
            throw error
        }
    }

    // Generate contextual alert message
    private async generateAlertMessage(disaster: any): Promise<string> {
        const location = (disaster.location as any)?.address || "your area"

        const templates: Record<Severity, string> = {
            CRITICAL: `🚨 CRITICAL ALERT: ${disaster.type} detected near ${location}. EVACUATE IMMEDIATELY. Follow local emergency instructions. This is a life-threatening situation.`,

            HIGH: `⚠️ WARNING: ${disaster.severity} ${disaster.type} in your area. ${disaster.title}. Prepare to evacuate. Stay alert and monitor official channels.`,

            MEDIUM: `📢 ALERT: ${disaster.type} reported near ${location}. Monitor situation closely. Prepare emergency kit and review evacuation plans.`,

            LOW: `ℹ️ ADVISORY: ${disaster.type} activity detected in region. Stay informed and be prepared. No immediate action required.`,
        }

        return templates[disaster.severity as Severity] || templates["MEDIUM"]
    }

    // Determine alert type based on severity
    private determineAlertType(disaster: any): AlertType {
        if (disaster.severity === "CRITICAL") return "EVACUATION"
        if (disaster.severity === "HIGH") return "WARNING"
        if (disaster.status === "RESOLVED") return "ALL_CLEAR"
        return "UPDATE"
    }

    // Get delivery method based on severity
    private getDeliveryMethod(severity: string): DeliveryMethod {
        if (severity === "CRITICAL") return "SMS" // Most reliable for critical
        if (severity === "HIGH") return "PUSH"
        return "IN_APP"
    }

    // Get Prisma delivery method based on severity
    private getPrismaDeliveryMethod(severity: string): DeliveryMethod {
        if (severity === "CRITICAL") return "SMS" // Most reliable for critical
        if (severity === "HIGH") return "PUSH"
        return "IN_APP"
    }

    // Find users within radius
    private async findUsersInRadius(
        center: Location,
        radius: number
    ): Promise<any[]> {
        const users = await prisma.user.findMany({
            where: {},
        })

        return users.filter((user: any) => {
            if (!user.location) return false
            const distance = this.calculateDistance(center, user.location as unknown as Location)
            return distance <= radius
        })
    }

    // Find nearby disasters
    async findNearbyDisasters(
        location: Location,
        radius: number
    ): Promise<any[]> {
        const activeDisasters = await prisma.disasterEvent.findMany({
            where: { status: "ACTIVE" },
        })

        return activeDisasters.filter((disaster) => {
            const distance = this.calculateDistance(
                location,
                disaster.location as unknown as Location
            )
            return distance <= radius
        })
    }

    // Reassess users in area (when disaster updates)
    async reassessUsersInArea(center: Location, radius: number): Promise<void> {
        const users = await this.findUsersInRadius(center, radius)

        logger.info("Reassessing users in area", { count: users.length })

        for (const user of users) {
            const assessment = await this.assessUserRisk(user.id)

            if (assessment.level === "HIGH" || assessment.level === "CRITICAL") {
                logger.warn("User at elevated risk", {
                    userId: user.id,
                    level: assessment.level,
                })
                // Could trigger additional alert here
            }
        }
    }

    // Haversine formula for distance calculation
    calculateDistance(loc1: Location, loc2: Location): number {
        const R = 6371 // Earth's radius in km
        const dLat = this.toRad(loc2.latitude - loc1.latitude)
        const dLon = this.toRad(loc2.longitude - loc1.longitude)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(loc1.latitude)) *
            Math.cos(this.toRad(loc2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRad(deg: number): number {
        return (deg * Math.PI) / 180
    }
}

export const alertService = new AlertService()
