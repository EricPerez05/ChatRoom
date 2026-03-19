"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresQuestionStatusRepository = exports.InMemoryQuestionStatusRepository = void 0;
class InMemoryQuestionStatusRepository {
    constructor(initialStatuses = []) {
        this.byId = new Map();
        this.byQuestionMessageId = new Map();
        initialStatuses.forEach((status) => this.save(status));
    }
    async save(status) {
        this.byId.set(status.id, status);
        this.byQuestionMessageId.set(status.questionMessageId, status.id);
        return status;
    }
    async findById(id) {
        return this.byId.get(id);
    }
    async findByQuestionMessageId(questionMessageId) {
        const statusId = this.byQuestionMessageId.get(questionMessageId);
        if (!statusId) {
            return undefined;
        }
        return this.byId.get(statusId);
    }
    async listByChannel(channelId) {
        return [...this.byId.values()]
            .filter((status) => status.channelId === channelId)
            .sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
    }
    async listByChannels(channelIds) {
        const idSet = new Set(channelIds);
        return [...this.byId.values()]
            .filter((status) => idSet.has(status.channelId))
            .sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
    }
    async listByStatus(status) {
        return [...this.byId.values()]
            .filter((entry) => entry.status === status)
            .sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
    }
    async listAll() {
        return [...this.byId.values()].sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
    }
}
exports.InMemoryQuestionStatusRepository = InMemoryQuestionStatusRepository;
const toQuestionStatus = (row) => ({
    id: row.id,
    channelId: row.channel_id,
    questionMessageId: row.question_message_id,
    questionContent: row.question_content,
    askedByUserId: row.asked_by_user_id,
    askedBy: row.asked_by,
    askedAt: new Date(row.asked_at),
    status: row.status,
    answeredAt: row.answered_at ? new Date(row.answered_at) : undefined,
    answeredByUserId: row.answered_by_user_id || undefined,
    answeredMessageId: row.answered_message_id || undefined,
});
class PostgresQuestionStatusRepository {
    constructor(db) {
        this.db = db;
    }
    async save(status) {
        await this.db.query(`INSERT INTO question_status (
        id, channel_id, question_message_id, question_content,
        asked_by_user_id, asked_by, asked_at, status,
        answered_at, answered_by_user_id, answered_message_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE
      SET channel_id = EXCLUDED.channel_id,
          question_message_id = EXCLUDED.question_message_id,
          question_content = EXCLUDED.question_content,
          asked_by_user_id = EXCLUDED.asked_by_user_id,
          asked_by = EXCLUDED.asked_by,
          asked_at = EXCLUDED.asked_at,
          status = EXCLUDED.status,
          answered_at = EXCLUDED.answered_at,
          answered_by_user_id = EXCLUDED.answered_by_user_id,
          answered_message_id = EXCLUDED.answered_message_id`, [
            status.id,
            status.channelId,
            status.questionMessageId,
            status.questionContent,
            status.askedByUserId,
            status.askedBy,
            status.askedAt,
            status.status,
            status.answeredAt || null,
            status.answeredByUserId || null,
            status.answeredMessageId || null,
        ]);
        return status;
    }
    async findById(id) {
        const result = await this.db.query(`SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE id = $1`, [id]);
        return result.rows[0] ? toQuestionStatus(result.rows[0]) : undefined;
    }
    async findByQuestionMessageId(questionMessageId) {
        const result = await this.db.query(`SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE question_message_id = $1`, [questionMessageId]);
        return result.rows[0] ? toQuestionStatus(result.rows[0]) : undefined;
    }
    async listByChannel(channelId) {
        const result = await this.db.query(`SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE channel_id = $1
       ORDER BY asked_at ASC`, [channelId]);
        return result.rows.map(toQuestionStatus);
    }
    async listByChannels(channelIds) {
        if (channelIds.length === 0) {
            return [];
        }
        const result = await this.db.query(`SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE channel_id = ANY($1)
       ORDER BY asked_at ASC`, [channelIds]);
        return result.rows.map(toQuestionStatus);
    }
    async listByStatus(status) {
        const result = await this.db.query(`SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE status = $1
       ORDER BY asked_at ASC`, [status]);
        return result.rows.map(toQuestionStatus);
    }
    async listAll() {
        const result = await this.db.query(`SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       ORDER BY asked_at ASC`);
        return result.rows.map(toQuestionStatus);
    }
}
exports.PostgresQuestionStatusRepository = PostgresQuestionStatusRepository;
