import { prisma } from '../prismaClient'
import { logger } from '../utils/logger'
import { pushService } from './pushService'
import { alertService } from './alertService'
import { localizationService } from './localizationService'

import { SOSRequestData, SOSResponse, SOSStatus } from '../types/sos.types'
import { Location } from '../types/alert.types'

export class SOSService {
    // Create SOS request
    async createSOSRequest(data: SOSRequestData): Promise<SOSResponse> {
        const { userId, location, emergencyType, description, severity, mediaUrls } = data

        // Validate user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { emergencyContacts: true, name: true, phoneNumber: true, email: true }
        })

        if (!user) {
            throw new Error('User not found')
        }

        // Create SOS record
        const sos = await prisma.sOSRequest.create({
            data: {
                userId,
                location,
                emergencyType,
                description,
                severity,
                mediaUrls,
                status: 'PENDING'
            }
        })

        logger.warn('SOS ACTIVATED', { sosId: sos.id, userId, type: emergencyType })

        // Trigger immediate notifications (but don't auto-dispatch)
        // Admin will manually dispatch after reviewing
        Promise.all([
            this.notifyNearbyResponders(sos),
            this.sendToEmergencyServices(sos),
            this.alertEmergencyContacts(user, sos),
            this.broadcastToAdmins(sos)
        ]).catch(err => logger.error('Error sending SOS notifications:', err))

        // Keep status as PENDING - admin will dispatch manually
        return {
            sosId: sos.id,
            status: 'PENDING',
            estimatedResponse: 'Awaiting dispatch'
        }
    }

    // Find and notify nearby responders
    private async notifyNearbyResponders(sos: any): Promise<void> {
        const responders = await prisma.user.findMany({
            where: {
                role: 'RESPONDER',
                isVerified: true
            }
        })

        // Filter by distance and specialization
        const eligibleResponders = responders
            .filter(r => {
                if (!r.location) return false
                const distance = alertService.calculateDistance(sos.location as unknown as Location, r.location as unknown as Location)
                return distance <= 10 // Within 10km
            })
            .sort((a, b) => {
                if (!a.location || !b.location) return 0
                const distA = alertService.calculateDistance(sos.location as unknown as Location, a.location as unknown as Location)
                const distB = alertService.calculateDistance(sos.location as unknown as Location, b.location as unknown as Location)
                return distA - distB
            })
            .slice(0, 5) // Top 5 closest

        // Send notifications
        for (const responder of eligibleResponders) {
            if (!responder.location) continue
            const distance = alertService.calculateDistance(sos.location as unknown as Location, responder.location as unknown as Location)
            await pushService.sendPushNotification(responder.id, {
                title: `🚨 SOS Request - ${sos.emergencyType}`,
                body: `Emergency ${distance.toFixed(1)}km away. Can you respond?`,
                data: {
                    sosId: sos.id,
                    type: 'SOS_REQUEST',
                    action: 'RESPOND'
                }
            })
        }

        logger.info(`Notified ${eligibleResponders.length} responders`, { sosId: sos.id })
    }

    // Send to external emergency services API
    private async sendToEmergencyServices(sos: any): Promise<void> {
        try {
            const emergencyNumber = localizationService.getEmergencyNumber(
                this.getCountryFromLocation(sos.location)
            )

            logger.error('SOS - Emergency services notified', {
                sosId: sos.id,
                location: sos.location,
                type: sos.emergencyType,
                emergencyNumber
            })

            // Automated call via Twilio (if configured)
            if (process.env.ENABLE_AUTO_EMERGENCY_CALL === 'true') {
                const { EmergencyCallService } = await import('./emergencyCallService')
                const emergencyCallService = new EmergencyCallService()
                await emergencyCallService.initiateEmergencyCall(sos)
            }
        } catch (error) {
            logger.error('Failed to notify emergency services', { sosId: sos.id, error })
        }
    }

    // Alert user's emergency contacts
    private async alertEmergencyContacts(user: any, sos: any): Promise<void> {
        if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
            return
        }

        const message = `
🚨 EMERGENCY ALERT
${user.name} has triggered an SOS alert via Credio.
Emergency Type: ${sos.emergencyType}
Time: ${new Date().toLocaleString()}
Location: ${sos.location.address}
Coordinates: ${sos.location.latitude}, ${sos.location.longitude}
Track Status: ${process.env.CLIENT_URL}/emergency/track/${sos.id}

If this is a false alarm, please contact ${user.phoneNumber || user.email} immediately.
    `.trim()

        for (const contact of user.emergencyContacts) {
            try {
                // Send SMS
                if (contact.phone && (pushService as any).twilioClient) {
                    await (pushService as any).twilioClient.messages.create({
                        to: contact.phone,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        body: message
                    })
                }

                // Send push if they're also Credio users
                if (contact.userId) {
                    await pushService.sendPushNotification(contact.userId, {
                        title: `🚨 Emergency: ${user.name}`,
                        body: `${user.name} needs help. ${sos.emergencyType} at ${sos.location.address}`,
                        data: { sosId: sos.id, action: 'TRACK_SOS' }
                    })
                }

                logger.info('Emergency contact notified', { sosId: sos.id, contactName: contact.name })
            } catch (error) {
                logger.error('Failed to notify emergency contact', { sosId: sos.id, contact: contact.name, error })
            }
        }
    }

    // Broadcast to admin dashboard
    private async broadcastToAdmins(sos: any): Promise<void> {
        try {
            // WebSocket broadcast to admin room
            const { socketService } = await import('../sockets/alertSocket')
            socketService['io']?.to('admin-dashboard').emit('sos-alert', {
                id: sos.id,
                type: sos.emergencyType,
                severity: sos.severity,
                location: sos.location,
                timestamp: new Date()
            })
        } catch (error) {
            logger.error('Failed to broadcast to admins', { sosId: sos.id, error })
        }
    }

    // Assign responder to SOS
    async assignResponder(sosId: string, responderId: string): Promise<void> {
        const responder = await prisma.user.findUnique({
            where: { id: responderId },
            select: { name: true, phoneNumber: true }
        })

        await prisma.sOSRequest.update({
            where: { id: sosId },
            data: {
                responderAssigned: responderId,
                status: 'IN_PROGRESS'
            }
        })

        // Notify user
        const sos = await prisma.sOSRequest.findUnique({ where: { id: sosId } })
        await pushService.sendPushNotification(sos!.userId, {
            title: 'Help is on the way!',
            body: `${responder!.name} is responding to your SOS. ETA: 5-10 minutes.`,
            data: { sosId, responderId }
        })

        // Notify responder with user details
        await pushService.sendPushNotification(responderId, {
            title: 'SOS Accepted',
            body: `Navigate to ${(sos!.location as any).address}. Contact: ${sos!.description}`,
            data: { sosId, action: 'NAVIGATE' }
        })
    }

    // Update SOS status
    async updateSOSStatus(sosId: string, status: SOSStatus, notes?: string): Promise<void> {
        await prisma.sOSRequest.update({
            where: { id: sosId },
            data: {
                status,
                responderNotes: notes,
                ...(status === 'RESOLVED' && { resolvedAt: new Date() })
            }
        })

        const sos = await prisma.sOSRequest.findUnique({
            where: { id: sosId },
            include: { user: true }
        })

        await this.notifyStatusUpdate(sos, status)
    }

    // Get SOS tracking info
    async getSOSTracking(sosId: string): Promise<any> {
        const sos = await prisma.sOSRequest.findUnique({
            where: { id: sosId },
            include: {
                user: { select: { name: true, phoneNumber: true } },
                responder: { select: { name: true, phoneNumber: true, location: true } }
            }
        })

        if (!sos) {
            throw new Error('SOS not found')
        }

        let eta = null
        if (sos.responder?.location) {
            const distance = alertService.calculateDistance(sos.location as unknown as Location, sos.responder.location as unknown as Location)
            eta = Math.ceil(distance / 0.5) // Assume 30km/h average speed
        }

        return {
            id: sos.id,
            status: sos.status,
            emergencyType: sos.emergencyType,
            severity: sos.severity,
            description: sos.description,
            location: sos.location,
            createdAt: sos.createdAt,
            responder: sos.responder ? {
                name: sos.responder.name,
                phone: sos.responder.phoneNumber,
                role: 'RESPONDER',
                eta: `${eta} minutes`
            } : null,
            responderNotes: sos.responderNotes,
            timeline: await this.getSOSTimeline(sosId)
        }
    }

    private async getSOSTimeline(sosId: string): Promise<any[]> {
        // Implementation for timeline events
        return []
    }

    private async notifyStatusUpdate(sos: any, status: SOSStatus): Promise<void> {
        try {
            // Notify user of status change
            await pushService.sendPushNotification(sos.userId, {
                title: 'SOS Status Update',
                body: `Your SOS request status: ${status}`,
                data: { sosId: sos.id, status }
            })

            // Notify responder if assigned
            if (sos.responderAssigned) {
                await pushService.sendPushNotification(sos.responderAssigned, {
                    title: 'SOS Status Update',
                    body: `SOS request status updated: ${status}`,
                    data: { sosId: sos.id, status }
                })
            }

            logger.info('Status update notifications sent', { sosId: sos.id, status })
        } catch (error) {
            logger.error('Failed to send status update notifications', { sosId: sos.id, status, error })
        }
    }

    private getCountryFromLocation(location: any): string {
        // Implement reverse geocoding or use default
        return 'US'
    }
}

export const sosService = new SOSService()
