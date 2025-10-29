import Queue from "bull"
import { logger } from "../utils/logger"
import { prisma } from "../prismaClient"
import { socketService } from "../sockets/alertSocket"

const alertQueue = new Queue("alert-delivery", process.env.REDIS_URL!)

export class AlertDeliveryService {
    // Queue alerts for delivery
    async queueAlertDelivery(alerts: any[]): Promise<void> {
        for (const alert of alerts) {
            await alertQueue.add(
                "deliver-alert",
                { alertId: alert.id },
                {
                    attempts: 3,
                    backoff: { type: "exponential", delay: 2000 },
                    priority: this.getPriority(alert.alertType),
                }
            )
        }

        logger.info("Alerts queued for delivery", { count: alerts.length })
    }

    // Process alert delivery
    async deliverAlert(alertId: string): Promise<void> {
        try {
            const alert = await prisma.alert.findUnique({
                where: { id: alertId },
                include: { user: true },
            })

            if (!alert) {
                throw new Error("Alert not found")
            }

            // Get translated message for user's language
            const userLang = alert.user?.preferredLanguage || "en"
            const message =
                (alert.translatedMessages as any)?.[userLang] || alert.message

            // Deliver via appropriate channel
            switch (alert.deliveryMethod) {
                case "PUSH":
                    await this.deliverViaPushNotification(alert, message)
                    break
                case "SMS":
                    await this.deliverViaSMS(alert, message)
                    break
                case "EMAIL":
                    await this.deliverViaEmail(alert, message)
                    break
                case "IN_APP":
                    await this.deliverInApp(alert, message)
                    break
                default:
                    // For any other method, use WebSocket as fallback
                    await this.deliverViaWebSocket(alert, message)
                    break
            }

            // Update delivery status
            await prisma.alert.update({
                where: { id: alertId },
                data: {
                    deliveryStatus: "DELIVERED",
                    deliveredAt: new Date(),
                },
            })

            logger.info("Alert delivered", { alertId, method: alert.deliveryMethod })
        } catch (error) {
            logger.error("Alert delivery failed", { error, alertId })

            await prisma.alert.update({
                where: { id: alertId },
                data: { deliveryStatus: "FAILED" },
            })

            throw error
        }
    }

    // WebSocket delivery
    private async deliverViaWebSocket(alert: any, message: string): Promise<void> {
        socketService.sendAlertToUser(alert.userId, {
            id: alert.id,
            type: alert.alertType,
            message,
            severity: alert.disaster?.severity,
            location: alert.location,
            timestamp: new Date(),
        })
    }

    // Push notification delivery (placeholder)
    private async deliverViaPushNotification(
        alert: any,
        message: string
    ): Promise<void> {
        // Implement with FCM/APNS
        logger.info("Push notification sent", { alertId: alert.id, message })
    }

    // SMS delivery (placeholder)
    private async deliverViaSMS(alert: any, message: string): Promise<void> {
        // Implement with Twilio/AWS SNS
        logger.info("SMS sent", { alertId: alert.id, phone: alert.user?.phoneNumber, message })
    }

    // Email delivery (placeholder)
    private async deliverViaEmail(alert: any, message: string): Promise<void> {
        // Implement with SendGrid/AWS SES
        logger.info("Email sent", { alertId: alert.id, email: alert.user?.email, message })
    }

    // In-app delivery
    private async deliverInApp(alert: any, message: string): Promise<void> {
        // Just mark as ready for in-app display
        logger.info("In-app alert ready", { alertId: alert.id, message })
    }

    // Get queue priority based on alert type
    private getPriority(alertType: string): number {
        const priorities: Record<string, number> = {
            EVACUATION: 1, // Highest
            WARNING: 2,
            UPDATE: 3,
            ALL_CLEAR: 4, // Lowest
        }
        return priorities[alertType] || 3
    }
}

export const alertDeliveryService = new AlertDeliveryService()

// Process alert delivery jobs
alertQueue.process("deliver-alert", async (job) => {
    await alertDeliveryService.deliverAlert(job.data.alertId)
})
