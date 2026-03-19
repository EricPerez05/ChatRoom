import { QuestionLifecycleStatus, QuestionStatus } from '../models/questionStatus';
import { DbClient } from '../db/client';

export interface QuestionStatusRepository {
  save(status: QuestionStatus): Promise<QuestionStatus>;
  findById(id: string): Promise<QuestionStatus | undefined>;
  findByQuestionMessageId(questionMessageId: string): Promise<QuestionStatus | undefined>;
  listByChannel(channelId: string): Promise<QuestionStatus[]>;
  listByChannels(channelIds: string[]): Promise<QuestionStatus[]>;
  listByStatus(status: QuestionLifecycleStatus): Promise<QuestionStatus[]>;
  listAll(): Promise<QuestionStatus[]>;
}

export class InMemoryQuestionStatusRepository implements QuestionStatusRepository {
  private readonly byId = new Map<string, QuestionStatus>();
  private readonly byQuestionMessageId = new Map<string, string>();

  constructor(initialStatuses: QuestionStatus[] = []) {
    initialStatuses.forEach((status) => this.save(status));
  }

  async save(status: QuestionStatus): Promise<QuestionStatus> {
    this.byId.set(status.id, status);
    this.byQuestionMessageId.set(status.questionMessageId, status.id);
    return status;
  }

  async findById(id: string): Promise<QuestionStatus | undefined> {
    return this.byId.get(id);
  }

  async findByQuestionMessageId(questionMessageId: string): Promise<QuestionStatus | undefined> {
    const statusId = this.byQuestionMessageId.get(questionMessageId);
    if (!statusId) {
      return undefined;
    }

    return this.byId.get(statusId);
  }

  async listByChannel(channelId: string): Promise<QuestionStatus[]> {
    return [...this.byId.values()]
      .filter((status) => status.channelId === channelId)
      .sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
  }

  async listByChannels(channelIds: string[]): Promise<QuestionStatus[]> {
    const idSet = new Set(channelIds);
    return [...this.byId.values()]
      .filter((status) => idSet.has(status.channelId))
      .sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
  }

  async listByStatus(status: QuestionLifecycleStatus): Promise<QuestionStatus[]> {
    return [...this.byId.values()]
      .filter((entry) => entry.status === status)
      .sort((left, right) => left.askedAt.getTime() - right.askedAt.getTime());
  }

  async listAll(): Promise<QuestionStatus[]> {
    return [...this.byId.values()].sort(
      (left, right) => left.askedAt.getTime() - right.askedAt.getTime(),
    );
  }
}

interface QuestionStatusRow {
  id: string;
  channel_id: string;
  question_message_id: string;
  question_content: string;
  asked_by_user_id: string;
  asked_by: string;
  asked_at: Date;
  status: QuestionLifecycleStatus;
  answered_at: Date | null;
  answered_by_user_id: string | null;
  answered_message_id: string | null;
}

const toQuestionStatus = (row: QuestionStatusRow): QuestionStatus => ({
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

export class PostgresQuestionStatusRepository implements QuestionStatusRepository {
  constructor(private readonly db: DbClient) {}

  async save(status: QuestionStatus): Promise<QuestionStatus> {
    await this.db.query(
      `INSERT INTO question_status (
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
          answered_message_id = EXCLUDED.answered_message_id`,
      [
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
      ],
    );

    return status;
  }

  async findById(id: string): Promise<QuestionStatus | undefined> {
    const result = await this.db.query<QuestionStatusRow>(
      `SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? toQuestionStatus(result.rows[0]) : undefined;
  }

  async findByQuestionMessageId(questionMessageId: string): Promise<QuestionStatus | undefined> {
    const result = await this.db.query<QuestionStatusRow>(
      `SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE question_message_id = $1`,
      [questionMessageId],
    );

    return result.rows[0] ? toQuestionStatus(result.rows[0]) : undefined;
  }

  async listByChannel(channelId: string): Promise<QuestionStatus[]> {
    const result = await this.db.query<QuestionStatusRow>(
      `SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE channel_id = $1
       ORDER BY asked_at ASC`,
      [channelId],
    );

    return result.rows.map(toQuestionStatus);
  }

  async listByChannels(channelIds: string[]): Promise<QuestionStatus[]> {
    if (channelIds.length === 0) {
      return [];
    }

    const result = await this.db.query<QuestionStatusRow>(
      `SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE channel_id = ANY($1)
       ORDER BY asked_at ASC`,
      [channelIds],
    );

    return result.rows.map(toQuestionStatus);
  }

  async listByStatus(status: QuestionLifecycleStatus): Promise<QuestionStatus[]> {
    const result = await this.db.query<QuestionStatusRow>(
      `SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       WHERE status = $1
       ORDER BY asked_at ASC`,
      [status],
    );

    return result.rows.map(toQuestionStatus);
  }

  async listAll(): Promise<QuestionStatus[]> {
    const result = await this.db.query<QuestionStatusRow>(
      `SELECT id, channel_id, question_message_id, question_content,
              asked_by_user_id, asked_by, asked_at, status,
              answered_at, answered_by_user_id, answered_message_id
       FROM question_status
       ORDER BY asked_at ASC`,
    );

    return result.rows.map(toQuestionStatus);
  }
}