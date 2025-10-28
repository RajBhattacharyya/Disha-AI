import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { FeatureEngineeringService } from '../services/featureEngineering'
import { DisasterEvent, DisasterType, Severity, DisasterStatus } from '@prisma/client'

describe('FeatureEngineeringService', () => {
    let service: FeatureEngineeringService

    beforeEach(() => {
        service = new FeatureEngineeringService()
    })

    describe('calculateIntensity', () => {
        test('should calculate intensity for LOW severity disaster', () => {
            const disaster: DisasterEvent = {
                id: '1',
                type: DisasterType.EARTHQUAKE,
                severity: Severity.LOW,
                location: { latitude: 40.7128, longitude: -74.0060 },
                title: 'Test Earthquake',
                description: 'Test description',
                status: DisasterStatus.ACTIVE,
                dataSource: 'USGS',
                predictedImpact: {},
                affectedPopulation: 1000,
                startTime: new Date(),
                endTime: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const intensity = service.calculateIntensity(disaster)

            expect(intensity).toBeGreaterThanOrEqual(0)
            expect(intensity).toBeLessThanOrEqual(100)
            expect(intensity).toBeCloseTo(25, 0) // Base for LOW severity
        })

        test('should calculate intensity for CRITICAL severity disaster', () => {
            const disaster: DisasterEvent = {
                id: '2',
                type: DisasterType.HURRICANE,
                severity: Severity.CRITICAL,
                location: { latitude: 40.7128, longitude: -74.0060 },
                title: 'Test Hurricane',
                description: 'Test description',
                status: DisasterStatus.ACTIVE,
                dataSource: 'NOAA',
                predictedImpact: {},
                affectedPopulation: 100000,
                startTime: new Date(),
                endTime: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const intensity = service.calculateIntensity(disaster)

            expect(intensity).toBe(100) // Max intensity
        })
    })

    describe('assessRiskLevel', () => {
        test('should return SAFE for distant location', () => {
            const disaster: DisasterEvent = {
                id: '3',
                type: DisasterType.WILDFIRE,
                severity: Severity.HIGH,
                location: { latitude: 40.7128, longitude: -74.0060, radius: 10 },
                title: 'Test Wildfire',
                description: 'Test description',
                status: DisasterStatus.ACTIVE,
                dataSource: 'NASA',
                predictedImpact: {},
                affectedPopulation: 5000,
                startTime: new Date(),
                endTime: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const userLocation = { latitude: 50.0, longitude: -80.0 } // Very far away

            const riskLevel = service.assessRiskLevel(disaster, userLocation)

            expect(riskLevel).toBe('SAFE')
        })

        test('should return CRITICAL for nearby CRITICAL severity disaster', () => {
            const disaster: DisasterEvent = {
                id: '4',
                type: DisasterType.EARTHQUAKE,
                severity: Severity.CRITICAL,
                location: { latitude: 40.7128, longitude: -74.0060, radius: 50 },
                title: 'Test Earthquake',
                description: 'Test description',
                status: DisasterStatus.ACTIVE,
                dataSource: 'USGS',
                predictedImpact: {},
                affectedPopulation: 50000,
                startTime: new Date(),
                endTime: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const userLocation = { latitude: 40.7128, longitude: -74.0060 } // Same location

            const riskLevel = service.assessRiskLevel(disaster, userLocation)

            expect(riskLevel).toBe('CRITICAL')
        })
    })

    describe('estimateAffectedPopulation', () => {
        test('should estimate population for earthquake', () => {
            const disaster: DisasterEvent = {
                id: '5',
                type: DisasterType.EARTHQUAKE,
                severity: Severity.HIGH,
                location: { latitude: 40.7128, longitude: -74.0060, radius: 10 },
                title: 'Test Earthquake',
                description: 'Test description',
                status: DisasterStatus.ACTIVE,
                dataSource: 'USGS',
                predictedImpact: {},
                affectedPopulation: 0,
                startTime: new Date(),
                endTime: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const estimated = service.estimateAffectedPopulation(disaster)

            expect(estimated).toBeGreaterThan(0)
            expect(typeof estimated).toBe('number')
        })
    })

    describe('calculatePredictionConfidence', () => {
        test('should give high confidence for reliable source with recent data', () => {
            const disaster: DisasterEvent = {
                id: '6',
                type: DisasterType.CYCLONE,
                severity: Severity.HIGH,
                location: { latitude: 40.7128, longitude: -74.0060 },
                title: 'Test Cyclone',
                description: 'Test description',
                status: DisasterStatus.ACTIVE,
                dataSource: 'NOAA',
                predictedImpact: {},
                affectedPopulation: 25000,
                startTime: new Date(),
                endTime: null,
                metadata: {},
                createdAt: new Date(), // Very recent
                updatedAt: new Date(),
            }

            const confidence = service.calculatePredictionConfidence(disaster)

            expect(confidence).toBeGreaterThanOrEqual(50)
            expect(confidence).toBeLessThanOrEqual(100)
            expect(confidence).toBeGreaterThan(70) // Should be high for NOAA + recent + predictable type
        })

        test('should give lower confidence for unreliable source', () => {
            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 10) // 10 days ago

            const disaster: DisasterEvent = {
                id: '7',
                type: DisasterType.OTHER,
                severity: Severity.MEDIUM,
                location: { latitude: 40.7128, longitude: -74.0060 },
                title: 'Test Event',
                description: 'Test description',
                status: DisasterStatus.MONITORING,
                dataSource: 'Unknown',
                predictedImpact: {},
                affectedPopulation: 1000,
                startTime: oldDate,
                endTime: null,
                metadata: {},
                createdAt: oldDate,
                updatedAt: oldDate,
            }

            const confidence = service.calculatePredictionConfidence(disaster)

            expect(confidence).toBeLessThanOrEqual(60) // Lower confidence
        })
    })
})
