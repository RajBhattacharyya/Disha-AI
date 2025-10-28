import Redis from "ioredis"
import crypto from "crypto"
import { SearchResult } from "./vectorStore"

export class EmbeddingCache {
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }

  // Cache embedding with 24-hour TTL
  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = `embedding:${this.hashText(text)}`
    await this.redis.setex(key, 3600 * 24, JSON.stringify(embedding))
  }

  // Retrieve cached embedding
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = `embedding:${this.hashText(text)}`
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  // Cache search results with 30-minute TTL
  async cacheSearchResults(
    query: string,
    results: SearchResult[]
  ): Promise<void> {
    const key = `search:${this.hashText(query)}`
    await this.redis.setex(key, 1800, JSON.stringify(results))
  }

  // Retrieve cached search results
  async getCachedSearchResults(query: string): Promise<SearchResult[] | null> {
    const key = `search:${this.hashText(query)}`
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  // Generate SHA-256 hash of text for cache keys
  private hashText(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex")
  }

  // Clear all caches (useful for testing or maintenance)
  async clearAll(): Promise<void> {
    const keys = await this.redis.keys("embedding:*")
    const searchKeys = await this.redis.keys("search:*")
    if (keys.length > 0) await this.redis.del(...keys)
    if (searchKeys.length > 0) await this.redis.del(...searchKeys)
  }
}

export const embeddingCache = new EmbeddingCache()
