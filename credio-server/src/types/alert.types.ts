export interface Location {
  latitude: number
  longitude: number
  address?: string
  radius?: number
}

export interface RiskAssessment {
  level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN"
  disasters: Array<{
    disaster: any
    distance: number
    riskScore: number
  }>
  maxRiskScore?: number
}

export interface GeoTarget {
  center: Location
  radius: number
  includeUsers?: string[]
  excludeUsers?: string[]
}

export interface DangerZone {
  id: string
  center: Location
  radius: number
  severity: "RED" | "ORANGE" | "YELLOW" | "GREEN"
  disasterId: string
  label: string
}

export type AlertType = "WARNING" | "EVACUATION" | "ALL_CLEAR" | "UPDATE"
export type DeliveryMethod = "PUSH" | "SMS" | "EMAIL" | "IN_APP" | "WEBSOCKET"
