// Test setup file - runs before all tests
import { config } from 'dotenv'

// Load environment variables
config()

// Mock environment variables for testing
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-api-key'
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.NODE_ENV = 'test'

// Increase timeout for async operations
jest.setTimeout(30000)

// Global test utilities can be added here
