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

  const requestLocation = async (): Promise<{ latitude: number; longitude: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          // Try to get address from reverse geocoding (simplified)
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

          try {
            // You can add reverse geocoding API here if needed
            // For now, just use coordinates
            address = `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          } catch (error) {
            console.error('Error getting address:', error)
          }

          resolve({ latitude, longitude, address })
        },
        (error) => {
          console.error('Geolocation error:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  const triggerSOS = useMutation({
    mutationFn: async () => {
      // Request location permission and get current location
      let location
      try {
        location = await requestLocation()
      } catch (error) {
        console.error('Location error:', error)
        // Use fallback location if permission denied
        location = currentLocation || {
          latitude: 0,
          longitude: 0,
          address: 'Location unavailable - permission denied',
        }
      }

      const response = await apiClient.createSOSRequest({
        location,
        emergencyType: 'NATURAL_DISASTER',
        severity: 'CRITICAL',
        description: 'Emergency SOS activated via button',
        mediaUrls: [],
      })

      console.log('SOS Response:', response)
      return response
    },
    onSuccess: (data) => {
      console.log('SOS Success data:', data)

      toast({
        title: '🚨 SOS Activated',
        description:
          'Emergency services and nearby responders have been notified. Help is on the way.',
      })

      setShowConfirm(false)

      // Handle different response structures
      const sosId = (data as any)?.data?.sos?.id || (data as any)?.data?.sosId || (data as any)?.sos?.id || (data as any)?.sosId

      if (sosId) {
        // Redirect to tracking page
        router.push(`/emergency/track/${sosId}`)
      } else {
        // Just go to SOS page if no ID
        router.push('/emergency/sos')
      }
    },
    onError: (error: any) => {
      console.error('SOS Error:', error)
      toast({
        title: 'SOS Failed',
        description: error?.message || 'Unable to send SOS. Please call emergency services directly.',
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
            <AlertDialogDescription>
              This will immediately notify emergency services, nearby responders, and your
              emergency contacts with your current location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Only use in genuine emergencies.</p>
            <p className="text-blue-600 font-medium">
              📍 You will be asked to share your location for accurate emergency response.
            </p>
          </div>
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
