import { GoogleGenerativeAI } from "@google/generative-ai"
import { logger } from "../utils/logger"

export class EmbeddingService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" })
  }

  // Generate single embedding (768-dimensional vector)
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text)
      return result.embedding.values // 768-dimensional vector
    } catch (error) {
      logger.error("Embedding generation failed", { text, error })
      throw error
    }
  }

  // Batch generate embeddings (process in chunks to respect API limits)
  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = []
    const chunkSize = 100 // API limit for batch processing

    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize)
      const results = await Promise.all(
        chunk.map((text) => this.generateEmbedding(text))
      )
      embeddings.push(...results)

      // Rate limiting: wait 1 second between chunks
      if (i + chunkSize < texts.length) {
        await this.sleep(1000)
      }
    }

    return embeddings
  }

  // Calculate cosine similarity between two embeddings
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce(
      (sum, val, i) => sum + val * embedding2[i],
      0
    )
    const mag1 = Math.sqrt(
      embedding1.reduce((sum, val) => sum + val * val, 0)
    )
    const mag2 = Math.sqrt(
      embedding2.reduce((sum, val) => sum + val * val, 0)
    )
    return dotProduct / (mag1 * mag2)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const embeddingService = new EmbeddingService()
