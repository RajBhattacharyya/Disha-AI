import { Router } from 'express'
import { getNearbyPlaces } from '../controllers/placesController'

const router = Router()

// Get nearby emergency places (no auth required for emergency services)
router.get('/nearby', getNearbyPlaces)

export default router
