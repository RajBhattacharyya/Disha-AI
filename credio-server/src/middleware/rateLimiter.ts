import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export function rateLimiter(options: { windowMs: number; max: number; message?: string }) {
    return rateLimit({
        store: new RedisStore({
            sendCommand: (command: string, ...args: (string | number)[]) =>
                redis.call(command, ...args) as Promise<any>,
            prefix: 'rate-limit:',
        }),
        windowMs: options.windowMs,
        max: options.max,
        message: options.message || 'Too many requests, please try again later',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res) => {
            const retryAfter = Math.ceil(options.windowMs / 1000)
            res.status(429).json({
                success: false,
                error: {
                    message: options.message || `Too many requests. Please try again in ${retryAfter} seconds.`,
                    retryAfter,
                },
            })
        },
    })
}
