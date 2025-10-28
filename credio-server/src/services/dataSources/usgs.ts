import { limiter } from "../../utils/apiLimiter"
import { logger } from "../../utils/logger"

export async function fetchUSGSEarthquakes(filters = {}) {
  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
  return limiter.schedule(() => fetchWithRetry(url))
}

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch (error) {
      logger.error({ source: "USGS", url, error, retry: i })
      if (i === maxRetries - 1) throw error
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000))
    }
  }
}
