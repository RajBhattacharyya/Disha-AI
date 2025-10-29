import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, MapPin, Clock, ExternalLink } from 'lucide-react'

interface Resource {
  id: string
  name: string
  type: string
  location: {
    address: string
    latitude: number
    longitude: number
  }
  contactPhone: string
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'
  lastUpdated: Date
  distance?: number
}

interface ResourceListProps {
  resources: Resource[]
  onSelectResource: (resource: Resource) => void
}

const resourceIcons: Record<string, string> = {
  SHELTER: '🏠',
  HOSPITAL: '🏥',
  FOOD: '🍽️',
  WATER: '💧',
  RESCUE_TEAM: '🚑',
  POLICE: '👮',
  FIRE_STATION: '🚒',
  MEDICAL: '💊',
}

const availabilityConfig = {
  AVAILABLE: { variant: 'default' as const, label: 'Available', color: 'text-green-600' },
  LIMITED: { variant: 'secondary' as const, label: 'Limited', color: 'text-yellow-600' },
  UNAVAILABLE: { variant: 'destructive' as const, label: 'Unavailable', color: 'text-red-600' },
}

export function ResourceList({ resources, onSelectResource }: ResourceListProps) {
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => {
        const availability = availabilityConfig[resource.availability]

        return (
          <Card
            key={resource.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectResource(resource)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{resourceIcons[resource.type] || '📍'}</span>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{resource.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {resource.type.replace('_', ' ')}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={availability.variant} className="shrink-0">
                  {availability.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="flex-1 line-clamp-2">{resource.location.address}</span>
                  {resource.distance !== undefined && (
                    <Badge variant="outline" className="shrink-0">
                      {resource.distance.toFixed(1)}km
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a
                    href={`tel:${resource.contactPhone}`}
                    className="hover:text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {resource.contactPhone}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Updated {formatTimeAgo(resource.lastUpdated)}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${resource.location.latitude},${resource.location.longitude}`,
                    '_blank'
                  )
                }}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Get Directions
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
