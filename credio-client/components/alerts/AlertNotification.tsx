'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, X, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertNotificationProps {
  alert: {
    id: string
    alertType: 'WARNING' | 'EVACUATION' | 'UPDATE' | 'ALL_CLEAR'
    message: string
    disaster: {
      severity: string
      type: string
    }
  }
  onDismiss: () => void
  onViewDetails: () => void
}

const alertConfig = {
  WARNING: {
    icon: '🚨',
    title: 'DISASTER WARNING',
    variant: 'destructive' as const,
    color: 'border-red-500',
  },
  EVACUATION: {
    icon: '⚠️',
    title: 'EVACUATION REQUIRED',
    variant: 'destructive' as const,
    color: 'border-red-600',
  },
  UPDATE: {
    icon: 'ℹ️',
    title: 'Situation Update',
    variant: 'default' as const,
    color: 'border-blue-500',
  },
  ALL_CLEAR: {
    icon: '✅',
    title: 'All Clear',
    variant: 'default' as const,
    color: 'border-green-500',
  },
}

export function AlertNotification({
  alert,
  onDismiss,
  onViewDetails,
}: AlertNotificationProps) {
  const config = alertConfig[alert.alertType]

  return (
    <Alert variant={config.variant} className={cn('relative animate-slide-in border-l-4', config.color)}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-bold text-base pr-8">
        {config.icon} {config.title}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-sm">{alert.message}</p>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={onViewDetails} className="flex-1">
            <Navigation className="mr-2 h-4 w-4" />
            View Details
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
