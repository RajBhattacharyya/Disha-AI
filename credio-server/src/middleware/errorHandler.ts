import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
    logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
    })

    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            success: false,
            error: { message: 'Database error occurred' },
        })
    }

    // Validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: { message: error.message },
        })
    }

    // Default error
    res.status(500).json({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        },
    })
}
