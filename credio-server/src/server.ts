import 'dotenv/config'
import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { websocketService } from './services/websocketService'
import { logger } from './utils/logger'
import adminRoutes from './routes/adminRoutes'

const app: Application = express()

// If behind Cloudflare/nginx, enable trust proxy so req.ip and proto work properly
app.set('trust proxy', 1)

const httpServer = createServer(app)

// Socket.IO server options tuned for your deployment
const io = new Server(httpServer, {
  path: '/socket.io', // upstream path; cloudflared/nginx rewrites /disha-ai/socket.io -> /socket.io
  transports: ['websocket'], // you only accept websocket (polling returns "Transport unknown")
  allowEIO3: false, // keep Engine.IO v4 behavior
  pingInterval: 25000, // defaults are fine; match client or tune
  pingTimeout: 20000,
  maxHttpBufferSize: 1_000_000, // keep or adjust for payload limits
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      process.env.SERVER_URL || 'https://server.uemcseaiml.org', // allow server domain too
    ],
    credentials: true,
  },
})

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      process.env.SERVER_URL || 'https://server.uemcseaiml.org',
    ],
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api', routes)
app.use('/api/admin', adminRoutes)

// Error handling
app.use(errorHandler)

// Initialize WebSocket
websocketService.initialize(io)

const PORT = Number(process.env.PORT) || 8015

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})

export { app, httpServer, io }
