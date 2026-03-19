"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresDiscussionStateRepository = exports.InMemoryDiscussionStateRepository = void 0;
class InMemoryDiscussionStateRepository {
    constructor() {
        this.stateByDiscussionId = new Map();
    }
    async getStatus(discussionId) {
        return this.stateByDiscussionId.get(discussionId);
    }
    async setStatus(discussionId, status) {
        this.stateByDiscussionId.set(discussionId, status);
        return status;
    }
}
exports.InMemoryDiscussionStateRepository = InMemoryDiscussionStateRepository;
class PostgresDiscussionStateRepository {
    constructor(db) {
        this.db = db;
    }
    async getStatus(discussionId) {
        const result = await this.db.query(`SELECT discussion_id, status
       FROM discussion_state_override
       WHERE discussion_id = $1`, [discussionId]);
        return result.rows[0]?.status;
    }
    async setStatus(discussionId, status) {
        await this.db.query(`INSERT INTO discussion_state_override (discussion_id, status, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (discussion_id) DO UPDATE
       SET status = EXCLUDED.status,
           updated_at = NOW()`, [discussionId, status]);
        return status;
    }
}
exports.PostgresDiscussionStateRepository = PostgresDiscussionStateRepository;
