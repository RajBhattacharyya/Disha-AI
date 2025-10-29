import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/store/auth-store'
import { useToast } from '@/hooks/use-toast'

export function useUserProfile() {
    const { user } = useAuthStore()

    return useQuery({
        queryKey: ['user', 'profile', user?.id],
        queryFn: async () => {
            const response = await apiClient.getUserProfile(user!.id)
            return response.data.user
        },
        enabled: !!user,
    })
}

export function useUpdateUserProfile() {
    const queryClient = useQueryClient()
    const { user, updateUser } = useAuthStore()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: any) => apiClient.updateUserProfile(user!.id, data),
        onSuccess: (response) => {
            // Update auth store
            updateUser(response.data.user)

            // Invalidate user profile query
            queryClient.invalidateQueries({
                queryKey: ['user', 'profile', user!.id],
            })

            toast({
                description: 'Profile updated successfully',
            })
        },
        onError: () => {
            toast({
                title: 'Update failed',
                description: 'Unable to update profile. Please try again.',
                variant: 'destructive',
            })
        },
    })
}

export function useUpdateUserLocation() {
    const queryClient = useQueryClient()
    const { user, updateUser } = useAuthStore()

    return useMutation({
        mutationFn: (location: any) => apiClient.updateUserLocation(user!.id, location),
        onSuccess: (data, variables) => {
            updateUser({ location: variables })
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
        },
    })
}

export function useAddEmergencyContact() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (contact: any) => apiClient.addEmergencyContact(user!.id, contact),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['user', 'profile', user!.id],
            })
            toast({
                description: 'Emergency contact added',
            })
        },
    })
}

export function useRemoveEmergencyContact() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (contactId: string) => apiClient.removeEmergencyContact(user!.id, contactId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['user', 'profile', user!.id],
            })
            toast({
                description: 'Emergency contact removed',
            })
        },
    })
}

export function useUpdateNotificationPreferences() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (preferences: any) =>
            apiClient.updateNotificationPreferences(user!.id, preferences),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
            toast({
                description: 'Notification preferences updated',
            })
        },
    })
}
