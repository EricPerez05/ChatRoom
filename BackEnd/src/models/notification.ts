export type NotificationType = 'question_answered';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  questionMessageId: string;
  channelId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  questionMessageId: string;
  channelId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}