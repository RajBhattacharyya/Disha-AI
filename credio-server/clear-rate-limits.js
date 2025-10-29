// Utility script to clear rate limits from Redis
require('dotenv').config()
const Redis = require('ioredis')

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

async function clearRateLimits() {
    try {
        console.log('🔍 Searching for rate limit keys...')

        const keys = await redis.keys('rate-limit:*')

        if (keys.length === 0) {
            console.log('✅ No rate limit keys found')
            await redis.quit()
            return
        }

        console.log(`📋 Found ${keys.length} rate limit keys`)

        const result = await redis.del(...keys)

        console.log(`✅ Cleared ${result} rate limit keys`)
        console.log('🎉 Rate limits have been reset!')

        await redis.quit()
    } catch (error) {
        console.error('❌ Error clearing rate limits:', error)
        await redis.quit()
        process.exit(1)
    }
}

clearRateLimits()
