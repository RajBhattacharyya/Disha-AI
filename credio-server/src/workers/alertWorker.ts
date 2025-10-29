import Queue from 'bull';
import { prisma } from '../prismaClient';
import { websocketService } from '../services/websocketService';
import { pushService } from '../services/pushService';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';

const alertQueue = new Queue('alerts', process.env.REDIS_URL!);

alertQueue.process('deliver-alert', async (job) => {
    const { alertId } = job.data;
    const alert = await prisma.alert.findUnique({ where: { id: alertId }, include: { disaster: true } });
    if (!alert) return;
    try {
        // WebSocket delivery
        await websocketService.broadcastAlert(alert);

        // Push notification delivery

        if (alert.userId) {
            await pushService.sendPushNotification(alert.userId, alert);
            // SMS for CRITICAL
            if (alert.disaster && alert.disaster.severity === 'CRITICAL') {
                await pushService.sendSMS(alert.userId, alert);
            }
        }

        await prisma.alert.update({ where: { id: alertId }, data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() } });
    } catch (error) {
        logger.error('Alert delivery failed', { alertId, error });
        throw error; // Bull will retry
    }
});

alertQueue.process('assess-risks', async (job) => {
    const activeUsers = await prisma.user.findMany({
        where: {
            updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
    });
    for (const user of activeUsers) {
        if (!user.location) continue;
        const risk = await alertService.assessUserRisk(user.id);
        // Alert if new risk detected
        if (risk.level !== 'SAFE' && risk.disasters.length > 0) {
            const existingAlert = await prisma.alert.findFirst({
                where: {
                    userId: user.id,
                    disasterId: { in: risk.disasters.map(d => d.disaster.id) }
                }
            });
            if (!existingAlert) {
                const disaster = risk.disasters[0].disaster;
                await alertService.createAlert(disaster.id, { center: user.location as any, radius: (disaster.location as any).radius });
            }
        }
    }
});

alertQueue.add('assess-risks', {}, { repeat: { cron: '*/5 * * * *' } });

export { alertQueue };
