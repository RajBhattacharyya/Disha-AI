import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useLocationStore } from '@/lib/store/location-store'

export function useDisasters(params?: {
    status?: 'ACTIVE' | 'RESOLVED' | 'MONITORING'
    type?: string
    severity?: string
    limit?: number
}) {
    return useQuery({
        queryKey: ['disasters', params],
        queryFn: async () => {
            const response = await apiClient.getDisasters(params)
            return response.data
        },
        staleTime: 60000, // 1 minute
        refetchInterval: 300000, // Refetch every 5 minutes
    })
}

export function useDisaster(id: string) {
    return useQuery({
        queryKey: ['disaster', id],
        queryFn: async () => {
            const response = await apiClient.getDisasterById(id)
            return response.data.disaster
        },
        enabled: !!id,
        staleTime: 30000, // 30 seconds
    })
}

export function useNearbyDisasters(radius: number = 100) {
    const { currentLocation } = useLocationStore()

    return useQuery({
        queryKey: ['disasters', 'nearby', currentLocation, radius],
        queryFn: async () => {
            const response = await apiClient.getNearbyDisasters(currentLocation!, radius)
            return response.data.disasters
        },
        enabled: !!currentLocation,
        staleTime: 60000,
        refetchInterval: 300000,
    })
}

export function useDisasterGuidance(disasterId: string) {
    return useQuery({
        queryKey: ['disaster', 'guidance', disasterId],
        queryFn: async () => {
            const response = await apiClient.getDisasterGuidance(disasterId)
            return response.data.guidance
        },
        enabled: !!disasterId,
        staleTime: 300000, // 5 minutes
    })
}

export function useUserRiskAssessment() {
    return useQuery({
        queryKey: ['risk-assessment'],
        queryFn: async () => {
            const response = await apiClient.getUserRiskAssessment()
            return response.data.assessment
        },
        refetchInterval: 60000, // Refresh every minute
    })
}
