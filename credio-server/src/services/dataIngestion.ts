import { fetchNOAAAlerts } from "./dataSources/noaa"
import { z } from "zod"
import { prisma } from "../prismaClient"
import { logger } from "../utils/logger"

const disasterSchema = z.object({
  type: z.string(),
  severity: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().optional(),
    affectedAreas: z.array(z.string()).optional(),
  }),
  // ... relevant fields
})

export class DataIngestionService {
  async fetchDisasterData(source: string, filters: any): Promise<any[]> {
    switch (source) {
      case "noaa":
        return await fetchNOAAAlerts(filters)
      // ... Similarly for other sources
    }
    throw new Error(`Unknown source: ${source}`)
  }

  async validateData(rawData: unknown[]): Promise<any[]> {
    return rawData.map(d => disasterSchema.parse(d))
  }

  async cleanData(data: any[]): Promise<any[]> {
    // Handle missing values, normalize, remove duplicates, standardize location
    // Pseudocode:
    // 1. Remove null/undefined values, normalize date formats
    // 2. Remove duplicates based on unique identifiers
    // 3. Standardize lat/long as numbers, address strings
    return data.filter((item, idx, arr) => arr.findIndex(i => i.id === item.id) === idx)
  }

  async storeRawData(data: any[]): Promise<any[]> {
    // Use Prisma transactions
    const result = await prisma.$transaction(
      data.map(d => prisma.disasterEvent.create({ data: d }))
    )
    return result
  }

  async ingestFromSource(source: string): Promise<any> {
    try {
      logger.info({ message: "Ingesting from source", source })
      const raw = await this.fetchDisasterData(source, {})
      const validated = await this.validateData(raw)
      const cleaned = await this.cleanData(validated)
      const stored = await this.storeRawData(cleaned)
      logger.info({ message: "Ingestion succeeded", source, count: stored.length })
      return { success: true, count: stored.length }
    } catch (error) {
      logger.error({ message: "Ingestion failed", source, error })
      return { success: false, error }
    }
  }
}
