import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../prismaClient'
import { logger } from '../utils/logger'

// Get user alerts
export async function getAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { isRead, limit = 20, offset = 0 } = req.query
        const userId = req.user!.userId

        const where: any = { userId }
        if (isRead !== undefined) {
            where.isRead = isRead === 'true'
        }

        const [alerts, total] = await Promise.all([
            prisma.alert.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { sentAt: 'desc' },
                include: {
                    disaster: {
                        select: {
                            id: true,
                            type: true,
                            severity: true,
                            title: true,
                            location: true,
                        },
                    },
                },
            }),
            prisma.alert.count({ where }),
        ])

        res.json({
            success: true,
            data: {
                alerts,
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

// Get unread alert count
export async function getUnreadAlertCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId

        const count = await prisma.alert.count({
            where: {
                userId,
                isRead: false,
            },
        })

        res.json({
            success: true,
            data: { count },
        })
    } catch (error) {
        next(error)
    }
}

// Get single alert
export async function getAlertById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const userId = req.user!.userId

        const alert = await prisma.alert.findUnique({
            where: { id },
            include: {
                disaster: true,
            },
        })

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: { message: 'Alert not found' },
            })
        }

        if (alert.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: { message: 'Cannot access other users alerts' },
            })
        }

        res.json({
            success: true,
            data: { alert },
        })
    } catch (error) {
        next(error)
    }
}

// Mark alert as read
export async function markAlertRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const userId = req.user!.userId

        // Verify alert belongs to user
        const alert = await prisma.alert.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: { message: 'Alert not found' },
            })
        }

        if (alert.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: { message: 'Cannot modify other users alerts' },
            })
        }

        const updated = await prisma.alert.update({
            where: { id },
            data: { isRead: true },
        })

        logger.info('Alert marked as read', { alertId: id, userId })

        res.json({
            success: true,
            data: { alert: updated },
        })
    } catch (error) {
        next(error)
    }
}

// Mark all alerts as read
export async function markAllAlertsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId

        const result = await prisma.alert.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        })

        logger.info('All alerts marked as read', { userId, count: result.count })

        res.json({
            success: true,
            data: { message: 'All alerts marked as read', count: result.count },
        })
    } catch (error) {
        next(error)
    }
}

// Dismiss alert
export async function dismissAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const userId = req.user!.userId

        const alert = await prisma.alert.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: { message: 'Alert not found' },
            })
        }

        if (alert.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: { message: 'Cannot delete other users alerts' },
            })
        }

        await prisma.alert.delete({ where: { id } })

        logger.info('Alert dismissed', { alertId: id, userId })

        res.json({
            success: true,
            data: { message: 'Alert dismissed' },
        })
    } catch (error) {
        next(error)
    }
}
