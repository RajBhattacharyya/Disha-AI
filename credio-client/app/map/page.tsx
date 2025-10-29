'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, MapPin, Navigation, Layers } from 'lucide-react'
import { useDisasters } from '@/lib/hooks/use-disasters'
import { useLocationStore } from '@/lib/store/location-store'
import GoogleMapComponent from '@/components/map/GoogleMap'

interface Disaster {
    id: string
    title: string
    description: string
    type: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    status: string
    location: {
        latitude: number
        longitude: number
        city?: string
    }
}

export default function MapPage() {
    const { data: disastersData, isLoading } = useDisasters({ status: 'ACTIVE' })
    const { currentLocation, startTracking } = useLocationStore()
    const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null)
    const [showDisasterZones, setShowDisasterZones] = useState(true)

    const disasters = (disastersData?.disasters || []) as Disaster[]

    useEffect(() => {
        // Start location tracking if not already tracking
        if (!currentLocation) {
            startTracking()
        }
    }, [currentLocation, startTracking])

    // Prepare map markers
    const mapMarkers = useMemo(() => {
        const markers = []

        // Add user location marker
        if (currentLocation) {
            markers.push({
                id: 'user-location',
                position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
                title: 'Your Location',
                type: 'user' as const,
                description: currentLocation.address || 'Current location',
            })
        }

        // Add disaster markers
        if (showDisasterZones) {
            disasters.forEach((disaster) => {
                markers.push({
                    id: disaster.id,
                    position: { lat: disaster.location.latitude, lng: disaster.location.longitude },
                    title: disaster.title,
                    type: 'disaster' as const,
                    severity: disaster.severity,
                    description: disaster.description,
                    onClick: () => setSelectedDisaster(disaster),
                })
            })
        }

        return markers
    }, [currentLocation, disasters, showDisasterZones])

    // Calculate map center
    const mapCenter = useMemo(() => {
        if (selectedDisaster) {
            return {
                latitude: selectedDisaster.location.latitude,
                longitude: selectedDisaster.location.longitude,
            }
        }
        if (currentLocation) {
            return {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            }
        }
        // Default to a central location (e.g., US center)
        return { latitude: 39.8283, longitude: -98.5795 }
    }, [currentLocation, selectedDisaster])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-500'
            case 'HIGH':
                return 'bg-orange-500'
            case 'MEDIUM':
                return 'bg-yellow-500'
            case 'LOW':
                return 'bg-blue-500'
            default:
                return 'bg-gray-500'
        }
    }

    const openInGoogleMaps = (lat: number, lng: number) => {
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
            '_blank'
        )
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading map data...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Disaster Map</h1>
                    <p className="text-gray-600">
                        View active disasters and emergency resources in your area
                    </p>
                </div>
                <Button
                    variant={showDisasterZones ? 'default' : 'outline'}
                    onClick={() => setShowDisasterZones(!showDisasterZones)}
                >
                    <Layers className="w-4 h-4 mr-2" />
                    {showDisasterZones ? 'Hide' : 'Show'} Disaster Zones
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Container */}
                <div className="lg:col-span-2">
                    <Card className="p-4 h-[600px]">
                        <GoogleMapComponent
                            center={mapCenter}
                            markers={mapMarkers}
                            zoom={selectedDisaster ? 12 : 8}
                            height="100%"
                        />
                    </Card>

                    {/* Map Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <Card className="p-4">
                            <div className="text-2xl font-bold text-red-600">{disasters.filter(d => d.severity === 'CRITICAL').length}</div>
                            <div className="text-sm text-gray-600">Critical</div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-2xl font-bold text-orange-600">{disasters.filter(d => d.severity === 'HIGH').length}</div>
                            <div className="text-sm text-gray-600">High</div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{disasters.length}</div>
                            <div className="text-sm text-gray-600">Total Active</div>
                        </Card>
                    </div>
                </div>

                {/* Disaster List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Active Disasters</h2>
                        {currentLocation && (
                            <div className="text-xs text-gray-500">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                Tracking
                            </div>
                        )}
                    </div>

                    {disasters.length === 0 ? (
                        <Card className="p-6 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No active disasters in your area</p>
                        </Card>
                    ) : (
                        <div className="space-y-3 max-h-[550px] overflow-y-auto">
                            {disasters.map((disaster: Disaster) => (
                                <Card
                                    key={disaster.id}
                                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedDisaster?.id === disaster.id ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                    onClick={() => setSelectedDisaster(disaster)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-sm">{disaster.title}</h3>
                                        <Badge className={getSeverityColor(disaster.severity)}>
                                            {disaster.severity}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                        {disaster.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <MapPin className="w-3 h-3" />
                                        <span>
                                            {disaster.location?.city || 'Unknown location'}
                                        </span>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openInGoogleMaps(
                                                disaster.location.latitude,
                                                disaster.location.longitude
                                            )
                                        }}
                                    >
                                        <Navigation className="w-4 h-4 mr-2" />
                                        Get Directions
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <Card className="mt-6 p-4">
                <h3 className="font-semibold mb-3">Map Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Your Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        <span className="text-sm">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500"></div>
                        <span className="text-sm">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-500"></div>
                        <span className="text-sm">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-400"></div>
                        <span className="text-sm">Low</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
