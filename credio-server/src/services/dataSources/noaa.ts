import { limiter } from "../../utils/apiLimiter"
import { logger } from "../../utils/logger"

export async function fetchNOAAAlerts(filters = {}) {
  const url = "https://api.weather.gov/alerts"
  return limiter.schedule(() => fetchWithRetry(url))
}

// Retry logic (used across all sources)
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch (error) {
      logger.error({ url, error, retry: i })
      if (i === maxRetries - 1) throw error
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000))
    }
  }
}
