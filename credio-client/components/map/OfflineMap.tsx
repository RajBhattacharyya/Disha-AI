'use client'

import { useEffect, useState } from 'react'
import { offlineMapService, EmergencyLocation } from '@/lib/services/offlineMapService'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Phone, Navigation, WifiOff, Wifi } from 'lucide-react'

interface OfflineMapProps {
    center?: { latitude: number; longitude: number }
    zoom?: number
    height?: string
}

export default function OfflineMap({ center, zoom = 13, height = '500px' }: OfflineMapProps) {
    const [isOnline, setIsOnline] = useState(true)
    const [locations, setLocations] = useState<EmergencyLocation[]>([])
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<EmergencyLocation | null>(null)
    const [loading, setLoading] = useState(true)
    const [hasOfflineData, setHasOfflineData] = useState(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [MapComponent, setMapComponent] = useState<any>(null)

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

    // Load Leaflet dynamically
    useEffect(() => {
        const loadMap = async () => {
            try {
                const L = (await import('leaflet')).default
                const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet')

                // Fix Leaflet default icon issue
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                })

                setMapComponent(() => ({ MapContainer, TileLayer, Marker, Popup, L }))
                setMapLoaded(true)
            } catch (error) {
                console.error('Failed to load map:', error)
            }
        }

        loadMap()
    }, [])

    // Initialize and load data
    useEffect(() => {
        if (!mapLoaded) return

        const initMap = async () => {
            setLoading(true)

            try {
                await offlineMapService.init()
                const hasData = await offlineMapService.hasOfflineData()
                setHasOfflineData(hasData)

                // Get user location
                let userLat: number, userLng: number

                if (center) {
                    userLat = center.latitude
                    userLng = center.longitude
                } else if (navigator.geolocation) {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject)
                    })
                    userLat = position.coords.latitude
                    userLng = position.coords.longitude
                } else {
                    // Fallback to cached location
                    const cached = await offlineMapService.getCachedUserLocation()
                    if (cached) {
                        userLat = cached.latitude
                        userLng = cached.longitude
                    } else {
                        throw new Error('Unable to get location')
                    }
                }

                setUserLocation({ latitude: userLat, longitude: userLng })

                // Try to fetch fresh data if online
                if (isOnline) {
                    try {
                        const freshLocations = await offlineMapService.fetchAndCacheNearbyLocations(
                            userLat,
                            userLng
                        )
                        const locationsWithCache: EmergencyLocation[] = freshLocations.map(loc => ({
                            ...loc,
                            cached_at: Date.now()
                        }))
                        setLocations(locationsWithCache)
                        setHasOfflineData(true)
                    } catch (error) {
                        console.error('Failed to fetch fresh data, using cache:', error)
                        const cachedLocations = await offlineMapService.getCachedEmergencyLocations()
                        setLocations(cachedLocations)
                    }
                } else {
                    // Load from cache when offline
                    const cachedLocations = await offlineMapService.getCachedEmergencyLocations()
                    setLocations(cachedLocations)
                }
            } catch (error) {
                console.error('Failed to initialize map:', error)
            } finally {
                setLoading(false)
            }
        }

        initMap()
    }, [center, isOnline, mapLoaded])

    const getLocationColor = (type: EmergencyLocation['type']) => {
        switch (type) {
            case 'hospital':
                return 'bg-red-500'
            case 'police':
                return 'bg-blue-700'
            case 'fire_station':
                return 'bg-orange-500'
            case 'pharmacy':
                return 'bg-green-500'
            default:
                return 'bg-gray-500'
        }
    }

    const openInMaps = (lat: number, lng: number) => {
        if (isOnline) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
        } else {
            alert('Navigation requires internet connection')
        }
    }

    if (loading || !mapLoaded) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                </div>
            </div>
        )
    }

    if (!userLocation) {
        return (
            <Card className="p-6 text-center" style={{ height }}>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600">Unable to determine your location</p>
                <p className="text-sm text-gray-500 mt-2">Please enable location services</p>
            </Card>
        )
    }

    if (!MapComponent) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <p className="text-gray-600">Loading map components...</p>
            </div>
        )
    }

    const { MapContainer, TileLayer, Marker, Popup } = MapComponent
    const mapCenter: [number, number] = [userLocation.latitude, userLocation.longitude]

    return (
        <div className="relative" style={{ height }}>
            {/* Online/Offline Indicator */}
            <div className="absolute top-4 right-4 z-[1000]">
                <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-2">
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    {isOnline ? 'Online' : 'Offline Mode'}
                </Badge>
            </div>

            {!isOnline && !hasOfflineData && (
                <div className="absolute top-16 right-4 z-[1000] max-w-xs">
                    <Card className="p-3 bg-yellow-50 border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            No offline data available. Connect to internet to cache map data.
                        </p>
                    </Card>
                </div>
            )}

            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                {/* User location marker */}
                <Marker position={mapCenter}>
                    <Popup>
                        <div className="text-center">
                            <strong>Your Location</strong>
                        </div>
                    </Popup>
                </Marker>

                {/* Emergency location markers */}
                {locations.map((location) => (
                    <Marker
                        key={location.id}
                        position={[location.latitude, location.longitude]}
                        eventHandlers={{
                            click: () => setSelectedLocation(location),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <h3 className="font-semibold mb-1">{location.name}</h3>
                                <Badge className={`${getLocationColor(location.type)} mb-2`}>
                                    {location.type.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                                {location.phone && (
                                    <p className="text-sm flex items-center gap-1 mb-2">
                                        <Phone className="w-3 h-3" />
                                        <a href={`tel:${location.phone}`} className="text-blue-600">
                                            {location.phone}
                                        </a>
                                    </p>
                                )}
                                {location.distance && (
                                    <p className="text-sm text-gray-500 mb-2">
                                        {location.distance.toFixed(2)} km away
                                    </p>
                                )}
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => openInMaps(location.latitude, location.longitude)}
                                    disabled={!isOnline}
                                >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Get Directions
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Location details sidebar */}
            {selectedLocation && (
                <Card className="absolute bottom-4 left-4 right-4 z-[1000] p-4 max-w-md">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{selectedLocation.name}</h3>
                        <Badge className={getLocationColor(selectedLocation.type)}>
                            {selectedLocation.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{selectedLocation.address}</p>
                    {selectedLocation.phone && (
                        <p className="text-sm flex items-center gap-1 mb-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${selectedLocation.phone}`} className="text-blue-600">
                                {selectedLocation.phone}
                            </a>
                        </p>
                    )}
                    {selectedLocation.distance && (
                        <p className="text-sm text-gray-500 mb-3">
                            {selectedLocation.distance.toFixed(2)} km away
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                                openInMaps(selectedLocation.latitude, selectedLocation.longitude)
                            }
                            disabled={!isOnline}
                        >
                            <Navigation className="w-4 h-4 mr-2" />
                            Directions
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedLocation(null)}>
                            Close
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
