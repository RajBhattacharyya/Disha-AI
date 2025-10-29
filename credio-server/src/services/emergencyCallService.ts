import twilio from 'twilio'
import { prisma } from '../prismaClient'
import { logger } from '../utils/logger'
import { localizationService } from './localizationService'

export class EmergencyCallService {
    private twilioClient: any

    constructor() {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    }

    // Initiate emergency call
    async initiateEmergencyCall(sos: any): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: sos.userId } })
        const emergencyNumber = localizationService.getEmergencyNumber(this.getCountryCode(sos.location))

        try {
            const call = await this.twilioClient.calls.create({
                to: emergencyNumber,
                from: process.env.TWILIO_PHONE_NUMBER,
                twiml: `
          <Response>
            <Say voice="alice" language="en-US">
              Emergency alert from Credio disaster response system.
              User ${user!.name} at location ${sos.location.address}
              reports ${sos.emergencyType}.
              Coordinates: latitude ${sos.location.latitude}, longitude ${sos.location.longitude}.
              ${sos.description ? `Additional details: ${sos.description}.` : ''}
              Callback number: ${user!.phoneNumber || 'not provided'}.
              This is an automated emergency notification.
            </Say>
          </Response>
        `
            })

            logger.info('Emergency call initiated', { sosId: sos.id, callSid: call.sid, to: emergencyNumber })

            await prisma.sOSRequest.update({
                where: { id: sos.id },
                data: {
                    responderNotes: `Emergency call initiated. Call SID: ${call.sid}, Time: ${new Date().toISOString()}`
                }
            })
        } catch (error) {
            logger.error('Emergency call failed', { sosId: sos.id, error })
            throw error
        }
    }

    // Get emergency call URL for direct dial
    async getEmergencyCallUrl(location: any): Promise<string> {
        const countryCode = this.getCountryCode(location)
        const emergencyNumber = localizationService.getEmergencyNumber(countryCode)
        return `tel:${emergencyNumber}`
    }

    private getCountryCode(location: any): string {
        return 'US' // Implement reverse geocoding
    }
}

export const emergencyCallService = new EmergencyCallService()
