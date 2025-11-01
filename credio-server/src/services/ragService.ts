import OpenAI from "openai"
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
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
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

      // Step 1: Load chat history for context (get fresh data)
      const chatHistory = await this.loadChatHistory(sessionId)

      // Step 2: Detect query intent
      const intent = await this.detectIntent(query)
      logger.info("Intent detected", { intent })

      // Step 3: Retrieve relevant context from multiple sources
      const context = await this.retrieveContext(query, userId, intent)

      // Step 4: Generate response using Gemini with current history
      const response = await this.generateResponse(query, context, chatHistory)

      // Step 5: Save both user message and assistant response atomically
      await this.saveConversation(sessionId, query, response, context.sources)

      logger.info("Query processed successfully", { sessionId })

      return {
        response,
        context: context.sources,
        intent,
        sessionId,
      }
    } catch (error: any) {
      logger.error("Query processing failed - Full error details:", {
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
        userId,
        query: query.substring(0, 100)
      })
      return {
        response: this.getFallbackResponse(query),
        context: [],
        intent: "GENERAL_QUESTION",
        sessionId,
      }
    }
  }

  // Detect user intent using OpenAI
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
      const result = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: intentPrompt }],
        temperature: 0.3,
        max_tokens: 50,
      })
      const intent = result.choices[0].message.content?.trim() || "GENERAL_QUESTION"
      logger.info("Intent detected", { query: query.substring(0, 50), intent })
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

      const result = {
        documents: relevantDocs,
        disasters: nearbyDisasters,
        resources: emergencyResources,
        alerts: recentAlerts,
        userLocation: user.location,
        sources: [...new Set(relevantDocs.map((d) => d.metadata.source))],
      }

      logger.info("Context retrieved", {
        docsCount: relevantDocs.length,
        disastersCount: nearbyDisasters.length,
        resourcesCount: emergencyResources.length,
        alertsCount: recentAlerts.length,
      })

      return result
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

  // Generate response using OpenAI with full context
  private async generateResponse(
    query: string,
    context: RAGContext,
    chatHistory: ChatMessage[]
  ): Promise<string> {
    const prompt = this.buildPrompt(query, context, chatHistory)

    try {
      logger.info("Generating response for query", { queryPreview: query.substring(0, 50) })

      const result = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      })

      const response = result.choices[0].message.content || ""
      logger.info("Response generated successfully", {
        responseLength: response.length,
        queryPreview: query.substring(0, 50)
      })

      return response
    } catch (error: any) {
      logger.error("Response generation FAILED - Details:", {
        errorMessage: error?.message || 'Unknown error',
        errorName: error?.name,
        query: query.substring(0, 100),
        hasApiKey: !!process.env.OPENAI_API_KEY
      })
      // Re-throw to trigger fallback in processQuery
      throw error
    }
  }

  // Build comprehensive prompt with all context
  private buildPrompt(
    query: string,
    context: RAGContext,
    history: ChatMessage[]
  ): string {
    const historyText = history.length > 0
      ? history
        .slice(-6)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")
      : "No previous conversation"

    const knowledgeText = context.documents.length > 0
      ? context.documents
        .map(
          (doc, i) =>
            `[${i + 1}] ${doc.content}\n(Source: ${doc.metadata.source}, Relevance: ${doc.score.toFixed(2)})`
        )
        .join("\n\n")
      : "No specific knowledge documents found"

    const disastersText = context.disasters.length > 0
      ? context.disasters
        .map(
          (d) => `
- ${d.type}: ${d.title}
  Severity: ${d.severity}
  Status: ${d.status}
  Location: ${JSON.stringify(d.location)}
`
        )
        .join("\n")
      : "No active disasters nearby"

    const resourcesText = context.resources.length > 0
      ? context.resources
        .map(
          (r) => `
- ${r.name} (${r.type})
  Contact: ${r.contactPhone}
  Availability: ${r.availability}
`
        )
        .join("\n")
      : "No emergency resources found nearby"

    const alertsText = context.alerts.length > 0
      ? context.alerts.map((a) => `- ${a.alertType}: ${a.message}`).join("\n")
      : "No recent alerts"

    const prompt = `
CONVERSATION HISTORY:
${historyText}

RETRIEVED KNOWLEDGE:
${knowledgeText}

ACTIVE DISASTERS NEARBY:
${disastersText}

EMERGENCY RESOURCES NEARBY:
${resourcesText}

RECENT ALERTS:
${alertsText}

USER LOCATION: ${JSON.stringify(context.userLocation)}

USER QUERY: ${query}

INSTRUCTIONS:
- Provide accurate, actionable disaster safety guidance SPECIFIC to the user's query
- Answer the EXACT question asked - different questions should get different answers
- If immediate danger detected, start with "⚠️ URGENT:" and give critical actions first
- Reference the retrieved knowledge and cite sources in brackets like [1], [2]
- Mention relevant nearby resources and disasters
- Be empathetic but direct and clear
- Use simple language suitable for emergencies
- Include specific action steps numbered or bulleted
- If you don't have enough information, ask clarifying questions
- For non-urgent queries, provide comprehensive guidance

IMPORTANT: Your response must directly address the specific question: "${query}"

RESPONSE:
    `.trim()

    logger.info("Prompt built", {
      queryLength: query.length,
      historyLength: history.length,
      docsCount: context.documents.length,
      promptLength: prompt.length,
    })

    return prompt
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
- Suggest contacting emergency services (100, etc.) when appropriate
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

  // Save complete conversation atomically
  private async saveConversation(
    sessionId: string,
    userMessage: string,
    assistantResponse: string,
    sources: string[]
  ): Promise<void> {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        logger.warn("Session not found, cannot save conversation", { sessionId })
        return
      }

      const messages = (session.messages as any[]) || []
      const timestamp = new Date()

      // Add both messages atomically
      messages.push(
        { role: "user", content: userMessage, timestamp },
        { role: "assistant", content: assistantResponse, timestamp }
      )

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          messages,
          context: sources,
          updatedAt: timestamp,
        },
      })

      logger.info("Conversation saved", { sessionId, messageCount: messages.length })
    } catch (error) {
      logger.error("Failed to save conversation", { error, sessionId })
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
🚨 Call 100 (or your local emergency number) immediately
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
