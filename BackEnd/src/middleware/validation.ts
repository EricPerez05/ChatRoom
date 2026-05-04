import { Request } from 'express';
import { ApiError } from './apiError';

export const parseChannelIdsQuery = (req: Request): string[] | undefined => {
  const raw = req.query.channelIds;
  if (typeof raw !== 'string') {
    return undefined;
  }

  const parsed = raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : undefined;
};

export const requireUserIdQuery = (req: Request): string => {
  const raw = req.query.userId;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new ApiError(400, 'Query param userId is required');
  }

  const userId = raw.trim();

  if (req.user && req.user.id !== userId) {
    throw new ApiError(403, 'Forbidden: cannot access notifications for another user');
  }

  return userId;
};

export const requireNotificationReadBody = (req: Request): boolean => {
  const read = (req.body as { read?: unknown } | undefined)?.read;
  if (read !== true) {
    throw new ApiError(400, 'Body must include read=true');
  }

  return true;
};

export interface MessageCreateBody {
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  simulateConversation?: boolean;
}

export const parseMessageCreateBody = (req: Request): MessageCreateBody => {
  const body = req.body as MessageCreateBody | undefined;

  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body is required');
  }

  if (typeof body.userId !== 'string' || body.userId.trim().length === 0) {
    throw new ApiError(400, 'userId is required');
  }

  if (typeof body.userName !== 'string' || body.userName.trim().length === 0) {
    throw new ApiError(400, 'userName is required');
  }

  if (typeof body.content !== 'string' || body.content.trim().length === 0) {
    throw new ApiError(400, 'content is required');
  }

  if (body.content.length > 2000) {
    throw new ApiError(400, 'content exceeds 2000 characters');
  }

  if (req.user && req.user.id !== body.userId.trim()) {
    throw new ApiError(403, 'Forbidden: user mismatch');
  }

  const simulateConversation = body.simulateConversation === true;

  return {
    userId: body.userId.trim(),
    userName: body.userName.trim(),
    userAvatar: typeof body.userAvatar === 'string' && body.userAvatar.trim().length > 0
      ? body.userAvatar.trim()
      : undefined,
    content: body.content.trim(),
    simulateConversation,
  };
};

export const parseChannelIdParam = (req: Request): string => {
  const channelId = req.params.channelId;
  if (!channelId || typeof channelId !== 'string') {
    throw new ApiError(400, 'Invalid channelId');
  }

  return channelId;
};

export const parseNotificationIdParam = (req: Request): string => {
  const notificationId = req.params.notificationId;
  if (!notificationId || typeof notificationId !== 'string') {
    throw new ApiError(400, 'Invalid notificationId');
  }

  return notificationId;
};

export const parseQuestionIdParam = (req: Request): string => {
  const questionId = req.params.questionId;
  if (!questionId || typeof questionId !== 'string') {
    throw new ApiError(400, 'Invalid questionId');
  }

  return questionId;
};

export const parseDiscussionIdParam = (req: Request): string => {
  const discussionId = req.params.discussionId;
  if (!discussionId || typeof discussionId !== 'string') {
    throw new ApiError(400, 'Invalid discussionId');
  }

  return discussionId;
};

export type DiscussionStatus = 'active' | 'detected' | 'resolved' | 'archived';

export const parseDiscussionStatusBody = (req: Request): DiscussionStatus => {
  const status = (req.body as { status?: unknown } | undefined)?.status;
  const allowedStatuses: DiscussionStatus[] = ['active', 'detected', 'resolved', 'archived'];

  if (typeof status !== 'string' || !allowedStatuses.includes(status as DiscussionStatus)) {
    throw new ApiError(400, 'Body must include status: active|detected|resolved|archived');
  }

  return status as DiscussionStatus;
};

export const parseServerIdParam = (req: Request): string => {
  const serverId = req.params.serverId;
  if (!serverId || typeof serverId !== 'string') {
    throw new ApiError(400, 'Invalid serverId');
  }

  return serverId;
};

export const parseGroupIdParam = (req: Request): string => {
  const groupId = req.params.groupId;
  if (!groupId || typeof groupId !== 'string') {
    throw new ApiError(400, 'Invalid groupId');
  }

  return groupId;
};

interface ChannelCreateBody {
  name: string;
  category?: string;
  type?: 'text' | 'voice';
}

export const parseChannelCreateBody = (req: Request): ChannelCreateBody => {
  const body = req.body as ChannelCreateBody | undefined;
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw new ApiError(400, 'name is required');
  }

  const name = body.name.trim();
  if (name.length > 64) {
    throw new ApiError(400, 'name exceeds 64 characters');
  }

  const type = body.type === 'voice' ? 'voice' : 'text';
  const category = typeof body.category === 'string' && body.category.trim().length > 0
    ? body.category.trim()
    : 'TEXT CHANNELS';

  return {
    name,
    category,
    type,
  };
};