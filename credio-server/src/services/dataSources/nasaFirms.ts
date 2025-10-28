import { limiter } from "../../utils/apiLimiter"
import { logger } from "../../utils/logger"

export async function fetchNASAFIRMSData(filters = {}) {
  const url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_C6_Global_24h.csv"
  return limiter.schedule(() => fetchWithRetry(url))
}

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.text() // FIRMS often returns CSV
    } catch (error) {
      logger.error({ source: "NASA FIRMS", url, error, retry: i })
      if (i === maxRetries - 1) throw error
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000))
    }
  }
}
