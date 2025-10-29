import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  phoneNumber?: string
  avatar?: string
  role: 'USER' | 'RESPONDER' | 'ADMIN'
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  preferredLanguage: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User, token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set): AuthState => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user: User, token: string) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      updateUser: (updatedFields: Partial<User>) =>
        set((state: AuthState) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
