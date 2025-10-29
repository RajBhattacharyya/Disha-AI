import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/lib/store/auth-store'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          useAuthStore.getState().logout()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }

        // Handle other errors
        const message = (error.response?.data as any)?.error?.message || error.message
        return Promise.reject(new Error(message))
      }
    )
  }

  // ==================== AUTH ====================
  async login(credentials: { email: string; password: string }) {
    return this.client.post('/auth/login', credentials)
  }

  async register(data: {
    name: string
    email: string
    phoneNumber?: string
    password: string
  }) {
    return this.client.post('/auth/register', data)
  }

  async logout() {
    return this.client.post('/auth/logout')
  }

  async refreshToken(token: string) {
    return this.client.post('/auth/refresh', { token })
  }

  async forgotPassword(email: string) {
    return this.client.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, password: string) {
    return this.client.post('/auth/reset-password', { token, password })
  }

  // ==================== USER ====================
  async getUserProfile(userId: string) {
    return this.client.get(`/users/${userId}`)
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    return this.client.patch(`/users/${userId}`, data)
  }

  async updateUserLocation(userId: string, location: Location) {
    return this.client.patch(`/users/${userId}/location`, { location })
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences) {
    return this.client.patch(`/users/${userId}/notifications`, preferences)
  }

  async addEmergencyContact(userId: string, contact: EmergencyContact) {
    return this.client.post(`/users/${userId}/emergency-contacts`, contact)
  }

  async removeEmergencyContact(userId: string, contactId: string) {
    return this.client.delete(`/users/${userId}/emergency-contacts/${contactId}`)
  }

  // ==================== DISASTERS ====================
  async getDisasters(params?: {
    status?: 'ACTIVE' | 'RESOLVED' | 'MONITORING'
    type?: string
    severity?: string
    limit?: number
    offset?: number
  }) {
    return this.client.get('/disasters', { params })
  }

  async getDisasterById(id: string) {
    return this.client.get(`/disasters/${id}`)
  }

  async getNearbyDisasters(location: Location, radius: number = 100) {
    return this.client.get('/disasters/nearby', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        radius,
      },
    })
  }

  async getDisasterGuidance(disasterId: string) {
    return this.client.get(`/disasters/${disasterId}/guidance`)
  }

  async getDisasterResources(disasterId: string) {
    return this.client.get(`/disasters/${disasterId}/resources`)
  }

  async getUserRiskAssessment() {
    return this.client.get('/disasters/risk-assessment')
  }

  // ==================== ALERTS ====================
  async getAlerts(params?: { isRead?: boolean; limit?: number; offset?: number }) {
    return this.client.get('/alerts', { params })
  }

  async getUnreadAlertCount() {
    return this.client.get('/alerts/unread-count')
  }

  async getAlertById(alertId: string) {
    return this.client.get(`/alerts/${alertId}`)
  }

  async markAlertRead(alertId: string) {
    return this.client.patch(`/alerts/${alertId}/read`)
  }

  async markAllAlertsRead() {
    return this.client.patch('/alerts/read-all')
  }

  async dismissAlert(alertId: string) {
    return this.client.delete(`/alerts/${alertId}`)
  }

  // ==================== CHAT ====================
  async sendChatMessage(sessionId: string, message: string) {
    return this.client.post('/chat/message', { sessionId, message })
  }

  async getChatHistory(sessionId: string, limit: number = 50) {
    return this.client.get(`/chat/sessions/${sessionId}`, { params: { limit } })
  }

  async createChatSession(title?: string) {
    return this.client.post('/chat/sessions', { title })
  }

  async getUserChatSessions() {
    return this.client.get('/chat/sessions')
  }

  async updateChatSession(sessionId: string, title: string) {
    return this.client.patch(`/chat/sessions/${sessionId}`, { title })
  }

  async deleteChatSession(sessionId: string) {
    return this.client.delete(`/chat/sessions/${sessionId}`)
  }

  // ==================== EMERGENCY / SOS ====================
  async createSOSRequest(data: {
    location: Location
    emergencyType: string
    description?: string
    severity: string
    mediaUrls?: string[]
  }) {
    return this.client.post('/emergency/sos', data)
  }

  async getSOSTracking(sosId: string) {
    return this.client.get(`/emergency/sos/${sosId}`)
  }

  async updateSOSStatus(sosId: string, status: string, notes?: string) {
    return this.client.patch(`/emergency/sos/${sosId}`, { status, notes })
  }

  async cancelSOS(sosId: string) {
    return this.client.patch(`/emergency/sos/${sosId}/cancel`)
  }

  async getUserSOSHistory() {
    return this.client.get('/emergency/sos/history')
  }

  // ==================== RESOURCES ====================
  async getEmergencyResources(params: {
    latitude: number
    longitude: number
    radius?: number
    type?: string
    availability?: string
    limit?: number
  }) {
    return this.client.get('/emergency/resources', { params })
  }

  async getResourceById(resourceId: string) {
    return this.client.get(`/emergency/resources/${resourceId}`)
  }

  async reportResourceStatus(resourceId: string, availability: string, notes?: string) {
    return this.client.post(`/emergency/resources/${resourceId}/report`, {
      availability,
      notes,
    })
  }

  // ==================== TRANSLATION ====================
  async translateText(text: string, targetLang: string, context?: string) {
    return this.client.post('/translate', { text, targetLang, context })
  }

  async detectLanguage(text: string) {
    return this.client.post('/translate/detect', { text })
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Type definitions
export interface Location {
  latitude: number
  longitude: number
  address: string
}

export interface UserProfile {
  name: string
  email: string
  phoneNumber?: string
  preferredLanguage: string
  location?: Location
}

export interface NotificationPreferences {
  push: boolean
  sms: boolean
  email: boolean
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
  userId?: string
}
