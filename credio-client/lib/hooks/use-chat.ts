import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/store/auth-store'

export function useChatHistory(sessionId: string) {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: async () => {
      const response = await apiClient.getChatHistory(sessionId)
      return response.data
    },
    enabled: !!sessionId && sessionId !== 'new',
    staleTime: Infinity, // Chat history doesn't change unless we add messages
  })
}

export function useUserChatSessions() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['chat', 'sessions', user?.id],
    queryFn: async () => {
      const response = await apiClient.getUserChatSessions()
      return response.data.sessions
    },
    enabled: !!user,
  })
}

export function useCreateChatSession() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: (title?: string) => apiClient.createChatSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'sessions', user?.id],
      })
    },
  })
}

export function useUpdateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      apiClient.updateChatSession(sessionId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    },
  })
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => apiClient.deleteChatSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    },
  })
}
