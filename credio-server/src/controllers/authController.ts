import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../prismaClient'
import { logger } from '../utils/logger'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

// Register new user
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, email, password, phoneNumber } = req.body

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, ...(phoneNumber ? [{ phoneNumber }] : [])],
            },
        })

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'User with this email or phone already exists' },
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phoneNumber,
                role: 'USER',
                preferredLanguage: 'en',
                location: {},
                emergencyContacts: [],
                notificationPreferences: { push: true, sms: false, email: true },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                preferredLanguage: true,
                location: true,
                createdAt: true,
            },
        })

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        })

        // Create session
        await prisma.userSession.create({
            data: {
                userId: user.id,
                token,
                ipAddress: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        })

        logger.info(`New user registered: ${user.email}`)

        res.status(201).json({
            success: true,
            data: { user, token },
        })
    } catch (error) {
        next(error)
    }
}

// Login user
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body

        // Find user
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid email or password' },
            })
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid email or password' },
            })
        }

        // Generate token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        })

        // Create session
        await prisma.userSession.create({
            data: {
                userId: user.id,
                token,
                ipAddress: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        })

        logger.info(`User logged in: ${user.email}`)

        // Return user without password
        const { password: _, ...userWithoutPassword } = user

        res.json({
            success: true,
            data: { user: userWithoutPassword, token },
        })
    } catch (error) {
        next(error)
    }
}

// Logout user
export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '')

        if (token) {
            await prisma.userSession.deleteMany({ where: { token } })
        }

        res.json({
            success: true,
            data: { message: 'Logged out successfully' },
        })
    } catch (error) {
        next(error)
    }
}

// Refresh token
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { token: oldToken } = req.body

        if (!oldToken) {
            return res.status(400).json({
                success: false,
                error: { message: 'Token is required' },
            })
        }

        // Verify old token
        const decoded = jwt.verify(oldToken, JWT_SECRET) as any

        // Generate new token
        const newToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        })

        // Update session
        await prisma.userSession.updateMany({
            where: { token: oldToken },
            data: { token: newToken },
        })

        res.json({
            success: true,
            data: { token: newToken },
        })
    } catch (error) {
        next(error)
    }
}

// Forgot password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            return res.json({
                success: true,
                data: { message: 'If the email exists, a reset link has been sent' },
            })
        }

        // Generate reset token
        const resetToken = jwt.sign({ userId: user.id, purpose: 'password-reset' }, JWT_SECRET, {
            expiresIn: '1h',
        })

        // TODO: Send email with reset link
        // await emailService.sendPasswordResetEmail(user.email, resetToken);
        console.log('Reset token generated:', resetToken) // Temporary log until email service is implemented

        logger.info(`Password reset requested for: ${email}`)

        res.json({
            success: true,
            data: { message: 'If the email exists, a reset link has been sent' },
        })
    } catch (error) {
        next(error)
    }
}

// Reset password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, password } = req.body

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as any

        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid token' },
            })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update password
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword },
        })

        // Invalidate all sessions
        await prisma.userSession.deleteMany({ where: { userId: decoded.userId } })

        logger.info(`Password reset successful for user: ${decoded.userId}`)

        res.json({
            success: true,
            data: { message: 'Password reset successful' },
        })
    } catch (error) {
        next(error)
    }
}
