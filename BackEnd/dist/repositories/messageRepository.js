"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresMessageRepository = exports.InMemoryMessageRepository = void 0;
class InMemoryMessageRepository {
    constructor(initialMessages = []) {
        this.byChannel = new Map();
        this.byId = new Map();
        initialMessages.forEach((message) => {
            this.byId.set(message.id, message);
            const current = this.byChannel.get(message.channelId) || [];
            this.byChannel.set(message.channelId, [...current, message]);
        });
    }
    async listByChannel(channelId) {
        return [...(this.byChannel.get(channelId) || [])].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
    }
    async listByChannels(channelIds) {
        const idSet = new Set(channelIds);
        const all = await this.getAll();
        return all.filter((message) => idSet.has(message.channelId));
    }
    async save(message) {
        this.byId.set(message.id, message);
        const current = this.byChannel.get(message.channelId) || [];
        this.byChannel.set(message.channelId, [...current, message]);
        return message;
    }
    async getById(messageId) {
        return this.byId.get(messageId);
    }
    async getAll() {
        return [...this.byId.values()].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
    }
}
exports.InMemoryMessageRepository = InMemoryMessageRepository;
const toMessage = (row) => ({
    id: row.id,
    channelId: row.channel_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    content: row.content,
    timestamp: new Date(row.created_at),
});
class PostgresMessageRepository {
    constructor(db) {
        this.db = db;
    }
    async listByChannel(channelId) {
        const result = await this.db.query(`SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       WHERE channel_id = $1
       ORDER BY created_at ASC`, [channelId]);
        return result.rows.map(toMessage);
    }
    async listByChannels(channelIds) {
        if (channelIds.length === 0) {
            return [];
        }
        const result = await this.db.query(`SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       WHERE channel_id = ANY($1)
       ORDER BY created_at ASC`, [channelIds]);
        return result.rows.map(toMessage);
    }
    async save(message) {
        await this.db.query(`INSERT INTO messages (id, channel_id, user_id, user_name, user_avatar, content, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
       SET channel_id = EXCLUDED.channel_id,
           user_id = EXCLUDED.user_id,
           user_name = EXCLUDED.user_name,
           user_avatar = EXCLUDED.user_avatar,
           content = EXCLUDED.content,
           created_at = EXCLUDED.created_at`, [
            message.id,
            message.channelId,
            message.userId,
            message.userName,
            message.userAvatar,
            message.content,
            message.timestamp,
        ]);
        return message;
    }
    async getById(messageId) {
        const result = await this.db.query(`SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       WHERE id = $1`, [messageId]);
        return result.rows[0] ? toMessage(result.rows[0]) : undefined;
    }
    async getAll() {
        const result = await this.db.query(`SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       ORDER BY created_at ASC`);
        return result.rows.map(toMessage);
    }
}
exports.PostgresMessageRepository = PostgresMessageRepository;
