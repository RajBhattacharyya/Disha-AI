import { Router } from 'express'
import { body, param } from 'express-validator'
import * as userController from '../controllers/userController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'

const router = Router()

router.use(authenticate)

// GET /api/users/:id - Get user profile
router.get('/:id', [param('id').isUUID()], validate, userController.getUserProfile)

// PATCH /api/users/:id - Update user profile
router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().isString().isLength({ min: 2 }),
    body('phoneNumber').optional().isMobilePhone('any'),
    body('preferredLanguage').optional().isString().isLength({ min: 2, max: 5 }),
  ],
  validate,
  userController.updateUserProfile
)

// PATCH /api/users/:id/location - Update user location
router.patch(
  '/:id/location',
  [
    param('id').isUUID(),
    body('location').isObject(),
    body('location.latitude').isFloat({ min: -90, max: 90 }),
    body('location.longitude').isFloat({ min: -180, max: 180 }),
    body('location.address').optional().isString(),
  ],
  validate,
  userController.updateUserLocation
)

// PATCH /api/users/:id/notifications - Update notification preferences
router.patch(
  '/:id/notifications',
  [param('id').isUUID(), body('push').optional().isBoolean(), body('sms').optional().isBoolean(), body('email').optional().isBoolean()],
  validate,
  userController.updateNotificationPreferences
)

// POST /api/users/:id/emergency-contacts - Add emergency contact
router.post(
  '/:id/emergency-contacts',
  [param('id').isUUID(), body('name').isString(), body('phone').isMobilePhone('any'), body('relationship').isString()],
  validate,
  userController.addEmergencyContact
)

// DELETE /api/users/:id/emergency-contacts/:contactId - Remove emergency contact
router.delete(
  '/:id/emergency-contacts/:contactId',
  [param('id').isUUID(), param('contactId').isString()],
  validate,
  userController.removeEmergencyContact
)

export default router
