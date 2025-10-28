import fs from "fs/promises"
import { logger } from "../../utils/logger"

export async function importCSV(filePath: string) {
  return fetchWithRetry(filePath)
}

async function fetchWithRetry(filePath: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const data = await fs.readFile(filePath, "utf-8")
      return data
    } catch (error) {
      logger.error({ source: "CSV Importer", filePath, error, retry: i })
      if (i === maxRetries - 1) throw error
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000))
    }
  }
}
