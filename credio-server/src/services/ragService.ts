import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "../prismaClient"
import { vectorStore } from "./vectorStore"
import { logger } from "../utils/logger"
import { DataCategory } from "@prisma/client"
import {
  QueryIntent,
  ChatMessage,
  RAGContext,
  ChatResponse,
} from "../types/chat.types"

export class RAGService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: this.getSystemPrompt(),
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent safety advice
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    })
  }

  // Main query processing pipeline
  async processQuery(
    userId: string,
    query: string,
    sessionId: string
  ): Promise<ChatResponse> {
    try {
      logger.info("Processing query", { userId, query, sessionId })

      // Step 1: Load chat history for context
      const chatHistory = await this.loadChatHistory(sessionId)

      // Step 2: Detect query intent
      const intent = await this.detectIntent(query)
      logger.info("Intent detected", { intent })

      // Step 3: Retrieve relevant context from multiple sources
      const context = await this.retrieveContext(query, userId, intent)

      // Step 4: Generate response using Gemini
      const response = await this.generateResponse(query, context, chatHistory)

      // Step 5: Save conversation to database
      await this.saveChatMessage(sessionId, {
        role: "user",
        content: query,
        timestamp: new Date(),
      })
      await this.saveChatMessage(sessionId, {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      })

      logger.info("Query processed successfully", { sessionId })

      return {
        response,
        context: context.sources,
        intent,
        sessionId,
      }
    } catch (error) {
      logger.error("Query processing failed", { error, userId, query })
      return {
        response: this.getFallbackResponse(query),
        context: [],
        intent: "GENERAL_QUESTION",
        sessionId,
      }
    }
  }

  // Detect user intent using Gemini
  private async detectIntent(query: string): Promise<QueryIntent> {
    const intentPrompt = `
Analyze this disaster-related query and classify the intent:

Query: "${query}"

Possible intents:
- SEEKING_ADVICE: User wants safety guidance or protocols
- REPORTING_EMERGENCY: User is in immediate danger
- REQUESTING_INFO: User wants information about specific disaster
- FINDING_RESOURCES: User needs shelter, supplies, or contacts
- GENERAL_QUESTION: General disaster preparedness question

Respond with ONLY the intent category, nothing else.
    `.trim()

    try {
      const result = await this.model.generateContent(intentPrompt)
      const intent = result.response.text().trim()
      return intent as QueryIntent
    } catch (error) {
      logger.error("Intent detection failed", { error, query })
      return "GENERAL_QUESTION"
    }
  }

  // Retrieve context from multiple sources
  private async retrieveContext(
    query: string,
    userId: string,
    intent: QueryIntent
  ): Promise<RAGContext> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } })

      if (!user) {
        throw new Error("User not found")
      }

      // 1. Vector search for relevant documents
      const relevantDocs = await vectorStore.searchSimilar(query, 5, {
        category: this.getCategoryForIntent(intent),
      })

      // 2. Get active disasters near user
      const nearbyDisasters = await prisma.disasterEvent.findMany({
        where: {
          status: "ACTIVE",
          // Filter by location proximity (simplified - use PostGIS in production)
        },
        take: 3,
        orderBy: { severity: "desc" },
      })

      // 3. Find emergency resources
      const emergencyResources = await prisma.emergencyResource.findMany({
        where: {
          availability: { in: ["AVAILABLE", "LIMITED"] },
          // Filter by location proximity
        },
        take: 5,
      })

      // 4. Get user's recent alert history
      const recentAlerts = await prisma.alert.findMany({
        where: {
          userId,
          sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
        },
        take: 3,
        orderBy: { sentAt: "desc" },
      })

      return {
        documents: relevantDocs,
        disasters: nearbyDisasters,
        resources: emergencyResources,
        alerts: recentAlerts,
        userLocation: user.location,
        sources: [...new Set(relevantDocs.map((d) => d.metadata.source))],
      }
    } catch (error) {
      logger.error("Context retrieval failed", { error, userId })
      return {
        documents: [],
        disasters: [],
        resources: [],
        alerts: [],
        userLocation: {},
        sources: [],
      }
    }
  }

  // Generate response using Gemini with full context
  private async generateResponse(
    query: string,
    context: RAGContext,
    chatHistory: ChatMessage[]
  ): Promise<string> {
    const prompt = this.buildPrompt(query, context, chatHistory)

    try {
      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      logger.error("Response generation failed", { error, query })
      return this.getFallbackResponse(query)
    }
  }

  // Build comprehensive prompt with all context
  private buildPrompt(
    query: string,
    context: RAGContext,
    history: ChatMessage[]
  ): string {
    return `
CONVERSATION HISTORY:
${history
        .slice(-6)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")}

RETRIEVED KNOWLEDGE:
${context.documents
        .map(
          (doc, i) =>
            `[${i + 1}] ${doc.content}\n(Source: ${doc.metadata.source}, Relevance: ${doc.score.toFixed(2)})`
        )
        .join("\n\n")}

ACTIVE DISASTERS NEARBY:
${context.disasters
        .map(
          (d) => `
- ${d.type}: ${d.title}
  Severity: ${d.severity}
  Status: ${d.status}
  Location: ${JSON.stringify(d.location)}
`
        )
        .join("\n")}

EMERGENCY RESOURCES NEARBY:
${context.resources
        .map(
          (r) => `
- ${r.name} (${r.type})
  Contact: ${r.contactPhone}
  Availability: ${r.availability}
`
        )
        .join("\n")}

RECENT ALERTS:
${context.alerts.map((a) => `- ${a.alertType}: ${a.message}`).join("\n")}

USER LOCATION: ${JSON.stringify(context.userLocation)}

USER QUERY: ${query}

INSTRUCTIONS:
- Provide accurate, actionable disaster safety guidance
- If immediate danger detected, start with "⚠️ URGENT:" and give critical actions first
- Reference the retrieved knowledge and cite sources in brackets like [1], [2]
- Mention relevant nearby resources and disasters
- Be empathetic but direct and clear
- Use simple language suitable for emergencies
- Include specific action steps numbered or bulleted
- If you don't have enough information, ask clarifying questions
- For non-urgent queries, provide comprehensive guidance

RESPONSE:
    `.trim()
  }

  // System prompt for Gemini model
  private getSystemPrompt(): string {
    return `
You are Credio, an AI disaster response assistant. Your primary role is to save lives by providing accurate, actionable emergency guidance.

Core Principles:
- Safety first: Always prioritize user safety in recommendations
- Clarity: Use simple, direct language suitable for stressful situations
- Empathy: Be calm and reassuring while being honest about risks
- Action-oriented: Provide specific, numbered steps
- Context-aware: Consider user location and active disasters
- Source-based: Ground responses in provided context

Response Guidelines:
- For life-threatening situations: Start with ⚠️ URGENT and give critical actions immediately
- For evacuation: Provide clear routes and shelter locations
- For medical: Give first aid steps and emphasize seeking professional help
- For resources: Share specific nearby options with contact info
- For preparedness: Offer comprehensive checklists

Never:
- Provide medical diagnoses (only first aid)
- Guarantee outcomes or safety
- Contradict official emergency guidance
- Make light of serious situations
- Provide information you're not confident about

Always:
- Cite sources using brackets [1], [2], etc.
- Suggest contacting emergency services (911, etc.) when appropriate
- Remind users to follow official evacuation orders
- Encourage emergency kit preparation
    `.trim()
  }

  // Map intent to knowledge category
  private getCategoryForIntent(intent: QueryIntent): DataCategory | undefined {
    const mapping: Record<QueryIntent, DataCategory> = {
      SEEKING_ADVICE: DataCategory.PROTOCOL,
      REPORTING_EMERGENCY: DataCategory.GUIDANCE,
      REQUESTING_INFO: DataCategory.HISTORICAL,
      FINDING_RESOURCES: DataCategory.GUIDANCE,
      GENERAL_QUESTION: DataCategory.PROTOCOL,
    }
    return mapping[intent]
  }

  // Load chat history from database
  private async loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        return []
      }

      return (session.messages as any[]).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }))
    } catch (error) {
      logger.error("Failed to load chat history", { error, sessionId })
      return []
    }
  }

  // Save chat message to database
  private async saveChatMessage(
    sessionId: string,
    message: ChatMessage
  ): Promise<void> {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        logger.warn("Session not found, cannot save message", { sessionId })
        return
      }

      const messages = (session.messages as any[]) || []
      messages.push(message)

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          messages,
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      logger.error("Failed to save chat message", { error, sessionId })
    }
  }

  // Fallback response for errors
  private getFallbackResponse(query: string): string {
    return `
I apologize, but I'm experiencing technical difficulties processing your request.

If this is an emergency:
🚨 Call 911 (or your local emergency number) immediately
🚨 Evacuate if in immediate danger
🚨 Move to higher ground for floods, or sturdy shelter for storms

For non-urgent questions, please try again in a moment or visit ready.gov for official disaster preparedness guidance.

Stay safe!
    `.trim()
  }

  // Calculate distance between two locations (simplified Haversine)
  private calculateDistance(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}

export const ragService = new RAGService()
