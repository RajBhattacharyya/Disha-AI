'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export function SOSMap({ sosRequests }: { sosRequests: any[] }) {
  const router = useRouter()

  // Create custom icons based on severity
  const createCustomIcon = (severity: string) => {
    const color =
      severity === 'CRITICAL'
        ? '#dc2626'
        : severity === 'HIGH'
        ? '#ea580c'
        : severity === 'MEDIUM'
        ? '#eab308'
        : '#3b82f6'

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">
          🆘
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })
  }

  // Calculate center point
  const getCenter = (): [number, number] => {
    if (sosRequests.length === 0) return [20, 0] // Default world view

    const avgLat =
      sosRequests.reduce((sum, sos) => sum + (sos.location?.latitude || 0), 0) / sosRequests.length
    const avgLng =
      sosRequests.reduce((sum, sos) => sum + (sos.location?.longitude || 0), 0) /
      sosRequests.length

    return [avgLat, avgLng]
  }

  return (
    <Card className="h-full overflow-hidden">
      <MapContainer
        center={getCenter()}
        zoom={sosRequests.length > 0 ? 8 : 2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {sosRequests.map((sos) => {
          if (!sos.location?.latitude || !sos.location?.longitude) return null

          return (
            <Marker
              key={sos.id}
              position={[sos.location.latitude, sos.location.longitude]}
              icon={createCustomIcon(sos.severity)}
            >
              <Popup>
                <div className="p-2 space-y-2 min-w-[200px]">
                  <div>
                    <h3 className="font-bold text-base">{sos.emergencyType}</h3>
                    <p className="text-sm text-muted-foreground">{sos.user?.name || 'Unknown'}</p>
                  </div>

                  <div className="flex gap-2">
                    <Badge
                      variant={
                        sos.severity === 'CRITICAL' || sos.severity === 'HIGH'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {sos.severity}
                    </Badge>
                    <Badge variant="outline">{sos.status}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">{sos.location.address}</p>

                  {sos.description && (
                    <p className="text-sm border-t pt-2">{sos.description}</p>
                  )}

                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/admin/sos/${sos.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </Card>
  )
}
