import { Notification } from '../models/notification';
import { DbClient } from '../db/client';

export interface NotificationRepository {
  create(notification: Notification): Promise<Notification>;
  listByUser(userId: string): Promise<Notification[]>;
  getById(notificationId: string): Promise<Notification | undefined>;
  markRead(notificationId: string): Promise<Notification | undefined>;
}

export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly byId = new Map<string, Notification>();

  async create(notification: Notification): Promise<Notification> {
    this.byId.set(notification.id, notification);
    return notification;
  }

  async listByUser(userId: string): Promise<Notification[]> {
    return [...this.byId.values()]
      .filter((notification) => notification.userId === userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async getById(notificationId: string): Promise<Notification | undefined> {
    return this.byId.get(notificationId);
  }

  async markRead(notificationId: string): Promise<Notification | undefined> {
    const notification = this.byId.get(notificationId);
    if (!notification) {
      return undefined;
    }

    const updated: Notification = {
      ...notification,
      isRead: true,
    };

    this.byId.set(notificationId, updated);
    return updated;
  }
}

interface NotificationRow {
  id: string;
  type: 'question_answered';
  user_id: string;
  question_message_id: string;
  channel_id: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

const toNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type,
  userId: row.user_id,
  questionMessageId: row.question_message_id,
  channelId: row.channel_id,
  message: row.message,
  isRead: row.is_read,
  createdAt: new Date(row.created_at),
});

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly db: DbClient) {}

  async create(notification: Notification): Promise<Notification> {
    await this.db.query(
      `INSERT INTO notifications (id, type, user_id, question_message_id, channel_id, message, is_read, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           user_id = EXCLUDED.user_id,
           question_message_id = EXCLUDED.question_message_id,
           channel_id = EXCLUDED.channel_id,
           message = EXCLUDED.message,
           is_read = EXCLUDED.is_read,
           created_at = EXCLUDED.created_at`,
      [
        notification.id,
        notification.type,
        notification.userId,
        notification.questionMessageId,
        notification.channelId,
        notification.message,
        notification.isRead,
        notification.createdAt,
      ],
    );
    return notification;
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const result = await this.db.query<NotificationRow>(
      `SELECT id, type, user_id, question_message_id, channel_id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows.map(toNotification);
  }

  async getById(notificationId: string): Promise<Notification | undefined> {
    const result = await this.db.query<NotificationRow>(
      `SELECT id, type, user_id, question_message_id, channel_id, message, is_read, created_at
       FROM notifications
       WHERE id = $1`,
      [notificationId],
    );

    return result.rows[0] ? toNotification(result.rows[0]) : undefined;
  }

  async markRead(notificationId: string): Promise<Notification | undefined> {
    const result = await this.db.query<NotificationRow>(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       RETURNING id, type, user_id, question_message_id, channel_id, message, is_read, created_at`,
      [notificationId],
    );

    return result.rows[0] ? toNotification(result.rows[0]) : undefined;
  }
}