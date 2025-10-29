export interface SOSRequestData {
  userId: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  emergencyType: 'MEDICAL' | 'FIRE' | 'TRAPPED' | 'INJURY' | 'NATURAL_DISASTER' | 'OTHER'
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  mediaUrls: string[]
}

export interface SOSResponse {
  sosId: string
  status: string
  estimatedResponse: string
  trackingUrl: string
}

export type SOSStatus = 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
