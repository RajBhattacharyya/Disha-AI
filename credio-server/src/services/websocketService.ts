import { Server } from 'socket.io';
import { createServer } from 'http';
import { logger } from '../utils/logger';
import { alertService } from './alertService';
import { prisma } from '../prismaClient';

class WebSocketService {
    private io: Server;

    constructor(httpServer: any) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL,
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupHandlers();
    }

    private setupHandlers() {
        this.io.on('connection', (socket) => {
            logger.info('Client connected', { socketId: socket.id });

            socket.on('subscribe-location', async (data) => {
                const { userId, location } = data;
                await prisma.user.update({ where: { id: userId }, data: { location } });
                const room = this.getLocationRoom(location);
                socket.join(room);
                socket.join(`user:${userId}`);
                logger.info('User subscribed to location', { userId, room });
                // Send immediate risk assessment
                const risk = await alertService.assessUserRisk(userId);
                socket.emit('risk-assessment', risk);
            });

            socket.on('subscribe-disaster', (disasterId) => {
                socket.join(`disaster:${disasterId}`);
            });

            socket.on('disconnect', () => {
                logger.info('Client disconnected', { socketId: socket.id });
            });
        });
    }

    // Broadcast alert to location-based rooms
    async broadcastAlert(alert: any): Promise<void> {
        const disaster = await prisma.disasterEvent.findUnique({ where: { id: alert.disasterId } });

        if (!disaster) {
            logger.warn('Disaster not found for alert', { disasterId: alert.disasterId });
            return;
        }

        const disasterLocation = disaster.location as any;
        const radius = disasterLocation?.radius || 50;
        const rooms = this.getAffectedRooms(disasterLocation, radius);

        rooms.forEach(room => {
            this.io.to(room).emit('disaster-alert', {
                id: alert.id,
                type: alert.alertType,
                severity: disaster.severity,
                title: disaster.title,
                message: alert.message,
                location: disaster.location,
                timestamp: alert.sentAt
            });
        });
        if (alert.userId) {
            this.io.to(`user:${alert.userId}`).emit('personal-alert', alert);
        }
    }

    async broadcastDisasterUpdate(disasterId: string, update: any): Promise<void> {
        this.io.to(`disaster:${disasterId}`).emit('disaster-update', update);
    }

    private getLocationRoom(location: any): string {
        const gridLat = Math.floor(location.latitude / 0.1);
        const gridLon = Math.floor(location.longitude / 0.1);
        return `loc:${gridLat}:${gridLon}`;
    }

    private getAffectedRooms(center: any, radius: number): string[] {
        const rooms: string[] = [];
        const gridSize = 0.1;
        const latRange = radius / 111;
        const lonRange = radius / (111 * Math.cos(center.latitude * Math.PI / 180));
        const minLat = Math.floor((center.latitude - latRange) / gridSize);
        const maxLat = Math.ceil((center.latitude + latRange) / gridSize);
        const minLon = Math.floor((center.longitude - lonRange) / gridSize);
        const maxLon = Math.ceil((center.longitude + lonRange) / gridSize);

        for (let lat = minLat; lat <= maxLat; lat++) {
            for (let lon = minLon; lon <= maxLon; lon++) {
                rooms.push(`loc:${lat}:${lon}`);
            }
        }
        return rooms;
    }
}

export const websocketService = new WebSocketService(createServer());
