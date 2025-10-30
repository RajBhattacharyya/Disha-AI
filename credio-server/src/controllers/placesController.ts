import { Request, Response } from 'express'
import axios from 'axios'

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''

export const getNearbyPlaces = async (req: Request, res: Response) => {
    try {
        const { lat, lng, type, radius = 5000 } = req.query

        if (!lat || !lng || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: lat, lng, type',
            })
        }

        if (!GOOGLE_PLACES_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Google Places API key not configured',
            })
        }

        // Call Google Places API
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
            {
                params: {
                    location: `${lat},${lng}`,
                    radius,
                    type,
                    key: GOOGLE_PLACES_API_KEY,
                },
            }
        )

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            return res.status(500).json({
                success: false,
                message: `Google Places API error: ${response.data.status}`,
            })
        }

        // Transform the results
        const places = response.data.results.map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            vicinity: place.vicinity,
            formatted_address: place.formatted_address,
            geometry: {
                location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                },
            },
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            opening_hours: place.opening_hours,
        }))

        res.json({
            success: true,
            results: places,
            status: response.data.status,
        })
    } catch (error: any) {
        console.error('Error fetching nearby places:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nearby places',
            error: error.message,
        })
    }
}
