import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface EmergencyLocation {
    id: string
    name: string
    type: 'hospital' | 'police' | 'fire_station' | 'pharmacy'
    latitude: number
    longitude: number
    address: string
    phone?: string
    distance?: number
    cached_at: number
}

interface MapTile {
    key: string
    blob: Blob
    cached_at: number
}

interface OfflineMapDB extends DBSchema {
    'emergency-locations': {
        key: string
        value: EmergencyLocation
        indexes: { 'by-type': string; 'by-cached': number }
    }
    'map-tiles': {
        key: string
        value: MapTile
    }
    'user-location': {
        key: string
        value: {
            key: string
            latitude: number
            longitude: number
            address?: string
            cached_at: number
        }
    }
}

class OfflineMapService {
    private db: IDBPDatabase<OfflineMapDB> | null = null
    private readonly DB_NAME = 'credio-offline-maps'
    private readonly DB_VERSION = 1
    private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

    async init() {
        if (this.db) return this.db

        this.db = await openDB<OfflineMapDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                // Emergency locations store
                if (!db.objectStoreNames.contains('emergency-locations')) {
                    const locationStore = db.createObjectStore('emergency-locations', {
                        keyPath: 'id',
                    })
                    locationStore.createIndex('by-type', 'type')
                    locationStore.createIndex('by-cached', 'cached_at')
                }

                // Map tiles store
                if (!db.objectStoreNames.contains('map-tiles')) {
                    db.createObjectStore('map-tiles', { keyPath: 'key' })
                }

                // User location store
                if (!db.objectStoreNames.contains('user-location')) {
                    db.createObjectStore('user-location', { keyPath: 'key' })
                }
            },
        })

        return this.db
    }

    // Cache emergency locations
    async cacheEmergencyLocations(
        locations: Omit<EmergencyLocation, 'cached_at'>[],
        userLat: number,
        userLng: number
    ) {
        const db = await this.init()
        const tx = db.transaction('emergency-locations', 'readwrite')

        for (const location of locations) {
            const distance = this.calculateDistance(
                userLat,
                userLng,
                location.latitude,
                location.longitude
            )

            await tx.store.put({
                ...location,
                distance,
                cached_at: Date.now(),
            })
        }

        await tx.done
    }

    // Get cached emergency locations
    async getCachedEmergencyLocations(
        type?: 'hospital' | 'police' | 'fire_station' | 'pharmacy'
    ): Promise<EmergencyLocation[]> {
        const db = await this.init()
        const now = Date.now()

        let locations: EmergencyLocation[]

        if (type) {
            locations = await db.getAllFromIndex('emergency-locations', 'by-type', type)
        } else {
            locations = await db.getAll('emergency-locations')
        }

        // Filter out expired cache
        return locations
            .filter((loc) => now - loc.cached_at < this.CACHE_DURATION)
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    // Cache user location
    async cacheUserLocation(latitude: number, longitude: number, address?: string) {
        const db = await this.init()
        await db.put('user-location', {
            key: 'current',
            latitude,
            longitude,
            address,
            cached_at: Date.now(),
        })
    }

    // Get cached user location
    async getCachedUserLocation() {
        const db = await this.init()
        return await db.get('user-location', 'current')
    }

    // Cache map tile
    async cacheMapTile(tileUrl: string, blob: Blob) {
        const db = await this.init()
        await db.put('map-tiles', {
            key: tileUrl,
            blob,
            cached_at: Date.now(),
        })
    }

    // Get cached map tile
    async getCachedMapTile(tileUrl: string): Promise<Blob | null> {
        const db = await this.init()
        const tile = await db.get('map-tiles', tileUrl)

        if (!tile) return null

        // Check if cache is still valid
        if (Date.now() - tile.cached_at > this.CACHE_DURATION) {
            await db.delete('map-tiles', tileUrl)
            return null
        }

        return tile.blob
    }

    // Fetch and cache nearby emergency locations from Google Places API
    async fetchAndCacheNearbyLocations(latitude: number, longitude: number, radius = 5000) {
        const types = ['hospital', 'police', 'fire_station', 'pharmacy']
        const allLocations: Omit<EmergencyLocation, 'cached_at'>[] = []
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

        for (const type of types) {
            try {
                // Use backend API (no auth required for emergency services)
                const response = await fetch(
                    `${API_URL}/places/nearby?lat=${latitude}&lng=${longitude}&type=${type}&radius=${radius}`
                )

                if (response.ok) {
                    const data = await response.json()
                    const locations = data.results.map((place: any) => ({
                        id: place.place_id,
                        name: place.name,
                        type: type as EmergencyLocation['type'],
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        address: place.vicinity || place.formatted_address,
                        phone: place.formatted_phone_number,
                    }))

                    allLocations.push(...locations)
                }
            } catch (error) {
                console.error(`Failed to fetch ${type} locations:`, error)
            }
        }

        if (allLocations.length > 0) {
            await this.cacheEmergencyLocations(allLocations, latitude, longitude)
            await this.cacheUserLocation(latitude, longitude)
        }

        return allLocations
    }

    // Calculate distance between two coordinates (Haversine formula)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371 // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1)
        const dLon = this.toRad(lon2 - lon1)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180)
    }

    // Clear old cache
    async clearOldCache() {
        const db = await this.init()
        const now = Date.now()

        // Clear old emergency locations
        const locations = await db.getAll('emergency-locations')
        const tx1 = db.transaction('emergency-locations', 'readwrite')
        for (const loc of locations) {
            if (now - loc.cached_at > this.CACHE_DURATION) {
                await tx1.store.delete(loc.id)
            }
        }
        await tx1.done

        // Clear old map tiles
        const tiles = await db.getAll('map-tiles')
        const tx2 = db.transaction('map-tiles', 'readwrite')
        for (const tile of tiles) {
            if (now - tile.cached_at > this.CACHE_DURATION) {
                await tx2.store.delete(tile.key)
            }
        }
        await tx2.done
    }

    // Check if offline data is available
    async hasOfflineData(): Promise<boolean> {
        const db = await this.init()
        const locations = await db.getAll('emergency-locations')
        const userLocation = await db.get('user-location', 'current')
        return locations.length > 0 && !!userLocation
    }
}

export const offlineMapService = new OfflineMapService()
export type { EmergencyLocation }
