import { DisasterEvent, DisasterType, Severity } from '@prisma/client'
import { prisma } from '../prismaClient'
import { logger } from '../utils/logger'

interface Location {
  latitude: number
  longitude: number
}

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export class FeatureEngineeringService {
  /**
   * Calculate disaster intensity on a scale of 0-100
   */
  calculateIntensity(disaster: DisasterEvent): number {
    const severityWeights: Record<Severity, number> = {
      LOW: 25,
      MEDIUM: 50,
      HIGH: 75,
      CRITICAL: 100,
    }

    const baseIntensity = severityWeights[disaster.severity] || 0

    // Adjust based on affected population
    const populationFactor = Math.min(disaster.affectedPopulation / 100000, 1) * 20

    return Math.min(baseIntensity + populationFactor, 100)
  }

  /**
   * Assess risk level based on disaster and user location
   */
  assessRiskLevel(disaster: DisasterEvent, userLocation: Location): RiskLevel {
    const disasterLocation = disaster.location as any
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      disasterLocation.latitude,
      disasterLocation.longitude
    )

    const radius = disasterLocation.radius || 50 // default 50km radius

    if (distance > radius * 2) return 'SAFE'
    if (distance > radius) return 'LOW'
    if (disaster.severity === 'LOW') return 'LOW'
    if (disaster.severity === 'MEDIUM') return 'MEDIUM'
    if (disaster.severity === 'HIGH') return 'HIGH'
    return 'CRITICAL'
  }

  /**
   * Estimate affected population based on disaster characteristics
   */
  estimateAffectedPopulation(disaster: DisasterEvent): number {
    const disasterLocation = disaster.location as any
    const radius = disasterLocation.radius || 10

    // Base population density per km² by disaster type
    const typeDensity: Partial<Record<DisasterType, number>> = {
      EARTHQUAKE: 5000,
      FLOOD: 3000,
      CYCLONE: 4000,
      HURRICANE: 4000,
      WILDFIRE: 1000,
      TORNADO: 2000,
      TSUNAMI: 6000,
      FIRE: 8000,
    }

    const density = typeDensity[disaster.type] || 2000
    const area = Math.PI * radius * radius
    const estimatedPop = Math.round(area * density)

    return estimatedPop
  }

  /**
   * Analyze climate conditions for a location
   */
  async analyzeClimateConditions(location: Location): Promise<{
    temperature: number
    humidity: number
    windSpeed: number
    precipitation: number
  }> {
    // TODO: Integrate with weather API (OpenMeteo, NOAA, etc.)
    logger.info({ message: 'Analyzing climate conditions', location })

    // Placeholder implementation
    return {
      temperature: 25,
      humidity: 65,
      windSpeed: 10,
      precipitation: 0,
    }
  }

  /**
   * Detect trends for a disaster over time
   */
  async detectTrend(disasterId: string): Promise<{
    isEscalating: boolean
    severityChange: string
    affectedPopulationTrend: number
  }> {
    const disasterData = await prisma.disasterData.findMany({
      where: { disasterId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (disasterData.length < 2) {
      return {
        isEscalating: false,
        severityChange: 'STABLE',
        affectedPopulationTrend: 0,
      }
    }

    // Simple trend analysis
    const recent = disasterData[0]
    const previous = disasterData[disasterData.length - 1]

    // Compare metrics if available from metadata
    const recentMetrics = recent.metadata as any
    const previousMetrics = previous.metadata as any

    return {
      isEscalating: recentMetrics?.intensity > previousMetrics?.intensity,
      severityChange: this.determineSeverityChange(recentMetrics, previousMetrics),
      affectedPopulationTrend: disasterData.length,
    }
  }

  /**
   * Calculate prediction confidence score
   */
  calculatePredictionConfidence(disaster: DisasterEvent): number {
    let confidence = 50 // base confidence

    // Increase confidence based on data source reliability
    const reliableSources = ['NOAA', 'USGS', 'NASA']
    if (reliableSources.includes(disaster.dataSource)) {
      confidence += 20
    }

    // Increase confidence if we have recent data
    const dataAge = Date.now() - disaster.createdAt.getTime()
    const hoursOld = dataAge / (1000 * 60 * 60)
    if (hoursOld < 1) confidence += 15
    else if (hoursOld < 6) confidence += 10
    else if (hoursOld < 24) confidence += 5

    // Adjust based on disaster type (some are more predictable)
    const predictableTypes: DisasterType[] = ['CYCLONE', 'HURRICANE', 'FLOOD']
    if (predictableTypes.includes(disaster.type)) {
      confidence += 10
    }

    return Math.min(confidence, 100)
  }

  /**
   * Helper: Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private determineSeverityChange(recent: any, previous: any): string {
    if (!recent || !previous) return 'STABLE'

    const recentIntensity = recent.intensity || 0
    const previousIntensity = previous.intensity || 0

    if (recentIntensity > previousIntensity * 1.2) return 'ESCALATING'
    if (recentIntensity < previousIntensity * 0.8) return 'DECLINING'
    return 'STABLE'
  }
}
