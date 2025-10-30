'use client'

import { useCallback, useState } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api'

interface Location {
    latitude: number
    longitude: number
}

interface MapMarker {
    id: string
    position: { lat: number; lng: number }
    title: string
    type: 'disaster' | 'user' | 'resource'
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    description?: string
    onClick?: () => void
}

interface GoogleMapComponentProps {
    center: Location
    markers: MapMarker[]
    zoom?: number
    height?: string
    showUserLocation?: boolean
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
}

const defaultOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
}

export default function GoogleMapComponent({
    center,
    markers,
    zoom = 10,
    height = '600px',
    showUserLocation = true,
}: GoogleMapComponentProps) {
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

    // Show error if API key is missing
    if (!apiKey) {
        return (
            <div style={{ height }} className="flex items-center justify-center bg-gray-100 rounded">
                <div className="text-center p-6">
                    <p className="text-red-600 font-semibold mb-2">Google Maps API Key Missing</p>
                    <p className="text-sm text-gray-600">
                        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
                    </p>
                </div>
            </div>
        )
    }

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
    }, [])

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    const getMarkerIcon = (marker: MapMarker) => {
        // Check if google maps is loaded
        if (typeof google === 'undefined' || !google.maps) {
            return undefined
        }

        if (marker.type === 'user') {
            return {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
            }
        }

        if (marker.type === 'resource') {
            return {
                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }
        }

        // Disaster markers with severity colors
        const severityColors: Record<string, string> = {
            CRITICAL: 'red',
            HIGH: 'orange',
            MEDIUM: 'yellow',
            LOW: 'blue',
        }

        const color = severityColors[marker.severity || 'MEDIUM']
        return {
            url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        }
    }

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'CRITICAL':
                return '#EF4444'
            case 'HIGH':
                return '#F97316'
            case 'MEDIUM':
                return '#EAB308'
            case 'LOW':
                return '#3B82F6'
            default:
                return '#6B7280'
        }
    }

    return (
        <div style={{ height }}>
            <LoadScript googleMapsApiKey={apiKey}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat: center.latitude, lng: center.longitude }}
                    zoom={zoom}
                    options={defaultOptions}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                >
                    {/* Render markers */}
                    {markers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={marker.position}
                            title={marker.title}
                            icon={getMarkerIcon(marker)}
                            onClick={() => {
                                setSelectedMarker(marker)
                                marker.onClick?.()
                            }}
                        />
                    ))}

                    {/* Render circles for disaster zones */}
                    {markers
                        .filter((m) => m.type === 'disaster')
                        .map((marker) => (
                            <Circle
                                key={`circle-${marker.id}`}
                                center={marker.position}
                                radius={5000} // 5km radius
                                options={{
                                    fillColor: getSeverityColor(marker.severity),
                                    fillOpacity: 0.15,
                                    strokeColor: getSeverityColor(marker.severity),
                                    strokeOpacity: 0.4,
                                    strokeWeight: 2,
                                }}
                            />
                        ))}

                    {/* Info window for selected marker */}
                    {selectedMarker && (
                        <InfoWindow
                            position={selectedMarker.position}
                            onCloseClick={() => setSelectedMarker(null)}
                        >
                            <div className="p-2 max-w-xs">
                                <h3 className="font-semibold text-sm mb-1">{selectedMarker.title}</h3>
                                {selectedMarker.severity && (
                                    <span
                                        className="inline-block px-2 py-1 text-xs rounded mb-2"
                                        style={{
                                            backgroundColor: getSeverityColor(selectedMarker.severity),
                                            color: 'white',
                                        }}
                                    >
                                        {selectedMarker.severity}
                                    </span>
                                )}
                                {selectedMarker.description && (
                                    <p className="text-xs text-gray-600">{selectedMarker.description}</p>
                                )}
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>
        </div>
    )
}
