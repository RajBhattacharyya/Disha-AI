'use client'

import { useState } from 'react'
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, useDismissAlert } from '@/lib/hooks/use-alerts'
import { AlertNotification } from '@/components/alerts/AlertNotification'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AlertsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const { data: allAlerts, isLoading } = useAlerts()
  const { data: unreadAlerts } = useAlerts(false)
  const { data: readAlerts } = useAlerts(true)

  const markRead = useMarkAlertRead()
  const markAllRead = useMarkAllAlertsRead()
  const dismissAlert = useDismissAlert()

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  const handleDismiss = (alertId: string) => {
    dismissAlert.mutate(alertId)
  }

  const handleViewDetails = (alert: any) => {
    if (alert.disaster?.id) {
      // Mark as read when viewing
      if (!alert.isRead) {
        markRead.mutate(alert.id)
      }
      router.push(`/disasters/${alert.disaster.id}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Stay updated on disasters and emergencies</p>
        </div>
        {unreadAlerts && unreadAlerts.length > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" disabled={markAllRead.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {allAlerts && (
              <Badge variant="secondary" className="ml-2">
                {allAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadAlerts && unreadAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : allAlerts && allAlerts.length > 0 ? (
            allAlerts.map((alert: any) => (
              <AlertNotification
                key={alert.id}
                alert={alert}
                onDismiss={() => handleDismiss(alert.id)}
                onViewDetails={() => handleViewDetails(alert)}
              />
            ))
          ) : (
            <EmptyState message="No alerts yet" />
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {unreadAlerts && unreadAlerts.length > 0 ? (
            unreadAlerts.map((alert: any) => (
              <AlertNotification
                key={alert.id}
                alert={alert}
                onDismiss={() => handleDismiss(alert.id)}
                onViewDetails={() => handleViewDetails(alert)}
              />
            ))
          ) : (
            <EmptyState message="No unread alerts" icon={<CheckCheck className="h-12 w-12" />} />
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readAlerts && readAlerts.length > 0 ? (
            readAlerts.map((alert: any) => (
              <AlertNotification
                key={alert.id}
                alert={alert}
                onDismiss={() => handleDismiss(alert.id)}
                onViewDetails={() => handleViewDetails(alert)}
              />
            ))
          ) : (
            <EmptyState message="No read alerts" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon || <Bell className="h-12 w-12 text-muted-foreground mb-4" />}
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">You're all caught up!</p>
      </CardContent>
    </Card>
  )
}
