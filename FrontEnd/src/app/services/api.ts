import {
  CreateMessageInput,
  DetectedDiscussion,
  DetectedQuestion,
  Member,
  Message,
  PostMessageResult,
  Notification,
  Channel,
  Server,
} from '../types/chat';

const API_BASE_URL = (
  // In production, default to same-origin so reverse proxies/CDNs work without extra config.
  ((import.meta as ImportMeta & { env?: { DEV?: boolean; VITE_API_URL?: string } }).env?.VITE_API_URL
    || ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV ? 'http://localhost:4000' : ''))
);

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }

  return response.json() as Promise<T>;
};

const fetchJsonWithInit = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }

  return response.json() as Promise<T>;
};

const deserializeMessage = (message: Omit<Message, 'timestamp'> & { timestamp: string | Date }): Message => ({
  ...message,
  timestamp: new Date(message.timestamp),
});

const deserializeNotification = (
  notification: Omit<Notification, 'createdAt'> & { createdAt: string | Date },
): Notification => ({
  ...notification,
  createdAt: new Date(notification.createdAt),
});

const deserializeQuestion = (
  question: Omit<DetectedQuestion, 'askedAt'> & { askedAt: string | Date },
): DetectedQuestion => ({
  ...question,
  askedAt: new Date(question.askedAt),
});

const deserializeDiscussion = (
  discussion: Omit<DetectedDiscussion, 'lastActivity'> & { lastActivity: string | Date },
): DetectedDiscussion => ({
  ...discussion,
  lastActivity: new Date(discussion.lastActivity),
});

export const getServers = async (): Promise<Server[]> => fetchJson<Server[]>('/api/servers');

export const getGroups = async (): Promise<Server[]> => fetchJson<Server[]>('/api/groups');

export const getMembers = async (): Promise<Member[]> => fetchJson<Member[]>('/api/members');

export const createServerChannel = async (
  serverId: string,
  payload: Pick<Channel, 'name' | 'type' | 'category'>,
): Promise<Channel> => {
  return fetchJsonWithInit<Channel>(`/api/servers/${serverId}/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'u-you',
    },
    body: JSON.stringify(payload),
  });
};

export const createGroupChannel = async (
  groupId: string,
  payload: Pick<Channel, 'name' | 'type' | 'category'>,
): Promise<Channel> => {
  return fetchJsonWithInit<Channel>(`/api/groups/${groupId}/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'u-you',
    },
    body: JSON.stringify(payload),
  });
};

export const getChannelMessages = async (channelId: string): Promise<Message[]> => {
  const messages = await fetchJson<Array<Omit<Message, 'timestamp'> & { timestamp: string | Date }>>(
    `/api/channels/${channelId}/messages`,
  );
  return messages.map(deserializeMessage);
};

export const postChannelMessage = async (
  channelId: string,
  payload: CreateMessageInput,
): Promise<PostMessageResult> => {
  const result = await fetchJsonWithInit<{
    message: Omit<Message, 'timestamp'> & { timestamp: string | Date };
    simulated: Array<Omit<Message, 'timestamp'> & { timestamp: string | Date }>;
  }>(
    `/api/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': payload.userId,
      },
      body: JSON.stringify(payload),
    },
  );

  return {
    message: deserializeMessage(result.message),
    simulated: result.simulated.map(deserializeMessage),
  };
};

export const getQuestions = async (channelIds?: string[]): Promise<DetectedQuestion[]> => {
  const query = channelIds && channelIds.length > 0
    ? `?channelIds=${encodeURIComponent(channelIds.join(','))}`
    : '';

  const questions = await fetchJson<
    Array<Omit<DetectedQuestion, 'askedAt'> & { askedAt: string | Date }>
  >(`/api/questions${query}`);

  return questions.map(deserializeQuestion);
};

export const getDiscussions = async (channelIds?: string[]): Promise<DetectedDiscussion[]> => {
  const query = channelIds && channelIds.length > 0
    ? `?channelIds=${encodeURIComponent(channelIds.join(','))}`
    : '';

  const discussions = await fetchJson<
    Array<Omit<DetectedDiscussion, 'lastActivity'> & { lastActivity: string | Date }>
  >(`/api/discussions${query}`);

  return discussions.map(deserializeDiscussion);
};

export const markQuestionAnswered = async (questionId: string): Promise<void> => {
  await fetchJsonWithInit(`/api/questions/${questionId}/answered`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'u-you',
    },
    body: JSON.stringify({}),
  });
};

export const updateDiscussionStatus = async (
  discussionId: string,
  status: 'active' | 'detected' | 'resolved' | 'archived',
): Promise<void> => {
  await fetchJsonWithInit(`/api/discussions/${discussionId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'u-you',
    },
    body: JSON.stringify({ status }),
  });
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const notifications = await fetchJson<
    Array<Omit<Notification, 'createdAt'> & { createdAt: string | Date }>
  >(`/api/notifications?userId=${encodeURIComponent(userId)}`);

  return notifications.map(deserializeNotification);
};

export const markNotificationRead = async (
  notificationId: string,
  userId: string,
): Promise<Notification> => {
  const notification = await fetchJsonWithInit<
    Omit<Notification, 'createdAt'> & { createdAt: string | Date }
  >(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ read: true }),
  });

  return deserializeNotification(notification);
};
