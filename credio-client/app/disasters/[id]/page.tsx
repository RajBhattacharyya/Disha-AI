'use client'

import { useEffect } from 'react'
import * as React from 'react'
import { useDisaster, useDisasterGuidance } from '@/lib/hooks/use-disasters'
import { useWebSocket } from '@/lib/websocket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, MapPin, Clock, Navigation, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function DisasterDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [disasterId, setDisasterId] = React.useState<string>('')

    React.useEffect(() => {
        params.then(p => setDisasterId(p.id))
    }, [params])

    const { data: disaster, isLoading } = useDisaster(disasterId)
    const { data: guidance, isLoading: loadingGuidance } = useDisasterGuidance(disasterId)
    const { subscribeToDisaster, unsubscribeFromDisaster } = useWebSocket()

    useEffect(() => {
        if (disasterId) {
            subscribeToDisaster(disasterId)
            return () => unsubscribeFromDisaster(disasterId)
        }
    }, [disasterId, subscribeToDisaster, unsubscribeFromDisaster])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32" />
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (!disaster) {
        return <div>Disaster not found</div>
    }

    const severityColors: Record<string, string> = {
        LOW: 'bg-yellow-500',
        MEDIUM: 'bg-orange-500',
        HIGH: 'bg-red-500',
        CRITICAL: 'bg-red-900',
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <div className={`h-2 ${severityColors[disaster.severity]}`} />
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl">{disaster.title}</CardTitle>
                            <CardDescription className="text-base mt-2">
                                {disaster.type.replace('_', ' ')}
                            </CardDescription>
                        </div>
                        <Badge
                            variant={disaster.severity === 'CRITICAL' || disaster.severity === 'HIGH' ? 'destructive' : 'default'}
                        >
                            {disaster.severity}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{disaster.description}</p>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{disaster.location.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDistanceToNow(new Date(disaster.startTime), { addSuffix: true })}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href={`/chat?disaster=${disasterId}`}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Ask AI for Guidance
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${disaster.location.latitude},${disaster.location.longitude}`,
                                    '_blank'
                                )
                            }}
                        >
                            <Navigation className="mr-2 h-4 w-4" />
                            Get Directions
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* AI Guidance */}
            {guidance && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Safety Guidance</CardTitle>
                        <CardDescription>Recommendations for this disaster</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{guidance.response}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
