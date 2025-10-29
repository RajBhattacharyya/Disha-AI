import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../prismaClient'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Check if session exists
    const session = await prisma.userSession.findFirst({
      where: {
        token,
        userId: decoded.userId,
        expiresAt: { gte: new Date() },
      },
    })

    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' },
      })
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token' },
      })
    }
    next(error)
  }
}

export function authorize(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    })

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' },
      })
    }

    next()
  }
}
