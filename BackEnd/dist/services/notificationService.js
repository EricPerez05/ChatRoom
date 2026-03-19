"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
let notificationCounter = 1;
class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async createQuestionAnsweredNotification(status) {
        const notification = {
            id: `n-${notificationCounter++}`,
            type: 'question_answered',
            userId: status.askedByUserId,
            questionMessageId: status.questionMessageId,
            channelId: status.channelId,
            message: `Your question in #${status.channelId} was answered.`,
            isRead: false,
            createdAt: status.answeredAt || new Date(),
        };
        return this.notificationRepository.create(notification);
    }
    async listByUser(userId) {
        const notifications = await this.notificationRepository.listByUser(userId);
        return notifications.map((notification) => this.toDto(notification));
    }
    async markRead(notificationId, userId) {
        const notification = await this.notificationRepository.getById(notificationId);
        if (!notification || notification.userId !== userId) {
            return undefined;
        }
        const updated = await this.notificationRepository.markRead(notificationId);
        return updated ? this.toDto(updated) : undefined;
    }
    toDto(notification) {
        return {
            id: notification.id,
            type: notification.type,
            questionMessageId: notification.questionMessageId,
            channelId: notification.channelId,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
        };
    }
}
exports.NotificationService = NotificationService;
