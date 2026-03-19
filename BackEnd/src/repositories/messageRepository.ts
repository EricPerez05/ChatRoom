import { Message } from '../models/message';
import { DbClient } from '../db/client';

export interface MessageRepository {
  listByChannel(channelId: string): Promise<Message[]>;
  listByChannels(channelIds: string[]): Promise<Message[]>;
  save(message: Message): Promise<Message>;
  getById(messageId: string): Promise<Message | undefined>;
  getAll(): Promise<Message[]>;
}

export class InMemoryMessageRepository implements MessageRepository {
  private readonly byChannel = new Map<string, Message[]>();
  private readonly byId = new Map<string, Message>();

  constructor(initialMessages: Message[] = []) {
    initialMessages.forEach((message) => {
      this.byId.set(message.id, message);
      const current = this.byChannel.get(message.channelId) || [];
      this.byChannel.set(message.channelId, [...current, message]);
    });
  }

  async listByChannel(channelId: string): Promise<Message[]> {
    return [...(this.byChannel.get(channelId) || [])].sort(
      (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
    );
  }

  async listByChannels(channelIds: string[]): Promise<Message[]> {
    const idSet = new Set(channelIds);
    const all = await this.getAll();
    return all.filter((message) => idSet.has(message.channelId));
  }

  async save(message: Message): Promise<Message> {
    this.byId.set(message.id, message);
    const current = this.byChannel.get(message.channelId) || [];
    this.byChannel.set(message.channelId, [...current, message]);
    return message;
  }

  async getById(messageId: string): Promise<Message | undefined> {
    return this.byId.get(messageId);
  }

  async getAll(): Promise<Message[]> {
    return [...this.byId.values()].sort(
      (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
    );
  }
}

interface MessageRow {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: Date;
}

const toMessage = (row: MessageRow): Message => ({
  id: row.id,
  channelId: row.channel_id,
  userId: row.user_id,
  userName: row.user_name,
  userAvatar: row.user_avatar,
  content: row.content,
  timestamp: new Date(row.created_at),
});

export class PostgresMessageRepository implements MessageRepository {
  constructor(private readonly db: DbClient) {}

  async listByChannel(channelId: string): Promise<Message[]> {
    const result = await this.db.query<MessageRow>(
      `SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       WHERE channel_id = $1
       ORDER BY created_at ASC`,
      [channelId],
    );

    return result.rows.map(toMessage);
  }

  async listByChannels(channelIds: string[]): Promise<Message[]> {
    if (channelIds.length === 0) {
      return [];
    }

    const result = await this.db.query<MessageRow>(
      `SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       WHERE channel_id = ANY($1)
       ORDER BY created_at ASC`,
      [channelIds],
    );

    return result.rows.map(toMessage);
  }

  async save(message: Message): Promise<Message> {
    await this.db.query(
      `INSERT INTO messages (id, channel_id, user_id, user_name, user_avatar, content, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
       SET channel_id = EXCLUDED.channel_id,
           user_id = EXCLUDED.user_id,
           user_name = EXCLUDED.user_name,
           user_avatar = EXCLUDED.user_avatar,
           content = EXCLUDED.content,
           created_at = EXCLUDED.created_at`,
      [
        message.id,
        message.channelId,
        message.userId,
        message.userName,
        message.userAvatar,
        message.content,
        message.timestamp,
      ],
    );

    return message;
  }

  async getById(messageId: string): Promise<Message | undefined> {
    const result = await this.db.query<MessageRow>(
      `SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       WHERE id = $1`,
      [messageId],
    );

    return result.rows[0] ? toMessage(result.rows[0]) : undefined;
  }

  async getAll(): Promise<Message[]> {
    const result = await this.db.query<MessageRow>(
      `SELECT id, channel_id, user_id, user_name, user_avatar, content, created_at
       FROM messages
       ORDER BY created_at ASC`,
    );

    return result.rows.map(toMessage);
  }
}