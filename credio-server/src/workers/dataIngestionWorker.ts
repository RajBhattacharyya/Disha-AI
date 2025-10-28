import Queue from "bull"
import { DataIngestionService } from "../services/dataIngestion"
const redisUrl = process.env.REDIS_URL
const disasterDataQueue = redisUrl ? new Queue("disaster-data", redisUrl) : new Queue("disaster-data")
const dataIngestion = new DataIngestionService()

disasterDataQueue.process("fetch-weather", async (job) => await dataIngestion.ingestFromSource("noaa"))
disasterDataQueue.process("fetch-earthquakes", async (job) => await dataIngestion.ingestFromSource("usgs"))
disasterDataQueue.process("fetch-fires", async (job) => await dataIngestion.ingestFromSource("nasaFirms"))
disasterDataQueue.process("cleanup-old-data", async (job) => {/* cleanupService.archiveOldDisasters() */})

disasterDataQueue.add("fetch-weather", {}, { repeat: { cron: "0 * * * *" } })      // Hourly
disasterDataQueue.add("fetch-earthquakes", {}, { repeat: { cron: "*/5 * * * *" } })// 5 min
disasterDataQueue.add("fetch-fires", {}, { repeat: { cron: "0 0 * * *" } })        // Daily
disasterDataQueue.add("cleanup-old-data", {}, { repeat: { cron: "0 0 * * 0" } })   // Weekly
