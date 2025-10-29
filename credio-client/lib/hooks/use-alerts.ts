import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store/auth-store'

export function useAlerts(isRead?: boolean) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['alerts', user?.id, isRead],
    queryFn: async () => {
      const response = await apiClient.getAlerts({ isRead })
      return response.data.alerts
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useUnreadAlerts() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['alerts', 'unread-count', user?.id],
    queryFn: async () => {
      const response = await apiClient.getUnreadAlertCount()
      return response.data.count
    },
    enabled: !!user,
    refetchInterval: 15000, // Refresh every 15 seconds
  })
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => apiClient.markAlertRead(alertId),
    onSuccess: () => {
      // Invalidate alerts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: () => apiClient.markAllAlertsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast({
        description: 'All alerts marked as read',
      })
    },
  })
}

export function useDismissAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => apiClient.dismissAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
