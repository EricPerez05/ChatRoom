import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  createGroupChannel,
  createServerChannel,
  getChannelMessages,
  getDiscussions,
  getGroups,
  getMembers,
  getNotifications,
  getQuestions,
  getServers,
  markNotificationRead,
  markQuestionAnswered,
  postChannelMessage,
  updateDiscussionStatus,
} from '../../src/app/services/api';
import { installFetchMock, mockFetchJson } from './mocks/fetchMock';

describe('api.ts', () => {
  beforeEach(() => {
    installFetchMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getServers returns parsed server list', async () => {
    const payload = [{ id: 's1', name: 'Server 1', channels: [] }];
    mockFetchJson(payload);

    await expect(getServers()).resolves.toEqual(payload);
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:4000/api/servers');
  });

  it('getGroups returns parsed group list', async () => {
    const payload = [{ id: 'g1', name: 'Group 1', channels: [] }];
    mockFetchJson(payload);

    await expect(getGroups()).resolves.toEqual(payload);
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:4000/api/groups');
  });

  it('getMembers returns parsed member list', async () => {
    const payload = [{ id: 'u1', name: 'Alex', avatar: 'A', status: 'online' }];
    mockFetchJson(payload);

    await expect(getMembers()).resolves.toEqual(payload);
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:4000/api/members');
  });

  it('createServerChannel posts to server channel endpoint', async () => {
    const payload = { name: 'new-channel', type: 'text', category: 'TEXT CHANNELS' } as const;
    const created = { id: 'c1', ...payload };
    mockFetchJson(created);

    await expect(createServerChannel('s1', payload)).resolves.toEqual(created);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/servers/s1/channels',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-user-id': 'u-you',
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it('createGroupChannel posts to group channel endpoint', async () => {
    const payload = {
      name: 'new-group-channel',
      type: 'text',
      category: 'TEXT CHANNELS',
    } as const;
    const created = { id: 'gc1', ...payload };
    mockFetchJson(created);

    await expect(createGroupChannel('g1', payload)).resolves.toEqual(created);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/groups/g1/channels',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
  });

  it('getChannelMessages deserializes timestamp values to Date', async () => {
    mockFetchJson([
      {
        id: 'm1',
        channelId: 'c1',
        userId: 'u1',
        userName: 'Alex',
        userAvatar: 'A',
        content: 'hello',
        timestamp: '2026-04-04T12:00:00.000Z',
      },
    ]);

    const messages = await getChannelMessages('c1');

    expect(messages).toHaveLength(1);
    expect(messages[0].timestamp).toBeInstanceOf(Date);
    expect(messages[0].timestamp.toISOString()).toBe('2026-04-04T12:00:00.000Z');
  });

  it('postChannelMessage sends x-user-id from payload and deserializes timestamp', async () => {
    mockFetchJson({
      id: 'm2',
      channelId: 'c1',
      userId: 'u7',
      userName: 'Sam',
      userAvatar: 'S',
      content: 'reply',
      timestamp: '2026-04-04T12:05:00.000Z',
    });

    const created = await postChannelMessage('c1', {
      userId: 'u7',
      userName: 'Sam',
      content: 'reply',
    });

    expect(created.timestamp).toBeInstanceOf(Date);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/channels/c1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-user-id': 'u7',
        }),
      }),
    );
  });

  it('getQuestions appends channelIds query and deserializes askedAt', async () => {
    mockFetchJson([
      {
        id: 'q1',
        content: 'How do I deploy?',
        askedBy: 'Jordan',
        askedAt: '2026-04-04T10:00:00.000Z',
        channelId: 'c1',
        channelName: 'general',
        messageId: 'm44',
      },
    ]);

    const questions = await getQuestions(['c1', 'c2']);

    expect(questions[0].askedAt).toBeInstanceOf(Date);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/questions?channelIds=c1%2Cc2',
    );
  });

  it('getDiscussions appends channelIds query and deserializes lastActivity', async () => {
    mockFetchJson([
      {
        id: 'd1',
        topic: 'Release plan',
        status: 'active',
        participants: ['Alex', 'Sam'],
        lastActivity: '2026-04-04T10:30:00.000Z',
        channelId: 'c1',
        channelName: 'general',
        messageCount: 6,
        messageId: 'm8',
      },
    ]);

    const discussions = await getDiscussions(['c1']);

    expect(discussions[0].lastActivity).toBeInstanceOf(Date);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/discussions?channelIds=c1',
    );
  });

  it('markQuestionAnswered sends PATCH request to answered endpoint', async () => {
    mockFetchJson({});

    await expect(markQuestionAnswered('q1')).resolves.toBeUndefined();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/questions/q1/answered',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });

  it('updateDiscussionStatus sends PATCH with status payload', async () => {
    mockFetchJson({});

    await expect(updateDiscussionStatus('d1', 'resolved')).resolves.toBeUndefined();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/discussions/d1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      }),
    );
  });

  it('getNotifications deserializes createdAt to Date', async () => {
    mockFetchJson([
      {
        id: 'n1',
        type: 'question_answered',
        questionMessageId: 'm44',
        channelId: 'c1',
        message: 'Your question has a new answer',
        isRead: false,
        createdAt: '2026-04-04T09:00:00.000Z',
      },
    ]);

    const notifications = await getNotifications('u1');

    expect(notifications[0].createdAt).toBeInstanceOf(Date);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notifications?userId=u1',
    );
  });

  it('markNotificationRead sends PATCH and deserializes createdAt', async () => {
    mockFetchJson({
      id: 'n1',
      type: 'question_answered',
      questionMessageId: 'm44',
      channelId: 'c1',
      message: 'Read now',
      isRead: true,
      createdAt: '2026-04-04T09:10:00.000Z',
    });

    const updated = await markNotificationRead('n1', 'u9');

    expect(updated.createdAt).toBeInstanceOf(Date);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notifications/n1/read',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'x-user-id': 'u9',
        }),
        body: JSON.stringify({ read: true }),
      }),
    );
  });

  it('throws on non-ok API response', async () => {
    mockFetchJson({}, { ok: false, status: 500 });

    await expect(getServers()).rejects.toThrow('Request failed (500) for /api/servers');
  });
});
