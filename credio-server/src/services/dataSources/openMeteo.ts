import { limiter } from "../../utils/apiLimiter"
import { logger } from "../../utils/logger"

export async function fetchOpenMeteoData(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m`
  return limiter.schedule(() => fetchWithRetry(url))
}

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch (error) {
      logger.error({ source: "OpenMeteo", url, error, retry: i })
      if (i === maxRetries - 1) throw error
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000))
    }
  }
}
