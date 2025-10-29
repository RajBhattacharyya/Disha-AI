import { Router } from 'express'
import { query, param, body } from 'express-validator'
import * as alertController from '../controllers/alertController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'

const router = Router()

router.use(authenticate)

// GET /api/alerts - Get user alerts
router.get(
  '/',
  [
    query('isRead').optional().isBoolean().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  alertController.getAlerts
)

// GET /api/alerts/unread-count - Get unread alert count
router.get('/unread-count', alertController.getUnreadAlertCount)

// GET /api/alerts/:id - Get single alert
router.get('/:id', [param('id').isUUID()], validate, alertController.getAlertById)

// PATCH /api/alerts/:id/read - Mark alert as read
router.patch('/:id/read', [param('id').isUUID()], validate, alertController.markAlertRead)

// PATCH /api/alerts/read-all - Mark all alerts as read
router.patch('/read-all', alertController.markAllAlertsRead)

// DELETE /api/alerts/:id - Dismiss/delete alert
router.delete('/:id', [param('id').isUUID()], validate, alertController.dismissAlert)

export default router
