import { io, Socket } from 'socket.io-client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useLocationStore } from '@/lib/store/location-store'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

let socket: Socket | null = null

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false)
    const [alerts, setAlerts] = useState<any[]>([])
    const { user, token } = useAuthStore()
    const { currentLocation } = useLocationStore()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!user || !token) return

        // Initialize socket connection
        socket = io(
            process.env.NEXT_PUBLIC_WS_URL || 'https://server.uemcseaiml.org',
            {
                path: '/disha-ai/socket.io',
                transports: ['websocket'],
                auth: { token },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                withCredentials: true,
            }
        )

        // Connection handlers
        socket.on('connect', () => {
            setIsConnected(true)
            console.log('✅ WebSocket connected')

            // Subscribe to location if available
            if (currentLocation) {
                socket!.emit('subscribe-location', {
                    userId: user.id,
                    location: currentLocation,
                })
            }
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
            console.log('❌ WebSocket disconnected')
        })

        socket.on('connect_error', (error: Error) => {
            console.error('WebSocket connection error:', error)
            setIsConnected(false)
        })

        // Listen for disaster alerts
        socket.on('disaster-alert', (alert: any) => {
            console.log('🚨 Received disaster alert:', alert)

            setAlerts((prev) => [alert, ...prev])

            // Show toast notification
            toast({
                title: `${alert.severity === 'CRITICAL' ? '🚨' : '⚠️'} ${alert.type}`,
                description: alert.message,
                variant: alert.severity === 'CRITICAL' ? 'destructive' : 'default',
                duration: 10000,
            })

            // Play notification sound
            playNotificationSound(alert.severity)

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['disasters'] })
            queryClient.invalidateQueries({ queryKey: ['alerts'] })
        })

        // Listen for personal alerts
        socket.on('personal-alert', (alert: any) => {
            console.log('📬 Received personal alert:', alert)

            setAlerts((prev) => [alert, ...prev])

            toast({
                title: '📬 Personal Alert',
                description: alert.message,
                variant: 'default',
                duration: 8000,
            })

            playNotificationSound('MEDIUM')

            // Invalidate alerts query
            queryClient.invalidateQueries({ queryKey: ['alerts'] })
        })

        // Listen for risk assessments
        socket.on('risk-assessment', (assessment: any) => {
            console.log('📊 Received risk assessment:', assessment)

            if (assessment.level !== 'SAFE') {
                const riskEmoji =
                    assessment.level === 'CRITICAL' ? '🔴' : assessment.level === 'HIGH' ? '🟠' : '🟡'

                toast({
                    title: `${riskEmoji} Risk Level: ${assessment.level}`,
                    description: `${assessment.disasters?.length || 0} active disaster(s) in your area`,
                    variant:
                        assessment.level === 'HIGH' || assessment.level === 'CRITICAL'
                            ? 'destructive'
                            : 'default',
                    duration: 12000,
                })

                if (assessment.level === 'CRITICAL' || assessment.level === 'HIGH') {
                    playNotificationSound(assessment.level)
                }
            }

            // Invalidate risk assessment query
            queryClient.invalidateQueries({ queryKey: ['risk-assessment'] })
        })

        // Listen for disaster updates
        socket.on('disaster-update', (update: any) => {
            console.log('📢 Disaster update:', update)

            toast({
                title: '📢 Disaster Update',
                description: update.message || update.description,
                duration: 8000,
            })

            // Invalidate disaster queries
            queryClient.invalidateQueries({ queryKey: ['disasters'] })
            queryClient.invalidateQueries({ queryKey: ['disaster', update.disasterId] })
        })

        // Listen for SOS updates
        socket.on('sos-update', (update: any) => {
            console.log('🆘 SOS update:', update)

            toast({
                title: '🆘 SOS Status Update',
                description: `Status: ${update.status}`,
            })

            // Invalidate SOS queries
            queryClient.invalidateQueries({ queryKey: ['sos'] })
        })

        // Listen for emergency broadcasts
        socket.on('emergency-broadcast', (broadcast: any) => {
            console.log('📡 Emergency broadcast:', broadcast)

            toast({
                title: '📡 EMERGENCY BROADCAST',
                description: broadcast.message,
                variant: 'destructive',
                duration: 15000,
            })

            playNotificationSound('CRITICAL')
        })

        // Cleanup on unmount
        return () => {
            console.log('🔌 Disconnecting WebSocket')
            socket?.disconnect()
            socket = null
        }
    }, [user, token, toast, queryClient])

    // Update location subscription when location changes
    useEffect(() => {
        if (socket?.connected && currentLocation && user) {
            console.log('📍 Updating location subscription')
            socket.emit('subscribe-location', {
                userId: user.id,
                location: currentLocation,
            })
        }
    }, [currentLocation, user])

    const subscribeToDisaster = (disasterId: string) => {
        console.log('🔔 Subscribing to disaster:', disasterId)
        socket?.emit('subscribe-disaster', disasterId)
    }

    const unsubscribeFromDisaster = (disasterId: string) => {
        console.log('🔕 Unsubscribing from disaster:', disasterId)
        socket?.emit('unsubscribe-disaster', disasterId)
    }

    const trackSOS = (sosId: string) => {
        console.log('🔍 Tracking SOS:', sosId)
        socket?.emit('track-sos', sosId)
    }

    const sendHeartbeat = () => {
        if (socket?.connected) {
            socket.emit('heartbeat', { timestamp: Date.now() })
        }
    }

    return {
        isConnected,
        alerts,
        subscribeToDisaster,
        unsubscribeFromDisaster,
        trackSOS,
        sendHeartbeat,
        clearAlerts: () => setAlerts([]),
    }
}

// Utility function to play notification sound
function playNotificationSound(severity: string) {
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        try {
            const soundMap: Record<string, string> = {
                CRITICAL: '/sounds/critical-alert.mp3',
                HIGH: '/sounds/high-alert.wav',
                MEDIUM: '/sounds/alert.mp3',
                LOW: '/sounds/notification.mp3',
            }

            const soundPath = soundMap[severity] || soundMap['MEDIUM']
            const audio = new Audio(soundPath)
            audio.volume = 0.5

            // Try to play, but don't crash if it fails
            audio.play().catch((err) => {
                console.log('Could not play sound (user interaction may be required):', err.message)
            })
        } catch (error) {
            console.error('Error playing notification sound:', error)
        }
    }
}

// Standalone function to get socket instance
export function getSocket(): Socket | null {
    return socket
}

// Disconnect socket manually (useful for logout)
export function disconnectSocket() {
    if (socket) {
        console.log('🔌 Manually disconnecting WebSocket')
        socket.disconnect()
        socket = null
    }
}

// Reconnect socket manually
export function reconnectSocket() {
    if (socket && !socket.connected) {
        console.log('🔄 Reconnecting WebSocket')
        socket.connect()
    }
}

export { socket }
