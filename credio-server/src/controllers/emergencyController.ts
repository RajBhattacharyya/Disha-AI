import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../prismaClient'
import { sosService } from '../services/sosService'
import {logger} from '../utils/logger'

// Create SOS request
export async function createSOSRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { location, emergencyType, description, severity, mediaUrls } = req.body

    logger.warn('🚨 SOS REQUEST CREATED', {
      userId,
      emergencyType,
      severity,
      location: location.address,
    })

    // Create SOS request
    const result = await sosService.createSOSRequest({
      userId,
      location,
      emergencyType,
      description: description || '',
      severity,
      mediaUrls: mediaUrls || [],
    })

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('SOS creation failed:', error)
    next(error)
  }
}

// Get SOS tracking info
export async function getSOSTracking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const sos = await prisma.sOSRequest.findUnique({
      where: { id },
      select: {
        userId: true,
        responderAssigned: true,
      },
    })

    if (!sos) {
      return res.status(404).json({
        success: false,
        error: { message: 'SOS request not found' },
      })
    }

    // Users can view their own SOS or if they're the assigned responder
    if (sos.userId !== userId && sos.responderAssigned !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const tracking = await sosService.getSOSTracking(id)

    res.json({
      success: true,
      data: tracking,
    })
  } catch (error) {
    next(error)
  }
}

// Assign responder to SOS (responders only)
export async function assignResponder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const responderId = req.user!.userId

    const sos = await prisma.sOSRequest.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!sos) {
      return res.status(404).json({
        success: false,
        error: { message: 'SOS request not found' },
      })
    }

    if (sos.status !== 'PENDING' && sos.status !== 'DISPATCHED') {
      return res.status(400).json({
        success: false,
        error: { message: 'SOS is no longer available for assignment' },
      })
    }

    await sosService.assignResponder(id, responderId)

    logger.info('Responder assigned to SOS', { sosId: id, responderId })

    res.json({
      success: true,
      data: { message: 'Successfully assigned to SOS' },
    })
  } catch (error) {
    next(error)
  }
}

// Update SOS status
export async function updateSOSStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, notes } = req.body
    const userId = req.user!.userId

    const sos = await prisma.sOSRequest.findUnique({
      where: { id },
      select: { userId: true, responderAssigned: true },
    })

    if (!sos) {
      return res.status(404).json({
        success: false,
        error: { message: 'SOS request not found' },
      })
    }

    // Only the user or assigned responder can update status
    if (sos.userId !== userId && sos.responderAssigned !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    await sosService.updateSOSStatus(id, status, notes)

    logger.info(`SOS status updated: ${id} -> ${status}`)

    res.json({
      success: true,
      data: { message: 'SOS status updated' },
    })
  } catch (error) {
    next(error)
  }
}

// Cancel SOS
export async function cancelSOS(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const sos = await prisma.sOSRequest.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })

    if (!sos) {
      return res.status(404).json({
        success: false,
        error: { message: 'SOS request not found' },
      })
    }

    // Only the requester can cancel
    if (sos.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only the requester can cancel SOS' },
      })
    }

    if (sos.status === 'RESOLVED' || sos.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { message: 'SOS already completed or cancelled' },
      })
    }

    await prisma.sOSRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        responderNotes: 'Cancelled by user',
      },
    })

    logger.info(`SOS cancelled: ${id}`)

    res.json({
      success: true,
      data: { message: 'SOS cancelled' },
    })
  } catch (error) {
    next(error)
  }
}

// Get user's SOS history
export async function getUserSOSHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId

    const sosRequests = await prisma.sOSRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        responder: {
          select: { name: true },
        },
      },
    })

    res.json({
      success: true,
      data: { sosRequests },
    })
  } catch (error) {
    next(error)
  }
}

// Get emergency resources
export async function getEmergencyResources(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude, radius = 50, type, availability, limit = 20 } = req.query

    const where: any = {}
    if (type) where.type = type
    if (availability) where.availability = availability

    const resources = await prisma.emergencyResource.findMany({
      where,
      take: Number(limit),
    })

    // Calculate distances and filter by radius
    const resourcesWithDistance = resources
      .map((resource) => {
        const resourceLocation = resource.location as any
        const distance = calculateDistance(
          Number(latitude),
          Number(longitude),
          resourceLocation.latitude,
          resourceLocation.longitude
        )
        return { ...resource, distance }
      })
      .filter((resource) => resource.distance <= Number(radius))
      .sort((a, b) => a.distance - b.distance)

    res.json({
      success: true,
      data: { resources: resourcesWithDistance },
    })
  } catch (error) {
    next(error)
  }
}

// Get resource by ID
export async function getResourceById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const resource = await prisma.emergencyResource.findUnique({
      where: { id },
    })

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: { message: 'Resource not found' },
      })
    }

    res.json({
      success: true,
      data: { resource },
    })
  } catch (error) {
    next(error)
  }
}

// Report resource status
export async function reportResourceStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { availability, notes } = req.body

    const resource = await prisma.emergencyResource.findUnique({
      where: { id },
    })

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: { message: 'Resource not found' },
      })
    }

    await prisma.emergencyResource.update({
      where: { id },
      data: {
        availability,
        lastUpdated: new Date(),
      },
    })

    logger.info(`Resource status updated: ${id} -> ${availability}`, { userId: req.user!.userId, notes })

    res.json({
      success: true,
      data: { message: 'Resource status updated' },
    })
  } catch (error) {
    next(error)
  }
}

// Helper function
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
