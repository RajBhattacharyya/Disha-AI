import { logger } from "../../utils/logger"

export async function fetchSimulatedFeed() {
  return fetchWithRetry("simulated://feed")
}

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Simulate network delay and random failure
      await new Promise(res => setTimeout(res, 500))
      if (Math.random() < 0.2) throw new Error("Simulated transient error")

      return {
        timestamp: new Date().toISOString(),
        data: [
          { id: 1, type: "simulation", message: "Test event A" },
          { id: 2, type: "simulation", message: "Test event B" },
        ],
      }
    } catch (error) {
      logger.error({ source: "SimulatedFeed", url, error, retry: i })
      if (i === maxRetries - 1) throw error
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000))
    }
  }
}
