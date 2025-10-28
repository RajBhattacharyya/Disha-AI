import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { DataIngestionService } from '../services/dataIngestion'

// Mock dependencies
jest.mock('../prismaClient', () => ({
    prisma: {
        disasterEvent: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}))

jest.mock('../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}))

jest.mock('../services/dataSources/noaa', () => ({
    fetchNOAAAlerts: jest.fn(),
}))

describe('DataIngestionService', () => {
    let service: DataIngestionService

    beforeEach(() => {
        service = new DataIngestionService()
        jest.clearAllMocks()
    })

    describe('cleanData', () => {
        test('should remove duplicate entries', async () => {
            const duplicateData = [
                { id: '1', type: 'FLOOD', severity: 'HIGH' },
                { id: '2', type: 'FIRE', severity: 'MEDIUM' },
                { id: '1', type: 'FLOOD', severity: 'HIGH' }, // Duplicate
            ]

            const cleaned = await service.cleanData(duplicateData)

            expect(cleaned.length).toBe(2)
            expect(cleaned).toEqual([
                { id: '1', type: 'FLOOD', severity: 'HIGH' },
                { id: '2', type: 'FIRE', severity: 'MEDIUM' },
            ])
        })

        test('should handle empty array', async () => {
            const cleaned = await service.cleanData([])
            expect(cleaned).toEqual([])
        })
    })

    describe('validateData', () => {
        test('should validate correct data structure', async () => {
            const validData = [
                {
                    type: 'EARTHQUAKE',
                    severity: 'HIGH',
                    location: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                    },
                },
            ]

            const validated = await service.validateData(validData)
            expect(validated).toHaveLength(1)
            expect(validated[0].type).toBe('EARTHQUAKE')
        })

        test('should throw error for invalid data', async () => {
            const invalidData = [
                {
                    type: 'EARTHQUAKE',
                    severity: 'HIGH',
                    // Missing location
                },
            ]

            await expect(service.validateData(invalidData)).rejects.toThrow()
        })
    })

    describe('ingestFromSource', () => {
        test('should handle unknown source', async () => {
            const result = await service.ingestFromSource('unknown-source')

            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })
    })
})
