import { Router } from 'express'
import authRoutes from './authRoutes'
import userRoutes from './userRoutes'
import disasterRoutes from './disasterRoutes'
import alertRoutes from './alertRoutes'
import chatRoutes from './chatRoutes'
import emergencyRoutes from './emergencyRoutes'
import translationRoutes from './translationRoutes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/disasters', disasterRoutes)
router.use('/alerts', alertRoutes)
router.use('/chat', chatRoutes)
router.use('/emergency', emergencyRoutes)
router.use('/translate', translationRoutes)

export default router
