import { Request, Response } from "express"
import { ragService } from "../services/ragService"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { logger } from "../utils/logger"
import prisma from "../prismaClient"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Standard chat endpoint
export async function handleChat(req: Request, res: Response) {
  const { query, sessionId, userId } = req.body

  try {
    const response = await ragService.processQuery(userId, query, sessionId)
    res.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error("Chat request failed", { error: errorMessage })
    res.status(500).json({ error: "Failed to process chat request" })
  }
}

// Streaming chat endpoint for real-time responses
export async function streamChatResponse(req: Request, res: Response) {
  const { query, sessionId, userId } = req.body

  // Set headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    logger.info("Starting streaming response", { userId, query })

    // Retrieve context (non-streaming part)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const intent = await ragService["detectIntent"](query)
    const context = await ragService["retrieveContext"](query, userId, intent)
    const chatHistory = await ragService["loadChatHistory"](sessionId)

    // Build prompt
    const prompt = ragService["buildPrompt"](query, context, chatHistory)

    // Create streaming model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: ragService["getSystemPrompt"](),
    })

    // Stream response from Gemini
    const result = await model.generateContentStream(prompt)

    let fullResponse = ""

    for await (const chunk of result.stream) {
      const text = chunk.text()
      fullResponse += text
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`)
    }

    // Send completion signal
    res.write(`data: [DONE]\n\n`)
    res.end()

    // Save complete response to database
    await ragService["saveChatMessage"](sessionId, {
      role: "user",
      content: query,
      timestamp: new Date(),
    })
    await ragService["saveChatMessage"](sessionId, {
      role: "assistant",
      content: fullResponse,
      timestamp: new Date(),
    })

    logger.info("Streaming completed", { sessionId })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error("Streaming failed", { error: errorMessage })
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
    res.end()
  }
}
