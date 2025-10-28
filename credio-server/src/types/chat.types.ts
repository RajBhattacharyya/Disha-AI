export type QueryIntent =
  | "SEEKING_ADVICE"
  | "REPORTING_EMERGENCY"
  | "REQUESTING_INFO"
  | "FINDING_RESOURCES"
  | "GENERAL_QUESTION"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export interface RAGContext {
  documents: Array<{
    id: string
    content: string
    metadata: any
    score: number
  }>
  disasters: any[]
  resources: any[]
  alerts: any[]
  userLocation: any
  sources: string[]
}

export interface ChatResponse {
  response: string
  context: string[]
  intent: QueryIntent
  sessionId: string
}
