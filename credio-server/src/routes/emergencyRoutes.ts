import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as emergencyController from '../controllers/emergencyController'
import { authenticate, authorize } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

router.use(authenticate)

// POST /api/emergency/sos - Create SOS request
router.post(
    '/sos',
    rateLimiter({ windowMs: 60 * 1000, max: 5 }), // 5 SOS per minute (prevent abuse)
    [
        body('location').isObject(),
        body('location.latitude').isFloat({ min: -90, max: 90 }),
        body('location.longitude').isFloat({ min: -180, max: 180 }),
        body('location.address').isString(),
        body('emergencyType').isIn(['MEDICAL', 'FIRE', 'TRAPPED', 'INJURY', 'NATURAL_DISASTER', 'OTHER']),
        body('description').optional().isString().isLength({ max: 500 }),
        body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        body('mediaUrls').optional().isArray(),
    ],
    validate,
    emergencyController.createSOSRequest
)

// GET /api/emergency/sos/history - Get user's SOS history (must come before /sos/:id)
router.get('/sos/history', emergencyController.getUserSOSHistory)

// GET /api/emergency/sos/:id - Get SOS tracking info
router.get('/sos/:id', [param('id').isUUID()], validate, emergencyController.getSOSTracking)

// PATCH /api/emergency/sos/:id/assign - Assign responder to SOS
router.patch(
    '/sos/:id/assign',
    authorize('RESPONDER', 'ADMIN'),
    [param('id').isUUID()],
    validate,
    emergencyController.assignResponder
)

// PATCH /api/emergency/sos/:id - Update SOS status
router.patch(
    '/sos/:id',
    [
        param('id').isUUID(),
        body('status').isIn(['PENDING', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
        body('notes').optional().isString(),
    ],
    validate,
    emergencyController.updateSOSStatus
)

// PATCH /api/emergency/sos/:id/cancel - Cancel SOS
router.patch('/sos/:id/cancel', [param('id').isUUID()], validate, emergencyController.cancelSOS)

// GET /api/emergency/resources - Get emergency resources
router.get(
    '/resources',
    [
        query('latitude').isFloat({ min: -90, max: 90 }).toFloat(),
        query('longitude').isFloat({ min: -180, max: 180 }).toFloat(),
        query('radius').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('type').optional().isIn(['SHELTER', 'HOSPITAL', 'RESCUE_TEAM', 'FOOD', 'WATER', 'MEDICAL', 'POLICE', 'FIRE_STATION']),
        query('availability').optional().isIn(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
        query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    ],
    validate,
    emergencyController.getEmergencyResources
)

// GET /api/emergency/resources/:id - Get resource by ID
router.get('/resources/:id', [param('id').isUUID()], validate, emergencyController.getResourceById)

// POST /api/emergency/resources/:id/report - Report resource status
router.post(
    '/resources/:id/report',
    [
        param('id').isUUID(),
        body('availability').isIn(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
        body('notes').optional().isString().isLength({ max: 300 }),
    ],
    validate,
    emergencyController.reportResourceStatus
)

export default router
