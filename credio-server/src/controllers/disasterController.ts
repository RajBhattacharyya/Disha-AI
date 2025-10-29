import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../prismaClient'
import { ragService } from '../services/ragService'
import { alertService } from '../services/alertService'
import { logger } from '../utils/logger'

// Get all disasters with filters
export async function getDisasters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { status, type, severity, limit = 20, offset = 0 } = req.query

        const where: any = {}

        if (status) where.status = status
        if (type) where.type = type
        if (severity) where.severity = severity

        const [disasters, total] = await Promise.all([
            prisma.disasterEvent.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: [{ severity: 'desc' }, { startTime: 'desc' }],
            }),
            prisma.disasterEvent.count({ where }),
        ])

        res.json({
            success: true,
            data: {
                disasters,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: total > Number(offset) + Number(limit),
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

// Get nearby disasters
export async function getNearbyDisasters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { latitude, longitude, radius = 100 } = req.query

        // Get all active disasters
        const disasters = await prisma.disasterEvent.findMany({
            where: {
                status: 'ACTIVE',
            },
        })

        // Filter by distance
        const nearbyDisasters = disasters
            .map((disaster) => {
                const disasterLocation = disaster.location as any
                const distance = calculateDistance(
                    Number(latitude),
                    Number(longitude),
                    disasterLocation.latitude,
                    disasterLocation.longitude
                )

                return { ...disaster, distance }
            })
            .filter((disaster) => disaster.distance <= Number(radius))
            .sort((a, b) => a.distance - b.distance)

        logger.info('Nearby disasters retrieved', {
            userId: req.user!.userId,
            count: nearbyDisasters.length,
        })

        res.json({
            success: true,
            data: { disasters: nearbyDisasters },
        })
    } catch (error) {
        next(error)
    }
}

// Get user risk assessment
export async function getUserRiskAssessment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId

        // Get risk assessment from alert service
        const assessment = await alertService.assessUserRisk(userId)

        res.json({
            success: true,
            data: { assessment },
        })
    } catch (error) {
        next(error)
    }
}

// Get disaster by ID
export async function getDisasterById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        const disaster = await prisma.disasterEvent.findUnique({
            where: { id },
        })

        if (!disaster) {
            return res.status(404).json({
                success: false,
                error: { message: 'Disaster not found' },
            })
        }

        res.json({
            success: true,
            data: { disaster },
        })
    } catch (error) {
        next(error)
    }
}

// Get AI-generated guidance for disaster
export async function getDisasterGuidance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const userId = req.user!.userId

        const disaster = await prisma.disasterEvent.findUnique({
            where: { id },
        })

        if (!disaster) {
            return res.status(404).json({
                success: false,
                error: { message: 'Disaster not found' },
            })
        }

        // Generate guidance using RAG service
        const disasterLocation = disaster.location as any
        const query = `What safety protocols should I follow for a ${disaster.severity} severity ${disaster.type}? Location: ${disasterLocation.address || 'unknown'}`

        // Create temporary session for guidance
        const sessionId = `guidance-${userId}-${Date.now()}`

        const guidance = await ragService.processQuery(userId, query, sessionId)

        logger.info('Disaster guidance generated', { userId, disasterId: id })

        res.json({
            success: true,
            data: { guidance },
        })
    } catch (error) {
        next(error)
    }
}

// Get nearby resources for disaster
export async function getDisasterResources(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        const disaster = await prisma.disasterEvent.findUnique({
            where: { id },
        })

        if (!disaster) {
            return res.status(404).json({
                success: false,
                error: { message: 'Disaster not found' },
            })
        }

        const disasterLocation = disaster.location as any
        const searchRadius = disasterLocation.radius || 50

        // Find resources within disaster radius
        const allResources = await prisma.emergencyResource.findMany({
            where: {
                availability: { in: ['AVAILABLE', 'LIMITED'] },
            },
        })

        const nearbyResources = allResources
            .map((resource) => {
                const resourceLocation = resource.location as any
                const distance = calculateDistance(
                    disasterLocation.latitude,
                    disasterLocation.longitude,
                    resourceLocation.latitude,
                    resourceLocation.longitude
                )

                return { ...resource, distance }
            })
            .filter((resource) => resource.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10) // Limit to 10 closest resources

        res.json({
            success: true,
            data: { resources: nearbyResources },
        })
    } catch (error) {
        next(error)
    }
}

// Helper function to calculate distance (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180
}
