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
    })
}
