'use client'

import { useAuthStore } from '@/lib/store/auth-store'
import { useNearbyDisasters } from '@/lib/hooks/use-disasters'
import { useAlerts, useUnreadAlerts } from '@/lib/hooks/use-alerts'
import { useUserRiskAssessment } from '@/lib/hooks/use-disasters'
import { useWebSocket } from '@/lib/websocket'
import { DisasterCard } from '@/components/disasters/DisasterCard'
import { AlertNotification } from '@/components/alerts/AlertNotification'
import { SOSButton } from '@/components/emergency/SOSButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  MapPin,
  MessageSquare,
  Shield,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { isConnected } = useWebSocket()

  const { data: nearbyDisasters, isLoading: loadingDisasters } = useNearbyDisasters(100)
  const { data: alerts, isLoading: loadingAlerts } = useAlerts()
  const { data: unreadCount } = useUnreadAlerts()
  const { data: riskAssessment } = useUserRiskAssessment()

  const activeDisasters = nearbyDisasters?.filter((d: any) => d.status === 'ACTIVE') || []
  const recentAlerts = alerts?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Stay informed and stay safe</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <Badge variant="default" className="bg-green-600">
                Live
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-600" />
              <Badge variant="destructive">Offline</Badge>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Active Disasters"
          value={activeDisasters.length.toString()}
          description="In your area"
          variant={activeDisasters.length > 0 ? 'destructive' : 'default'}
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          title="Risk Level"
          value={riskAssessment?.level || 'SAFE'}
          description="Current assessment"
          variant={
            riskAssessment?.level === 'HIGH' || riskAssessment?.level === 'CRITICAL'
              ? 'destructive'
              : 'default'
          }
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Unread Alerts"
          value={unreadCount?.toString() || '0'}
          description="New notifications"
        />
        <div className="flex items-center justify-center">
          <SOSButton />
        </div>
      </div>

      {/* Risk Assessment */}
      {riskAssessment && riskAssessment.level !== 'SAFE' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">⚠️ Risk Assessment</CardTitle>
            <CardDescription>You are in a {riskAssessment.level} risk area</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {riskAssessment.recommendations?.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Alerts</h2>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/alerts">View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentAlerts.map((alert: any) => (
              <AlertNotification
                key={alert.id}
                alert={alert}
                onDismiss={() => {
                  // Handle dismiss
                }}
                onViewDetails={() => {
                  if (alert.disaster?.id) {
                    router.push(`/disasters/${alert.disaster.id}`)
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nearby Disasters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Nearby Disasters</h2>
          <Button variant="ghost" asChild>
            <Link href="/disasters">View All</Link>
          </Button>
        </div>

        {loadingDisasters ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : activeDisasters.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeDisasters.slice(0, 6).map((disaster: any) => (
              <DisasterCard
                key={disaster.id}
                disaster={disaster}
                distance={disaster.distance}
                onViewDetails={() => router.push(`/disasters/${disaster.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No active disasters in your area</p>
              <p className="text-sm text-muted-foreground">You're safe for now</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          icon={<MessageSquare className="h-6 w-6" />}
          title="Chat with AI"
          description="Get safety advice"
          href="/chat"
        />
        <QuickActionCard
          icon={<MapPin className="h-6 w-6" />}
          title="Find Resources"
          description="Emergency shelters & supplies"
          href="/emergency/resources"
        />
        <QuickActionCard
          icon={<AlertTriangle className="h-6 w-6" />}
          title="View Map"
          description="Disaster zones & safe routes"
          href="/map"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  description,
  variant = 'default',
}: {
  icon: React.ReactNode
  title: string
  value: string
  description: string
  variant?: 'default' | 'destructive'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${variant === 'destructive' ? 'text-destructive' : ''}`}
        >
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
