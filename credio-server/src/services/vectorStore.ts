import { prisma } from "../prismaClient"
import { embeddingService } from "./embeddingService"
import { embeddingCache } from "./embeddingCache"
import { logger } from "../utils/logger"
import { DataCategory } from "@prisma/client"

export interface Document {
    id: string
    content: string
    metadata: any
    category: DataCategory
    source: string
    language?: string
}

export interface SearchResult {
    id: string
    content: string
    metadata: any
    score: number
}

export class VectorStore {
    // Index a single document with its embedding
    async indexDocument(
        id: string,
        content: string,
        metadata: object
    ): Promise<void> {
        try {
            // Check cache first
            let embedding = await embeddingCache.getCachedEmbedding(content)

            if (!embedding) {
                embedding = await embeddingService.generateEmbedding(content)
                await embeddingCache.cacheEmbedding(content, embedding)
            }

            // Convert embedding array to Buffer for Bytes storage
            const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer)

            await prisma.disasterData.create({
                data: {
                    id,
                    content,
                    embedding: embeddingBuffer,
                    metadata: metadata as any,
                    category: (metadata as any).category as DataCategory,
                    source: (metadata as any).source,
                    language: (metadata as any).language || "en",
                },
            })

            logger.info("Document indexed successfully", { id })
        } catch (error) {
            logger.error("Document indexing failed", { id, error })
            throw error
        }
    }

    // Search for similar documents
    async searchSimilar(
        query: string,
        topK: number = 5,
        filters?: { category?: DataCategory; source?: string; language?: string }
    ): Promise<SearchResult[]> {
        try {
            // Check cache first
            const cachedResults = await embeddingCache.getCachedSearchResults(query)
            if (cachedResults) {
                logger.info("Search results from cache", { query })
                return cachedResults
            }

            // Generate query embedding
            const queryEmbedding = await embeddingService.generateEmbedding(query)

            // Fetch documents with optional filters
            const documents = await prisma.disasterData.findMany({
                where: {
                    ...(filters?.category && { category: filters.category }),
                    ...(filters?.source && { source: filters.source }),
                    ...(filters?.language && { language: filters.language }),
                },
            })

            // Calculate similarities
            const results = documents.map((doc) => {
                // Convert Buffer back to array
                let docEmbedding: number[] = []
                if (doc.embedding) {
                    const float32Array = new Float32Array(doc.embedding.buffer)
                    docEmbedding = Array.from(float32Array)
                }

                const similarity = embeddingService.calculateSimilarity(
                    queryEmbedding,
                    docEmbedding
                )

                return {
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata,
                    score: similarity,
                }
            })

            // Sort by similarity (descending) and return top K
            const topResults = results
                .sort((a, b) => b.score - a.score)
                .slice(0, topK)

            // Cache results
            await embeddingCache.cacheSearchResults(query, topResults)

            logger.info("Search completed", { query, resultsCount: topResults.length })
            return topResults
        } catch (error) {
            logger.error("Search failed", { query, error })
            throw error
        }
    }

    // Bulk index documents (efficient batch processing)
    async bulkIndex(documents: Document[]): Promise<void> {
        try {
            logger.info("Starting bulk indexing", { count: documents.length })

            const embeddings = await embeddingService.batchGenerateEmbeddings(
                documents.map((d) => d.content)
            )

            const data = documents.map((doc, idx) => {
                const embeddingBuffer = Buffer.from(new Float32Array(embeddings[idx]).buffer)
                return {
                    id: doc.id,
                    content: doc.content,
                    embedding: embeddingBuffer,
                    metadata: doc.metadata,
                    category: doc.category,
                    source: doc.source,
                    language: doc.language || "en",
                }
            })

            await prisma.disasterData.createMany({ data })
            logger.info("Bulk indexing completed", { count: data.length })
        } catch (error) {
            logger.error("Bulk indexing failed", { error })
            throw error
        }
    }

    // Update document embedding when content changes
    async updateDocument(id: string, newContent: string): Promise<void> {
        try {
            const embedding = await embeddingService.generateEmbedding(newContent)
            const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer)

            await prisma.disasterData.update({
                where: { id },
                data: {
                    content: newContent,
                    embedding: embeddingBuffer,
                },
            })
            logger.info("Document updated", { id })
        } catch (error) {
            logger.error("Document update failed", { id, error })
            throw error
        }
    }
}

export const vectorStore = new VectorStore()
