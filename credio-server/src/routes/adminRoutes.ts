import { Router } from 'express'
import * as adminController from '../controllers/adminController'
import { authenticate, authorize } from '../middleware/auth'
import { body, query, param } from 'express-validator'
import { validate } from '../middleware/validation'

const router = Router()

// All admin routes require ADMIN role
router.use(authenticate)
router.use(authorize('ADMIN'))

// ==================== DASHBOARD ====================
router.get('/stats', adminController.getDashboardStats)

// ==================== SOS MANAGEMENT ====================
router.get(
  '/sos',
  [
    query('status').optional().isIn(['PENDING', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('emergencyType').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  adminController.getAllSOSRequests
)

router.get('/sos/:id', [param('id').isUUID()], validate, adminController.getSOSDetails)

router.patch(
  '/sos/:id/assign',
  [param('id').isUUID(), body('responderId').isUUID()],
  validate,
  adminController.assignResponder
)

router.patch(
  '/sos/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['PENDING', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    body('notes').optional().isString(),
  ],
  validate,
  adminController.updateSOSStatusAdmin
)

// ==================== DISASTER MANAGEMENT ====================
router.get(
  '/disasters',
  [
    query('status').optional().isIn(['ACTIVE', 'MONITORING', 'RESOLVED']),
    query('type').optional().isString(),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  ],
  validate,
  adminController.getAllDisasters
)

router.post(
  '/disasters',
  [
    body('type').isString(),
    body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('title').isString(),
    body('description').isString(),
    body('location').isObject(),
    body('location.latitude').isFloat(),
    body('location.longitude').isFloat(),
    body('location.address').isString(),
    body('location.radius').optional().isInt({ min: 1 }),
  ],
  validate,
  adminController.createDisaster
)

router.get('/disasters/:id', [param('id').isUUID()], validate, adminController.getDisasterDetails)

router.patch(
  '/disasters/:id',
  [
    param('id').isUUID(),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['ACTIVE', 'MONITORING', 'RESOLVED']),
    body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  ],
  validate,
  adminController.updateDisaster
)

router.delete('/disasters/:id', [param('id').isUUID()], validate, adminController.deleteDisaster)

// ==================== USER MANAGEMENT ====================
router.get(
  '/users',
  [
    query('role').optional().isIn(['USER', 'RESPONDER', 'ADMIN']),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  adminController.getAllUsers
)

router.get('/users/:id', [param('id').isUUID()], validate, adminController.getUserDetails)

router.patch(
  '/users/:id',
  [
    param('id').isUUID(),
    body('name').optional().isString(),
    body('email').optional().isEmail(),
    body('phoneNumber').optional().isString(),
  ],
  validate,
  adminController.updateUserInfo
)

router.patch(
  '/users/:id/role',
  [param('id').isUUID(), body('role').isIn(['USER', 'RESPONDER', 'ADMIN'])],
  validate,
  adminController.updateUserRole
)

router.patch(
  '/users/:id/ban',
  [param('id').isUUID(), body('isBanned').isBoolean(), body('reason').optional().isString()],
  validate,
  adminController.banUser
)

// ==================== ALERT MANAGEMENT ====================
router.get('/alerts', adminController.getAllAlerts)

router.post(
  '/alerts/broadcast',
  [
    body('alertType').isIn(['WARNING', 'EVACUATION', 'UPDATE', 'ALL_CLEAR']),
    body('message').isString(),
    body('disasterId').optional().isUUID(),
    body('targetRegion').optional().isObject(),
  ],
  validate,
  adminController.broadcastAlert
)

// ==================== RESOURCE MANAGEMENT ====================
router.post(
  '/resources',
  [
    body('name').isString(),
    body('type').isString(),
    body('location').isObject(),
    body('contactPhone').isString(),
    body('availability').isIn(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
  ],
  validate,
  adminController.createResource
)

router.patch('/resources/:id', [param('id').isUUID()], validate, adminController.updateResource)

router.delete('/resources/:id', [param('id').isUUID()], validate, adminController.deleteResource)

// ==================== ANALYTICS ====================
router.get(
  '/analytics/overview',
  [query('range').optional().isIn(['7d', '30d', '90d', '1y'])],
  validate,
  adminController.getAnalyticsOverview
)

router.get(
  '/analytics/disasters',
  [query('range').optional().isIn(['7d', '30d', '90d', '1y'])],
  validate,
  adminController.getDisasterAnalytics
)

router.get(
  '/analytics/sos',
  [query('range').optional().isIn(['7d', '30d', '90d', '1y'])],
  validate,
  adminController.getSOSAnalytics
)

export default router
