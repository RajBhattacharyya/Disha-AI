'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { useLocationStore } from '@/lib/store/location-store'
import { Loader2, AlertTriangle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export function SOSButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuthStore()
  const { currentLocation } = useLocationStore()

  const triggerSOS = useMutation({
    mutationFn: async () => {
      const location = currentLocation || {
        latitude: 0,
        longitude: 0,
        address: 'Unknown location',
      }

      const response = await apiClient.createSOSRequest({
        location,
        emergencyType: 'NATURAL_DISASTER',
        severity: 'CRITICAL',
        description: 'Emergency SOS activated via button',
        mediaUrls: [],
      })

      return response
    },
    onSuccess: (data) => {
      toast({
        title: '🚨 SOS Activated',
        description:
          'Emergency services and nearby responders have been notified. Help is on the way.',
      })

      setShowConfirm(false)

      // Redirect to tracking page
      router.push(`/emergency/track/${data.data.sosId}`)
    },
    onError: () => {
      toast({
        title: 'SOS Failed',
        description: 'Unable to send SOS. Please call emergency services directly.',
        variant: 'destructive',
      })
    },
  })

  return (
    <>
      <Button
        size="lg"
        variant="destructive"
        className="h-32 w-32 rounded-full text-2xl font-bold shadow-2xl hover:scale-105 transition-transform animate-pulse"
        onClick={() => setShowConfirm(true)}
      >
        <div className="flex flex-col items-center">
          <AlertTriangle className="h-12 w-12 mb-2" />
          <span>SOS</span>
        </div>
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ Activate Emergency SOS?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will immediately notify emergency services, nearby responders, and your
                emergency contacts with your current location.
              </p>
              <p className="font-semibold">Only use in genuine emergencies.</p>
              {!currentLocation && (
                <p className="text-yellow-600 font-medium">
                  ⚠️ Location not available. Please enable location services for accurate
                  emergency response.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => triggerSOS.mutate()}
              disabled={triggerSOS.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {triggerSOS.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate SOS'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
