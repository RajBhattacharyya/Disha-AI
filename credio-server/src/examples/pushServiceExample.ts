import { pushService } from '../services/pushService';

// Example usage of the PushService

async function exampleUsage() {
    // Example alert object (this would come from your alert system)
    const alert = {
        id: 'alert-123',
        disasterId: 'disaster-456',
        alertType: 'WARNING',
        message: 'Flash flood warning in your area. Seek higher ground immediately.'
    };

    const userId = 'user-789';

    try {
        // Add a device token for push notifications
        await pushService.addDeviceToken(
            userId,
            'device-token-abc123',
            'ios'
        );

        // Send push notification to a single user
        await pushService.sendPushNotification(userId, alert);

        // Send SMS to a single user
        await pushService.sendSMS(userId, alert);

        // Send bulk notifications to multiple users
        const userIds = ['user-1', 'user-2', 'user-3'];
        await pushService.sendBulkNotifications(userIds, alert);

        console.log('Notifications sent successfully');
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

// Example of how to integrate with your alert system
export async function sendDisasterAlert(disasterId: string, userIds: string[]) {
    // This would typically be called from your alert service
    const alert = {
        id: `alert-${Date.now()}`,
        disasterId,
        alertType: 'EVACUATION',
        message: 'Immediate evacuation required. Follow designated evacuation routes.'
    };

    await pushService.sendBulkNotifications(userIds, alert);
}

export { exampleUsage };