import { DbClient } from '../db/client';

export type DiscussionStatus = 'active' | 'detected' | 'resolved' | 'archived';

export interface DiscussionStateRepository {
  getStatus(discussionId: string): Promise<DiscussionStatus | undefined>;
  setStatus(discussionId: string, status: DiscussionStatus): Promise<DiscussionStatus>;
}

export class InMemoryDiscussionStateRepository implements DiscussionStateRepository {
  private readonly stateByDiscussionId = new Map<string, DiscussionStatus>();

  async getStatus(discussionId: string): Promise<DiscussionStatus | undefined> {
    return this.stateByDiscussionId.get(discussionId);
  }

  async setStatus(discussionId: string, status: DiscussionStatus): Promise<DiscussionStatus> {
    this.stateByDiscussionId.set(discussionId, status);
    return status;
  }
}

interface DiscussionStateRow {
  discussion_id: string;
  status: DiscussionStatus;
}

export class PostgresDiscussionStateRepository implements DiscussionStateRepository {
  constructor(private readonly db: DbClient) {}

  async getStatus(discussionId: string): Promise<DiscussionStatus | undefined> {
    const result = await this.db.query<DiscussionStateRow>(
      `SELECT discussion_id, status
       FROM discussion_state_override
       WHERE discussion_id = $1`,
      [discussionId],
    );

    return result.rows[0]?.status;
  }

  async setStatus(discussionId: string, status: DiscussionStatus): Promise<DiscussionStatus> {
    await this.db.query(
      `INSERT INTO discussion_state_override (discussion_id, status, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (discussion_id) DO UPDATE
       SET status = EXCLUDED.status,
           updated_at = NOW()`,
      [discussionId, status],
    );

    return status;
  }
}