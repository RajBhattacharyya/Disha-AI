import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DisasterCardProps {
  disaster: {
    id: string
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    title: string
    description: string
    location: {
      address: string
      latitude: number
      longitude: number
    }
    startTime: Date
    status: string
  }
  distance?: number
  onViewDetails: () => void
}

const severityConfig = {
  LOW: { color: 'bg-yellow-500', variant: 'secondary' as const, label: 'Low' },
  MEDIUM: { color: 'bg-orange-500', variant: 'default' as const, label: 'Medium' },
  HIGH: { color: 'bg-red-500', variant: 'destructive' as const, label: 'High' },
  CRITICAL: { color: 'bg-red-900', variant: 'destructive' as const, label: 'Critical' },
}

const disasterIcons: Record<string, string> = {
  EARTHQUAKE: '🌍',
  FLOOD: '🌊',
  FIRE: '🔥',
  HURRICANE: '🌀',
  TORNADO: '🌪️',
  TSUNAMI: '🌊',
  WILDFIRE: '🔥',
  CYCLONE: '🌀',
  LANDSLIDE: '⛰️',
  STORM: '⛈️',
}

export function DisasterCard({ disaster, distance, onViewDetails }: DisasterCardProps) {
  const config = severityConfig[disaster.severity]

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Severity indicator bar */}
      <div className={`h-2 ${config.color}`} />

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{disasterIcons[disaster.type] || '⚠️'}</span>
              {disaster.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {disaster.type.replace('_', ' ')}
            </CardDescription>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {disaster.description}
        </p>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="flex-1">{disaster.location.address}</span>
            {distance !== undefined && (
              <Badge variant="outline" className="ml-auto">
                {distance.toFixed(1)} km away
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(disaster.startTime), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={onViewDetails} className="w-full" variant="outline">
          <AlertTriangle className="mr-2 h-4 w-4" />
          View Details & Guidance
        </Button>
      </CardFooter>
    </Card>
  )
}
