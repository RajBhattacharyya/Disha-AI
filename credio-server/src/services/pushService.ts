import admin from 'firebase-admin';
import twilio from 'twilio';
import { prisma } from '../prismaClient';
import { logger } from '../utils/logger';

interface NotificationPreferences {
  push?: boolean;
  sms?: boolean;
  email?: boolean;
}

interface DeviceToken {
  token: string;
  platform: 'ios' | 'android';
  createdAt: Date;
}

class PushService {
  private fcm: admin.messaging.Messaging | null = null;
  private twilioClient: twilio.Twilio | null = null;

  constructor() {
    this.initializeFirebase();
    this.initializeTwilio();
  }

  private initializeFirebase(): void {
    try {
      if (!process.env.FIREBASE_CREDENTIALS) {
        logger.warn('Firebase credentials not configured');
        return;
      }

      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
        });
      }

      this.fcm = admin.messaging();
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase', { error });
    }
  }

  private initializeTwilio(): void {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        logger.warn('Twilio credentials not configured');
        return;
      }

      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      logger.info('Twilio initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio', { error });
    }
  }

  async sendPushNotification(userId: string, alert: any): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true, deviceTokens: true }
      });

      if (!user) {
        logger.warn('User not found for push notification', { userId });
        return;
      }

      const preferences = user.notificationPreferences as NotificationPreferences;
      if (!preferences?.push) {
        logger.info('Push notifications disabled for user', { userId });
        return;
      }

      const deviceTokens = (user.deviceTokens as unknown) as DeviceToken[];
      if (!deviceTokens || deviceTokens.length === 0) {
        logger.info('No device tokens found for user', { userId });
        return;
      }

      const disaster = await prisma.disasterEvent.findUnique({
        where: { id: alert.disasterId }
      });

      if (!disaster) {
        logger.warn('Disaster not found for alert', { alertId: alert.id, disasterId: alert.disasterId });
        return;
      }

      const message = {
        notification: {
          title: this.getNotificationTitle(alert.alertType, disaster.severity),
          body: alert.message,
        },
        data: {
          alertId: alert.id,
          disasterId: alert.disasterId,
          alertType: alert.alertType,
          severity: disaster.severity,
          url: `/disasters/${alert.disasterId}`,
          icon: this.getDisasterIcon(disaster.type)
        },
        android: {
          priority: disaster.severity === 'CRITICAL' ? 'high' : 'normal' as 'high' | 'normal',
          notification: {
            sound: 'default',
            channelId: 'disaster-alerts',
            priority: disaster.severity === 'CRITICAL' ? 'max' : 'default' as 'max' | 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'interruption-level': disaster.severity === 'CRITICAL' ? 'critical' : 'active'
            }
          }
        }
      };

      if (!this.fcm) {
        logger.warn('Firebase not initialized, cannot send push notification', { userId });
        return;
      }

      const tokens = deviceTokens.map(dt => dt.token);
      const response = await this.fcm.sendEachForMulticast({
        tokens,
        ...message
      });

      logger.info('Push notification sent', {
        userId,
        alertId: alert.id,
        successCount: response.successCount,
        failureCount: response.failureCount,
        title: message.notification.title
      });

      // Handle failed tokens (remove invalid ones)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(userId, failedTokens);
        }
      }

      await prisma.alert.update({
        where: { id: alert.id },
        data: { deliveryStatus: 'SENT', sentAt: new Date() }
      });
    } catch (error) {
      logger.error('Push notification failed', { userId, alertId: alert.id, error });
      await prisma.alert.update({
        where: { id: alert.id },
        data: { deliveryStatus: 'FAILED' }
      });
    }
  }

  async sendSMS(userId: string, alert: any): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneNumber: true, notificationPreferences: true }
      });

      if (!user) {
        logger.warn('User not found for SMS', { userId });
        return;
      }

      const preferences = user.notificationPreferences as NotificationPreferences;
      if (!user.phoneNumber || !preferences?.sms) {
        logger.info('SMS disabled or no phone number', { userId, hasPhone: !!user.phoneNumber });
        return;
      }

      if (!this.twilioClient) {
        logger.warn('Twilio not initialized, cannot send SMS', { userId });
        return;
      }

      if (!process.env.TWILIO_PHONE_NUMBER) {
        logger.error('Twilio phone number not configured');
        return;
      }

      const smsBody = `🚨 CREDIO ALERT: ${alert.message}\n\nMore info: ${process.env.CLIENT_URL || 'https://credio.app'}/disasters/${alert.disasterId}`;

      const message = await this.twilioClient.messages.create({
        to: user.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: smsBody
      });

      logger.info('SMS sent successfully', {
        userId,
        phone: user.phoneNumber.substring(0, 3) + '***', // Log partial phone for privacy
        messageSid: message.sid,
        alertId: alert.id
      });
    } catch (error) {
      logger.error('SMS failed', { userId, alertId: alert.id, error });
    }
  }

  private getNotificationTitle(type: string, severity: string): string {
    if (severity === 'CRITICAL') return '🚨 CRITICAL ALERT';
    if (type === 'EVACUATION') return '⚠️ EVACUATION WARNING';
    if (type === 'WARNING') return '⚠️ DISASTER WARNING';
    return 'ℹ️ Disaster Update';
  }

  private getDisasterIcon(type: string): string {
    const icons: Record<string, string> = {
      FLOOD: '🌊',
      EARTHQUAKE: '🌍',
      FIRE: '🔥',
      CYCLONE: '🌀',
      LANDSLIDE: '⛰️',
      TORNADO: '🌪️',
      TSUNAMI: '🌊',
      HURRICANE: '🌀',
      WILDFIRE: '🔥',
      OTHER: '⚠️'
    };
    return icons[type] || '⚠️';
  }

  async addDeviceToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { deviceTokens: true }
      });

      if (!user) {
        logger.warn('User not found for device token update', { userId });
        return;
      }

      const existingTokens = (user.deviceTokens as unknown) as DeviceToken[];
      const tokenExists = existingTokens.some(dt => dt.token === token);

      if (!tokenExists) {
        const newToken: DeviceToken = {
          token,
          platform,
          createdAt: new Date()
        };

        const updatedTokens = [...existingTokens, newToken];

        await prisma.user.update({
          where: { id: userId },
          data: { deviceTokens: updatedTokens as any }
        });

        logger.info('Device token added', { userId, platform, tokenCount: updatedTokens.length });
      }
    } catch (error) {
      logger.error('Failed to add device token', { userId, error });
    }
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { deviceTokens: true }
      });

      if (!user) {
        logger.warn('User not found for device token removal', { userId });
        return;
      }

      const existingTokens = (user.deviceTokens as unknown) as DeviceToken[];
      const updatedTokens = existingTokens.filter(dt => dt.token !== token);

      await prisma.user.update({
        where: { id: userId },
        data: { deviceTokens: updatedTokens as any }
      });

      logger.info('Device token removed', { userId, tokenCount: updatedTokens.length });
    } catch (error) {
      logger.error('Failed to remove device token', { userId, error });
    }
  }

  private async removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { deviceTokens: true }
      });

      if (!user) return;

      const existingTokens = (user.deviceTokens as unknown) as DeviceToken[];
      const validTokens = existingTokens.filter(dt => !invalidTokens.includes(dt.token));

      await prisma.user.update({
        where: { id: userId },
        data: { deviceTokens: validTokens as any }
      });

      logger.info('Invalid device tokens removed', {
        userId,
        removedCount: invalidTokens.length,
        remainingCount: validTokens.length
      });
    } catch (error) {
      logger.error('Failed to remove invalid tokens', { userId, error });
    }
  }

  async sendBulkNotifications(userIds: string[], alert: any): Promise<void> {
    const promises = userIds.map(userId =>
      Promise.allSettled([
        this.sendPushNotification(userId, alert),
        this.sendSMS(userId, alert)
      ])
    );

    await Promise.all(promises);
    logger.info('Bulk notifications sent', { userCount: userIds.length, alertId: alert.id });
  }
}

export const pushService = new PushService();
