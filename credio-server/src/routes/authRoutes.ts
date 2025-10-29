import { Router } from 'express'
import { body } from 'express-validator'
import * as authController from '../controllers/authController'
import { validate } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

// POST /api/auth/register
router.post(
  '/register',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  ],
  validate,
  authController.register
)

// POST /api/auth/login
router.post(
  '/login',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
)

// POST /api/auth/logout
router.post('/logout', authController.logout)

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken)

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }),
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
)

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  authController.resetPassword
)

export default router
