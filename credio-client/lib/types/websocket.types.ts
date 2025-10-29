export interface DisasterAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  location: {
    latitude: number
    longitude: number
    address: string
    radius: number
  }
  timestamp: string
}

export interface PersonalAlert {
  id: string
  alertType: 'WARNING' | 'EVACUATION' | 'UPDATE' | 'ALL_CLEAR'
  message: string
  disasterId: string
  userId: string
  timestamp: string
}

export interface RiskAssessment {
  level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  disasters: Array<{
    disaster: {
      id: string
      type: string
      severity: string
      title: string
    }
    distance: number
    impact: string
  }>
  recommendations: string[]
}

export interface DisasterUpdate {
  disasterId: string
  updateType: 'STATUS_CHANGE' | 'NEW_INFO' | 'RESOURCE_AVAILABLE' | 'EVACUATION_ORDER'
  message: string
  timestamp: string
}

export interface SOSUpdate {
  sosId: string
  status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
  responder?: {
    name: string
    eta: string
  }
  timestamp: string
}

export interface EmergencyBroadcast {
  id: string
  title: string
  message: string
  severity: 'CRITICAL'
  region: string
  timestamp: string
}
