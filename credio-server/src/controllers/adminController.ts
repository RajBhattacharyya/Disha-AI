import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../prismaClient'
import { io } from '../server'
import { logger } from '../utils/logger'

// ==================== DASHBOARD ====================
export async function getDashboardStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const [totalUsers, activeDisasters, pendingSOS, alertsSent24h, responders] =
            await Promise.all([
                prisma.user.count(),
                prisma.disasterEvent.count({ where: { status: 'ACTIVE' } }),
                prisma.sOSRequest.count({ where: { status: 'PENDING' } }),
                prisma.alert.count({
                    where: {
                        sentAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                prisma.user.count({ where: { role: 'RESPONDER' } }),
            ])

        res.json({
            success: true,
            data: {
                totalUsers,
                activeDisasters,
                pendingSOS,
                alertsSent24h,
                responders,
            },
        })
    } catch (error) {
        next(error)
    }
}

// ==================== SOS MANAGEMENT ====================
export async function getAllSOSRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { status, severity, emergencyType, limit = 50 } = req.query

        const where: any = {}
        if (status) where.status = status
        if (severity) where.severity = severity
        if (emergencyType) where.emergencyType = emergencyType

        const sosRequests = await prisma.sOSRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        email: true,
                        emergencyContacts: true,
                    },
                },
                responder: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                    },
                },
            },
            orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
            take: Number(limit),
        })

        res.json({
            success: true,
            data: { sosRequests },
        })
    } catch (error) {
        next(error)
    }
}

export async function getSOSDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        const sos = await prisma.sOSRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        email: true,
                        emergencyContacts: true,
                    },
                },
                responder: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        location: true,
                    },
                },
            },
        })

        if (!sos) {
            return res.status(404).json({
                success: false,
                error: { message: 'SOS request not found' },
            })
        }

        res.json({
            success: true,
            data: { sos },
        })
    } catch (error) {
        next(error)
    }
}

export async function assignResponder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const { responderId } = req.body

        const updated = await prisma.sOSRequest.update({
            where: { id },
            data: {
                responderAssigned: responderId,
                status: 'DISPATCHED',
            },
            include: {
                user: { select: { name: true, phoneNumber: true } },
                responder: { select: { name: true, phoneNumber: true } },
            },
        })

        // Emit real-time update
        io.emit('admin:sos-updated', updated)
        io.to(`sos:${id}`).emit('sos-update', updated)

        logger.info('Responder assigned to SOS', { sosId: id, responderId, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { sos: updated },
        })
    } catch (error) {
        next(error)
    }
}

export async function updateSOSStatusAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const { status, notes } = req.body

        const updated = await prisma.sOSRequest.update({
            where: { id },
            data: {
                status,
                responderNotes: notes || undefined,
            },
        })

        io.emit('admin:sos-updated', updated)
        io.to(`sos:${id}`).emit('sos-update', updated)

        logger.info('SOS status updated by admin', { sosId: id, status, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { sos: updated },
        })
    } catch (error) {
        next(error)
    }
}

// ==================== DISASTER MANAGEMENT ====================
export async function getAllDisasters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { status, type, severity } = req.query

        const where: any = {}
        if (status) where.status = status
        if (type) where.type = type
        if (severity) where.severity = severity

        const disasters = await prisma.disasterEvent.findMany({
            where,
            orderBy: [{ severity: 'desc' }, { startTime: 'desc' }],
            include: {
                _count: {
                    select: { alerts: true },
                },
            },
        })

        // Calculate affected users count
        const disastersWithCount = await Promise.all(
            disasters.map(async (disaster) => {
                const affectedUsersCount = await getAffectedUsersCount(disaster)
                return { ...disaster, affectedUsersCount }
            })
        )

        res.json({
            success: true,
            data: { disasters: disastersWithCount },
        })
    } catch (error) {
        next(error)
    }
}

export async function createDisaster(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { type, severity, title, description, location } = req.body

        const disaster = await prisma.disasterEvent.create({
            data: {
                type,
                severity,
                title,
                description,
                location,
                status: 'ACTIVE',
                dataSource: 'ADMIN_CREATED',
                startTime: new Date(),
                predictedImpact: {},
                affectedPopulation: 0,
                metadata: {},
            },
        })

        // Create alerts for affected users
        const affectedUsers = await getUsersInRadius(
            location.latitude,
            location.longitude,
            location.radius || 50
        )

        const alerts = await Promise.all(
            affectedUsers.map((user) =>
                prisma.alert.create({
                    data: {
                        userId: user.id,
                        disasterId: disaster.id,
                        alertType: severity === 'CRITICAL' ? 'EVACUATION' : 'WARNING',
                        message: `${severity} ${type}: ${title}. ${description}`,
                        translatedMessages: {},
                        deliveryStatus: 'PENDING',
                        deliveryMethod: 'IN_APP',
                        location: location,
                        isRead: false,
                    },
                })
            )
        )

        // Emit real-time notifications
        io.emit('admin:new-disaster', disaster)
        affectedUsers.forEach((user) => {
            io.to(`user:${user.id}`).emit('disaster-alert', {
                disaster,
                severity,
                message: `${type} detected in your area`,
            })
        })

        logger.info('Disaster created by admin', {
            disasterId: disaster.id,
            adminId: req.user!.userId,
            affectedUsers: affectedUsers.length,
        })

        res.status(201).json({
            success: true,
            data: { disaster, alertsSent: alerts.length },
        })
    } catch (error) {
        next(error)
    }
}

export async function getDisasterDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        const disaster = await prisma.disasterEvent.findUnique({
            where: { id },
            include: {
                alerts: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                    orderBy: { sentAt: 'desc' },
                    take: 10,
                },
            },
        })

        if (!disaster) {
            return res.status(404).json({
                success: false,
                error: { message: 'Disaster not found' },
            })
        }

        const affectedUsersCount = await getAffectedUsersCount(disaster)

        res.json({
            success: true,
            data: { disaster: { ...disaster, affectedUsersCount } },
        })
    } catch (error) {
        next(error)
    }
}

export async function updateDisaster(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const { title, description, status, severity } = req.body

        const updated = await prisma.disasterEvent.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(status && { status }),
                ...(severity && { severity }),
            },
        })

        io.emit('disaster-update', updated)

        logger.info('Disaster updated by admin', { disasterId: id, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { disaster: updated },
        })
    } catch (error) {
        next(error)
    }
}

export async function deleteDisaster(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        // Delete related alerts first
        await prisma.alert.deleteMany({ where: { disasterId: id } })

        // Delete disaster
        await prisma.disasterEvent.delete({ where: { id } })

        logger.warn('Disaster deleted by admin', { disasterId: id, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { message: 'Disaster deleted' },
        })
    } catch (error) {
        next(error)
    }
}

// ==================== USER MANAGEMENT ====================
export async function getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { role, search, limit = 50 } = req.query

        const where: any = {}
        if (role) where.role = role
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
            ]
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        sosRequests: true,
                        alerts: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        })

        res.json({
            success: true,
            data: { users },
        })
    } catch (error) {
        next(error)
    }
}

export async function getUserDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                sosRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                alerts: {
                    orderBy: { sentAt: 'desc' },
                    take: 10,
                },
            },
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            })
        }

        res.json({
            success: true,
            data: { user },
        })
    } catch (error) {
        next(error)
    }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const { role } = req.body

        const updated = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, name: true, email: true, role: true },
        })

        logger.info('User role updated by admin', { userId: id, newRole: role, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { user: updated },
        })
    } catch (error) {
        next(error)
    }
}

export async function updateUserInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const { name, email, phoneNumber } = req.body

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phoneNumber !== undefined && { phoneNumber }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        })

        logger.info('User info updated by admin', { userId: id, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { user: updated },
        })
    } catch (error) {
        next(error)
    }
}

export async function banUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const { isBanned, reason } = req.body

        const updated = await prisma.user.update({
            where: { id },
            data: {
                // Add isBanned field to your schema if needed
                // isBanned,
                // banReason: reason,
            },
        })

        logger.warn('User ban status updated', { userId: id, isBanned, reason, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { user: updated },
        })
    } catch (error) {
        next(error)
    }
}

// ==================== ANALYTICS ====================
export async function getAnalyticsOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { range = '30d' } = req.query
        const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const [
            totalUsers,
            activeDisasters,
            totalSOS,
            totalAlerts,
            userGrowth,
            activeUsers,
            alertsSent,
            alertDelivery,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.disasterEvent.count({ where: { status: 'ACTIVE' } }),
            prisma.sOSRequest.count({ where: { createdAt: { gte: startDate } } }),
            prisma.alert.count({ where: { sentAt: { gte: startDate } } }),
            getUserGrowthData(startDate),
            getActiveUsersData(startDate),
            getAlertsSentData(startDate),
            getAlertDeliveryData(startDate),
        ])

        res.json({
            success: true,
            data: {
                totalUsers,
                activeDisasters,
                totalSOS,
                totalAlerts,
                userGrowth,
                activeUsers,
                alertsSent,
                alertDelivery,
            },
        })
    } catch (error) {
        next(error)
    }
}

export async function getDisasterAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { range = '30d' } = req.query
        const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const [overTime, byType, bySeverity, topRegions] = await Promise.all([
            getDisastersOverTime(startDate),
            getDisastersByType(startDate),
            getDisastersBySeverity(startDate),
            getTopAffectedRegions(startDate),
        ])

        res.json({
            success: true,
            data: {
                overTime,
                byType,
                bySeverity,
                topRegions,
            },
        })
    } catch (error) {
        next(error)
    }
}

export async function getSOSAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { range = '30d' } = req.query
        const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const [overTime, byType, byStatus, responseTime] = await Promise.all([
            getSOSOverTime(startDate),
            getSOSByType(startDate),
            getSOSByStatus(startDate),
            getSOSResponseTime(startDate),
        ])

        res.json({
            success: true,
            data: {
                overTime,
                byType,
                byStatus,
                responseTime,
            },
        })
    } catch (error) {
        next(error)
    }
}

// ==================== HELPER FUNCTIONS ====================
async function getAffectedUsersCount(disaster: any): Promise<number> {
    const location = disaster.location as any
    const users = await getUsersInRadius(location.latitude, location.longitude, location.radius || 50)
    return users.length
}

async function getUsersInRadius(
    latitude: number,
    longitude: number,
    radiusKm: number
): Promise<any[]> {
    // Simple distance calculation - in production use PostGIS or similar
    const users = await prisma.user.findMany()

    return users.filter((user) => {
        if (!user.location) return false
        const loc = user.location as any
        if (!loc.latitude || !loc.longitude) return false
        const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude)
        return distance <= radiusKm
    })
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
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

// Analytics helper functions
async function getUserGrowthData(startDate: Date) {
    const users = await prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
    })

    const grouped: any = {}
    users.forEach((user) => {
        const date = user.createdAt.toISOString().split('T')[0]
        grouped[date] = (grouped[date] || 0) + 1
    })

    return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

async function getActiveUsersData(_startDate: Date) {
    // Implementation based on your activity tracking
    return []
}

async function getAlertsSentData(startDate: Date) {
    const alerts = await prisma.alert.findMany({
        where: { sentAt: { gte: startDate } },
        select: { sentAt: true },
    })

    const grouped: any = {}
    alerts.forEach((alert) => {
        if (alert.sentAt) {
            const date = alert.sentAt.toISOString().split('T')[0]
            grouped[date] = (grouped[date] || 0) + 1
        }
    })

    return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

async function getAlertDeliveryData(startDate: Date) {
    const alerts = await prisma.alert.groupBy({
        by: ['deliveryStatus'],
        where: { sentAt: { gte: startDate } },
        _count: true,
    })

    return alerts.map((a) => ({ status: a.deliveryStatus, count: a._count }))
}

async function getDisastersOverTime(startDate: Date) {
    const disasters = await prisma.disasterEvent.groupBy({
        by: ['startTime'],
        where: { startTime: { gte: startDate } },
        _count: true,
    })

    return formatTimeSeriesData(disasters, 'startTime', '_count')
}

async function getDisastersByType(startDate: Date) {
    const disasters = await prisma.disasterEvent.groupBy({
        by: ['type'],
        where: { startTime: { gte: startDate } },
        _count: true,
    })

    return disasters.map((d) => ({ type: d.type, count: d._count }))
}

async function getDisastersBySeverity(startDate: Date) {
    const disasters = await prisma.disasterEvent.groupBy({
        by: ['severity'],
        where: { startTime: { gte: startDate } },
        _count: true,
    })

    return disasters.map((d) => ({ severity: d.severity, count: d._count }))
}

async function getTopAffectedRegions(startDate: Date) {
    // Simplified - group by location address
    const disasters = await prisma.disasterEvent.findMany({
        where: { startTime: { gte: startDate } },
        select: { location: true },
    })

    // Extract regions and count
    const regionCounts: any = {}
    disasters.forEach((d) => {
        const location = d.location as any
        const region = location?.address?.split(',').slice(-2).join(',').trim() || 'Unknown'
        regionCounts[region] = (regionCounts[region] || 0) + 1
    })

    return Object.entries(regionCounts)
        .map(([region, count]) => ({ region, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)
}

async function getSOSOverTime(startDate: Date) {
    const sos = await prisma.sOSRequest.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
    })

    // Group by date and status
    const byDate: any = {}
    sos.forEach((s) => {
        const date = s.createdAt.toISOString().split('T')[0]
        if (!byDate[date]) {
            byDate[date] = { date, pending: 0, resolved: 0 }
        }
        if (s.status === 'PENDING') byDate[date].pending++
        if (s.status === 'RESOLVED') byDate[date].resolved++
    })

    return Object.values(byDate)
}

async function getSOSByType(startDate: Date) {
    const sos = await prisma.sOSRequest.groupBy({
        by: ['emergencyType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
    })

    return sos.map((s) => ({ type: s.emergencyType, count: s._count }))
}

async function getSOSByStatus(startDate: Date) {
    const sos = await prisma.sOSRequest.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
    })

    return sos.map((s) => ({ status: s.status, count: s._count }))
}

async function getSOSResponseTime(_startDate: Date) {
    // Calculate average response time
    return []
}

function formatTimeSeriesData(data: any[], dateKey: string, valueKey: string) {
    const grouped: any = {}
    data.forEach((item) => {
        const date = new Date(item[dateKey]).toISOString().split('T')[0]
        grouped[date] = (grouped[date] || 0) + (item[valueKey] || 1)
    })

    return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

// ==================== ALERT MANAGEMENT ====================
export async function getAllAlerts(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const alerts = await prisma.alert.findMany({
            include: {
                user: { select: { name: true, email: true } },
                disaster: { select: { title: true, type: true } },
            },
            orderBy: { sentAt: 'desc' },
            take: 100,
        })

        res.json({
            success: true,
            data: { alerts },
        })
    } catch (error) {
        next(error)
    }
}

export async function broadcastAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { alertType, message, disasterId, targetRegion } = req.body

        let targetUsers: any[] = []

        if (disasterId) {
            // Get users affected by this disaster
            const disaster = await prisma.disasterEvent.findUnique({ where: { id: disasterId } })
            if (disaster) {
                const location = disaster.location as any
                targetUsers = await getUsersInRadius(
                    location.latitude,
                    location.longitude,
                    location.radius || 50
                )
            }
        } else if (targetRegion) {
            // Get users in target region
            targetUsers = await getUsersInRadius(
                targetRegion.latitude,
                targetRegion.longitude,
                targetRegion.radius || 50
            )
        } else {
            // Broadcast to all users
            targetUsers = await prisma.user.findMany()
        }

        // Create alerts
        const alerts = await Promise.all(
            targetUsers.map((user) =>
                prisma.alert.create({
                    data: {
                        userId: user.id,
                        disasterId: disasterId || undefined,
                        alertType,
                        message,
                        translatedMessages: {},
                        deliveryStatus: 'PENDING',
                        deliveryMethod: 'IN_APP',
                        location: user.location || {},
                        isRead: false,
                    },
                })
            )
        )

        // Emit real-time notifications
        targetUsers.forEach((user) => {
            io.to(`user:${user.id}`).emit('personal-alert', {
                alertType,
                message,
                timestamp: new Date(),
            })
        })

        logger.info('Broadcast alert sent by admin', {
            alertType,
            recipientCount: alerts.length,
            adminId: req.user!.userId,
        })

        res.json({
            success: true,
            data: { alertsSent: alerts.length },
        })
    } catch (error) {
        next(error)
    }
}

// ==================== RESOURCE MANAGEMENT ====================
export async function createResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { name, type, location, contactPhone, availability, description, contactEmail, operatingHours } = req.body

        const resource = await prisma.emergencyResource.create({
            data: {
                name,
                type,
                description: description || '',
                location,
                contactPhone,
                contactEmail: contactEmail || '',
                availability,
                operatingHours: operatingHours || {},
            },
        })

        logger.info('Resource created by admin', { resourceId: resource.id, adminId: req.user!.userId })

        res.status(201).json({
            success: true,
            data: { resource },
        })
    } catch (error) {
        next(error)
    }
}

export async function updateResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const updateData = req.body

        const resource = await prisma.emergencyResource.update({
            where: { id },
            data: updateData,
        })

        res.json({
            success: true,
            data: { resource },
        })
    } catch (error) {
        next(error)
    }
}

export async function deleteResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params

        await prisma.emergencyResource.delete({ where: { id } })

        logger.info('Resource deleted by admin', { resourceId: id, adminId: req.user!.userId })

        res.json({
            success: true,
            data: { message: 'Resource deleted' },
        })
    } catch (error) {
        next(error)
    }
}
