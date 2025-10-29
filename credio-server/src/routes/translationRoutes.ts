import { Router } from 'express'
import { body } from 'express-validator'
import * as translationController from '../controllers/translationController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

router.use(authenticate)
router.use(rateLimiter({ windowMs: 60 * 1000, max: 100 }))

// POST /api/translate - Translate text
router.post(
  '/',
  [body('text').isString().isLength({ min: 1, max: 5000 }), body('targetLang').isString().isLength({ min: 2, max: 5 }), body('context').optional().isString()],
  validate,
  translationController.translateText
)

// POST /api/translate/detect - Detect language
router.post('/detect', [body('text').isString().isLength({ min: 1, max: 1000 })], validate, translationController.detectLanguage)

export default router
