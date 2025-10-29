import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../prismaClient'
import { logger } from '../utils/logger'

// Get user profile
export async function getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    // Users can only view their own profile unless they're admin
    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        preferredLanguage: true,
        location: true,
        emergencyContacts: true,
        notificationPreferences: true,
        isVerified: true,
        createdAt: true,
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

// Update user profile
export async function updateUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, phoneNumber, preferredLanguage } = req.body

    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(preferredLanguage && { preferredLanguage }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        preferredLanguage: true,
      },
    })

    logger.info('User profile updated', { userId: id })

    res.json({
      success: true,
      data: { user: updated },
    })
  } catch (error) {
    next(error)
  }
}

// Update user location
export async function updateUserLocation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { location } = req.body

    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    await prisma.user.update({
      where: { id },
      data: { location },
    })

    logger.info('User location updated', { userId: id })

    res.json({
      success: true,
      data: { message: 'Location updated', location },
    })
  } catch (error) {
    next(error)
  }
}

// Update notification preferences
export async function updateNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { push, sms, email } = req.body

    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { notificationPreferences: true },
    })

    const preferences = {
      ...(user?.notificationPreferences as any),
      ...(push !== undefined && { push }),
      ...(sms !== undefined && { sms }),
      ...(email !== undefined && { email }),
    }

    await prisma.user.update({
      where: { id },
      data: { notificationPreferences: preferences },
    })

    logger.info('Notification preferences updated', { userId: id })

    res.json({
      success: true,
      data: { preferences },
    })
  } catch (error) {
    next(error)
  }
}

// Add emergency contact
export async function addEmergencyContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, phone, relationship } = req.body

    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { emergencyContacts: true },
    })

    const contacts = [...((user?.emergencyContacts as any[]) || []), { id: Date.now().toString(), name, phone, relationship }]

    await prisma.user.update({
      where: { id },
      data: { emergencyContacts: contacts },
    })

    logger.info('Emergency contact added', { userId: id })

    res.status(201).json({
      success: true,
      data: { contacts },
    })
  } catch (error) {
    next(error)
  }
}

// Remove emergency contact
export async function removeEmergencyContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id, contactId } = req.params

    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { emergencyContacts: true },
    })

    const contacts = ((user?.emergencyContacts as any[]) || []).filter((c) => c.id !== contactId)

    await prisma.user.update({
      where: { id },
      data: { emergencyContacts: contacts },
    })

    logger.info('Emergency contact removed', { userId: id, contactId })

    res.json({
      success: true,
      data: { contacts },
    })
  } catch (error) {
    next(error)
  }
}
