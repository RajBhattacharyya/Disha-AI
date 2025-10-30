import { useState, useEffect } from 'react'
import { offlineMapService, EmergencyLocation } from '@/lib/services/offlineMapService'
import { useLocationStore } from '@/lib/store/location-store'

export function useOfflineMaps() {
    const [isOnline, setIsOnline] = useState(true)
    const [hasOfflineData, setHasOfflineData] = useState(false)
    const [emergencyLocations, setEmergencyLocations] = useState<EmergencyLocation[]>([])
    const [loading, setLoading] = useState(false)
    const { currentLocation } = useLocationStore()

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        setIsOnline(navigator.onLine)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Check for offline data
    useEffect(() => {
        const checkOfflineData = async () => {
            const hasData = await offlineMapService.hasOfflineData()
            setHasOfflineData(hasData)
        }
        checkOfflineData()
    }, [])

    // Load emergency locations
    const loadEmergencyLocations = async (type?: EmergencyLocation['type']) => {
        setLoading(true)
        try {
            const locations = await offlineMapService.getCachedEmergencyLocations(type)
            setEmergencyLocations(locations)
        } catch (error) {
            console.error('Failed to load emergency locations:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch and cache new data
    const refreshData = async () => {
        if (!currentLocation) {
            throw new Error('Location not available')
        }

        setLoading(true)
        try {
            const locations = await offlineMapService.fetchAndCacheNearbyLocations(
                currentLocation.latitude,
                currentLocation.longitude
            )
            const locationsWithCache: EmergencyLocation[] = locations.map(loc => ({
                ...loc,
                cached_at: Date.now()
            }))
            setEmergencyLocations(locationsWithCache)
            setHasOfflineData(true)
            return locationsWithCache
        } catch (error) {
            console.error('Failed to refresh data:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Clear old cache
    const clearCache = async () => {
        await offlineMapService.clearOldCache()
        setHasOfflineData(false)
        setEmergencyLocations([])
    }

    return {
        isOnline,
        hasOfflineData,
        emergencyLocations,
        loading,
        loadEmergencyLocations,
        refreshData,
        clearCache,
    }
}
