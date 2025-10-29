import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store/auth-store'

export function useCreateSOS() {
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: {
            location: any
            emergencyType: string
            description?: string
            severity: string
            mediaUrls?: string[]
        }) => apiClient.createSOSRequest(data),
        onSuccess: () => {
            toast({
                title: '🚨 SOS Activated',
                description: 'Emergency services have been notified. Help is on the way.',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'SOS Failed',
                description: error.message || 'Unable to send SOS. Please call emergency services.',
                variant: 'destructive',
            })
        },
    })
}

export function useSOSTracking(sosId: string) {
    return useQuery({
        queryKey: ['sos', 'tracking', sosId],
        queryFn: async () => {
            const response = await apiClient.getSOSTracking(sosId)
            return response.data
        },
        enabled: !!sosId,
        refetchInterval: 10000, // Refresh every 10 seconds
    })
}

export function useUserSOSHistory() {
    const { user } = useAuthStore()

    return useQuery({
        queryKey: ['sos', 'history', user?.id],
        queryFn: async () => {
            const response = await apiClient.getUserSOSHistory()
            return response.data.sosRequests
        },
        enabled: !!user,
    })
}

export function useEmergencyResources(params: {
    latitude?: number
    longitude?: number
    radius?: number
    type?: string
}) {
    return useQuery({
        queryKey: ['emergency', 'resources', params],
        queryFn: async () => {
            const response = await apiClient.getEmergencyResources(params as any)
            return response.data.resources
        },
        enabled: !!(params.latitude && params.longitude),
        staleTime: 300000, // 5 minutes
    })
}

export function useCancelSOS() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (sosId: string) => apiClient.cancelSOS(sosId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sos'] })
            toast({
                description: 'SOS request cancelled',
            })
        },
    })
}
