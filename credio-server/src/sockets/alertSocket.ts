import { Server as SocketIOServer } from "socket.io"
import { logger } from "../utils/logger"

class SocketService {
  private io: SocketIOServer | null = null

  initialize(server: any): void {
    this.io = new SocketIOServer(server, {
      cors: { origin: "*" },
    })

    this.io.on("connection", (socket) => {
      logger.info("Client connected", { socketId: socket.id })

      // User authentication and room joining
      socket.on("authenticate", (userId: string) => {
        socket.join(`user:${userId}`)
        logger.info("User authenticated", { userId, socketId: socket.id })
      })

      socket.on("disconnect", () => {
        logger.info("Client disconnected", { socketId: socket.id })
      })
    })
  }

  // Send alert to specific user
  sendAlertToUser(userId: string, alert: any): void {
    if (!this.io) {
      logger.error("Socket.io not initialized")
      return
    }

    this.io.to(`user:${userId}`).emit("alert", alert)
    logger.info("Alert sent via WebSocket", { userId, alertId: alert.id })
  }

  // Broadcast alert to all users in region
  broadcastRegionalAlert(region: string, alert: any): void {
    if (!this.io) {
      logger.error("Socket.io not initialized")
      return
    }

    this.io.to(`region:${region}`).emit("alert", alert)
    logger.info("Regional alert broadcast", { region })
  }
}

export const socketService = new SocketService()
