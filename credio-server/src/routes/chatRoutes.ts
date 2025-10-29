import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as chatController from '../controllers/chatController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

router.use(authenticate)

// POST /api/chat/message - Send message to AI
router.post(
  '/message',
  rateLimiter({ windowMs: 60 * 1000, max: 30 }), // 30 messages per minute
  [body('sessionId').isString(), body('message').isString().isLength({ min: 1, max: 2000 })],
  validate,
  chatController.sendMessage
)

// POST /api/chat/message/stream - Stream AI response
router.post(
  '/message/stream',
  rateLimiter({ windowMs: 60 * 1000, max: 20 }),
  [body('sessionId').isString(), body('message').isString().isLength({ min: 1, max: 2000 })],
  validate,
  chatController.streamMessage
)

// GET /api/chat/sessions/:id - Get chat history
router.get(
  '/sessions/:id',
  [param('id').isUUID(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  chatController.getChatHistory
)

// GET /api/chat/sessions - Get user's chat sessions
router.get('/sessions', chatController.getUserChatSessions)

// POST /api/chat/sessions - Create new chat session
router.post(
  '/sessions',
  [body('title').optional().isString().isLength({ max: 100 })],
  validate,
  chatController.createChatSession
)

// PATCH /api/chat/sessions/:id - Update session title
router.patch(
  '/sessions/:id',
  [param('id').isUUID(), body('title').isString().isLength({ max: 100 })],
  validate,
  chatController.updateChatSession
)

// DELETE /api/chat/sessions/:id - Delete chat session
router.delete('/sessions/:id', [param('id').isUUID()], validate, chatController.deleteChatSession)

export default router
