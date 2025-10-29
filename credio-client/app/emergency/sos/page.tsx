'use client'

import { SOSButton } from '@/components/emergency/SOSButton'
import { useUserSOSHistory } from '@/lib/hooks/use-emergency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, MapPin, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function SOSPage() {
  const { data: sosHistory } = useUserSOSHistory()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Emergency SOS</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          In case of emergency, press the SOS button to immediately alert emergency services,
          nearby responders, and your emergency contacts.
        </p>
      </div>

      {/* SOS Button */}
      <div className="flex justify-center py-8">
        <SOSButton />
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How SOS Works</CardTitle>
          <CardDescription>What happens when you activate SOS</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-sm">Your current location is captured and shared</li>
            <li className="text-sm">Emergency services are notified automatically</li>
            <li className="text-sm">Nearby verified responders receive an alert</li>
            <li className="text-sm">Your emergency contacts are notified via SMS</li>
            <li className="text-sm">You can track the response status in real-time</li>
          </ol>
        </CardContent>
      </Card>

      {/* SOS History */}
      {sosHistory && sosHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">SOS History</h2>
          <div className="space-y-3">
            {sosHistory.map((sos: any) => (
              <Card key={sos.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h3 className="font-semibold">{sos.emergencyType.replace('_', ' ')}</h3>
                        <Badge
                          variant={
                            sos.status === 'RESOLVED'
                              ? 'default'
                              : sos.status === 'CANCELLED'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {sos.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {sos.location.address}
                        </div>
                        {sos.responder && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {sos.responder.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/emergency/track/${sos.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
