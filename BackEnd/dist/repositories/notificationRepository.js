"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresNotificationRepository = exports.InMemoryNotificationRepository = void 0;
class InMemoryNotificationRepository {
    constructor() {
        this.byId = new Map();
    }
    async create(notification) {
        this.byId.set(notification.id, notification);
        return notification;
    }
    async listByUser(userId) {
        return [...this.byId.values()]
            .filter((notification) => notification.userId === userId)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }
    async getById(notificationId) {
        return this.byId.get(notificationId);
    }
    async markRead(notificationId) {
        const notification = this.byId.get(notificationId);
        if (!notification) {
            return undefined;
        }
        const updated = {
            ...notification,
            isRead: true,
        };
        this.byId.set(notificationId, updated);
        return updated;
    }
}
exports.InMemoryNotificationRepository = InMemoryNotificationRepository;
const toNotification = (row) => ({
    id: row.id,
    type: row.type,
    userId: row.user_id,
    questionMessageId: row.question_message_id,
    channelId: row.channel_id,
    message: row.message,
    isRead: row.is_read,
    createdAt: new Date(row.created_at),
});
class PostgresNotificationRepository {
    constructor(db) {
        this.db = db;
    }
    async create(notification) {
        await this.db.query(`INSERT INTO notifications (id, type, user_id, question_message_id, channel_id, message, is_read, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           user_id = EXCLUDED.user_id,
           question_message_id = EXCLUDED.question_message_id,
           channel_id = EXCLUDED.channel_id,
           message = EXCLUDED.message,
           is_read = EXCLUDED.is_read,
           created_at = EXCLUDED.created_at`, [
            notification.id,
            notification.type,
            notification.userId,
            notification.questionMessageId,
            notification.channelId,
            notification.message,
            notification.isRead,
            notification.createdAt,
        ]);
        return notification;
    }
    async listByUser(userId) {
        const result = await this.db.query(`SELECT id, type, user_id, question_message_id, channel_id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`, [userId]);
        return result.rows.map(toNotification);
    }
    async getById(notificationId) {
        const result = await this.db.query(`SELECT id, type, user_id, question_message_id, channel_id, message, is_read, created_at
       FROM notifications
       WHERE id = $1`, [notificationId]);
        return result.rows[0] ? toNotification(result.rows[0]) : undefined;
    }
    async markRead(notificationId) {
        const result = await this.db.query(`UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       RETURNING id, type, user_id, question_message_id, channel_id, message, is_read, created_at`, [notificationId]);
        return result.rows[0] ? toNotification(result.rows[0]) : undefined;
    }
}
exports.PostgresNotificationRepository = PostgresNotificationRepository;
