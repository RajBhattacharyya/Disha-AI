import { Router } from 'express'
import { query, param } from 'express-validator'
import * as disasterController from '../controllers/disasterController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

// All disaster routes require authentication
router.use(authenticate)

// GET /api/disasters - Get all disasters with filters
router.get(
  '/',
  rateLimiter({ windowMs: 60 * 1000, max: 60 }), // 60 requests per minute
  [
    query('status').optional().isIn(['ACTIVE', 'RESOLVED', 'MONITORING']),
    query('type').optional().isString(),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  disasterController.getDisasters
)

// GET /api/disasters/nearby - Get nearby disasters
router.get(
  '/nearby',
  [
    query('latitude').isFloat({ min: -90, max: 90 }).toFloat(),
    query('longitude').isFloat({ min: -180, max: 180 }).toFloat(),
    query('radius').optional().isInt({ min: 1, max: 500 }).toInt(),
  ],
  validate,
  disasterController.getNearbyDisasters
)

// GET /api/disasters/risk-assessment - Get user risk assessment
router.get(
  '/risk-assessment',
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  disasterController.getUserRiskAssessment
)

// GET /api/disasters/:id - Get disaster by ID
router.get('/:id', [param('id').isUUID()], validate, disasterController.getDisasterById)

// GET /api/disasters/:id/guidance - Get AI-generated guidance for disaster
router.get(
  '/:id/guidance',
  rateLimiter({ windowMs: 60 * 1000, max: 20 }),
  [param('id').isUUID()],
  validate,
  disasterController.getDisasterGuidance
)

// GET /api/disasters/:id/resources - Get nearby resources for disaster
router.get(
  '/:id/resources',
  [param('id').isUUID()],
  validate,
  disasterController.getDisasterResources
)

export default router
