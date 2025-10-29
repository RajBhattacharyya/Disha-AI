import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../prismaClient'
import { ragService } from '../services/ragService'
import { logger } from '../utils/logger'

// Send message to AI
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sessionId, message } = req.body
    const userId = req.user!.userId

    // Validate or create session
    let session
    if (sessionId === 'new') {
      session = await prisma.chatSession.create({
        data: {
          userId,
          messages: [],
          context: {},
          language: 'en',
          isActive: true,
          sessionMetadata: {},
        },
      })
    } else {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })

      if (!session || session.userId !== userId || !session.isActive) {
        return res.status(404).json({
          success: false,
          error: { message: 'Session not found or access denied' },
        })
      }
    }

    // Process query with RAG (this already saves messages to DB)
    const result = await ragService.processQuery(userId, message, session.id)

    logger.info('Chat message processed', { userId, sessionId: session.id })

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        response: result.response,
        context: result.context,
        intent: result.intent,
      },
    })
  } catch (error) {
    logger.error('Chat message error:', error)
    next(error)
  }
}

// Stream message response
export async function streamMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sessionId, message } = req.body
    const userId = req.user!.userId

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

    // Validate session
    let session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.userId !== userId || !session.isActive) {
      res.write(`data: ${JSON.stringify({ error: 'Session not found or access denied' })}\n\n`)
      return res.end()
    }

    // Send initial status
    res.write(`data: ${JSON.stringify({ status: 'processing' })}\n\n`)

    // Detect intent
    const intent = await ragService['detectIntent'](message)

    // Retrieve context
    const context = await ragService['retrieveContext'](message, userId, intent)

    // Stream response from OpenAI
    let fullResponse = ''

    const chatHistory = session.messages as any[]

    // Import streaming capability
    const OpenAI = await import('openai')
    const openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    const prompt = ragService['buildPrompt'](message, context, chatHistory)

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ragService['getSystemPrompt']() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      if (text) {
        fullResponse += text
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`)
      }
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ status: 'complete', intent, context: context.sources })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()

    // Save complete conversation to database
    const updatedMessages = [
      ...chatHistory,
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: fullResponse, timestamp: new Date() },
    ]

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        messages: updatedMessages,
        context: context.sources,
        updatedAt: new Date(),
      },
    })

    logger.info('Streaming message completed', { userId, sessionId })
  } catch (error) {
    logger.error('Stream message error:', error)
    res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
    res.end()
  }
}

// Get chat history
export async function getChatHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { limit = 50 } = req.query
    const userId = req.user!.userId

    const session = await prisma.chatSession.findUnique({
      where: { id },
    })

    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' },
      })
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const allMessages = session.messages as any[]
    const messages = allMessages.slice(-Number(limit))

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        title: session.title,
        messages,
        language: session.language,
        totalMessages: allMessages.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get user's chat sessions
export async function getUserChatSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: true,
        language: true,
      },
    })

    // Add preview (last message) to each session
    const sessionsWithPreview = sessions.map((session) => {
      const messages = session.messages as any[]
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null

      return {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        language: session.language,
        preview: lastMessage?.content?.slice(0, 100) || 'No messages',
        messageCount: messages.length,
      }
    })

    res.json({
      success: true,
      data: { sessions: sessionsWithPreview },
    })
  } catch (error) {
    next(error)
  }
}

// Create new chat session
export async function createChatSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { title } = req.body

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || `Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        context: {},
        language: 'en',
        isActive: true,
        sessionMetadata: {},
      },
    })

    logger.info('Chat session created', { userId, sessionId: session.id })

    res.status(201).json({
      success: true,
      data: { session },
    })
  } catch (error) {
    next(error)
  }
}

// Update chat session
export async function updateChatSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { title } = req.body
    const userId = req.user!.userId

    const session = await prisma.chatSession.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' },
      })
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    const updated = await prisma.chatSession.update({
      where: { id },
      data: { title },
    })

    res.json({
      success: true,
      data: { session: updated },
    })
  } catch (error) {
    next(error)
  }
}

// Delete chat session
export async function deleteChatSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const session = await prisma.chatSession.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' },
      })
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      })
    }

    // Soft delete by marking inactive
    await prisma.chatSession.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Chat session deleted', { userId, sessionId: id })

    res.json({
      success: true,
      data: { message: 'Session deleted' },
    })
  } catch (error) {
    next(error)
  }
}
