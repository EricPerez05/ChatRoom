import { Notification, NotificationDto } from '../models/notification';
import { QuestionStatus } from '../models/questionStatus';
import { NotificationRepository } from '../repositories/notificationRepository';

let notificationCounter = 1;

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async createQuestionAnsweredNotification(status: QuestionStatus): Promise<Notification> {
    const notification: Notification = {
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

  async listByUser(userId: string): Promise<NotificationDto[]> {
    const notifications = await this.notificationRepository.listByUser(userId);
    return notifications.map((notification) => this.toDto(notification));
  }

  async markRead(notificationId: string, userId: string): Promise<NotificationDto | undefined> {
    const notification = await this.notificationRepository.getById(notificationId);
    if (!notification || notification.userId !== userId) {
      return undefined;
    }

    const updated = await this.notificationRepository.markRead(notificationId);
    return updated ? this.toDto(updated) : undefined;
  }

  private toDto(notification: Notification): NotificationDto {
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