import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../../../BackEnd/src/app';
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

let server: Server;

beforeAll(async () => {
  process.env.PERSISTENCE_MODE = 'memory';
  process.env.CORS_ORIGIN = 'http://localhost:5173';

  const { app } = await createApp({ enableRequestLogging: false });
  server = app.listen(4000);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
});

describe('Frontend to backend integration', () => {
  it('loads base catalog data', async () => {
    const [servers, groups, members] = await Promise.all([
      getServers(),
      getGroups(),
      getMembers(),
    ]);

    expect(servers.length).toBeGreaterThan(0);
    expect(groups.length).toBeGreaterThan(0);
    expect(members.length).toBeGreaterThan(0);
  });

  it('creates server and group channels via frontend API calls', async () => {
    const createdServerChannel = await createServerChannel('1', {
      name: 'integration-server-channel',
      type: 'text',
      category: 'TEXT CHANNELS',
    });

    const createdGroupChannel = await createGroupChannel('g1', {
      name: 'integration-group-channel',
      type: 'text',
      category: 'TEXT CHANNELS',
    });

    expect(createdServerChannel.name).toBe('integration-server-channel');
    expect(createdGroupChannel.name).toBe('integration-group-channel');
  });

  it('reads and writes channel messages end-to-end', async () => {
    const initialMessages = await getChannelMessages('c2');
    expect(initialMessages.length).toBeGreaterThan(0);

    const posted = await postChannelMessage('c2', {
      userId: 'u-you',
      userName: 'You',
      content: 'Can someone review the integration test pipeline?',
    });

    expect(posted.message.content).toContain('integration test pipeline');

    const refreshedMessages = await getChannelMessages('c2');
    expect(refreshedMessages.some((message) => message.id === posted.message.id)).toBe(true);
  });

  it('detects and resolves a question through the public API', async () => {
    const seededQuestion = (await getQuestions(['c12'])).find((question) => question.messageId === 'm20');
    expect(seededQuestion).toBeDefined();

    await markQuestionAnswered(seededQuestion!.id);

    const remainingQuestions = await getQuestions(['c12']);
    expect(remainingQuestions.some((question) => question.messageId === 'm20')).toBe(false);
  });

  it('updates discussion status and reflects persisted state', async () => {
    const discussions = await getDiscussions(['c7']);
    expect(discussions.length).toBeGreaterThan(0);

    const discussion = discussions[0];
    await updateDiscussionStatus(discussion.id, 'resolved');

    const refreshed = await getDiscussions(['c7']);
    const updated = refreshed.find((item) => item.id === discussion.id);
    expect(updated?.status).toBe('resolved');
  });

  it('reads and marks notifications as read', async () => {
    const posted = await postChannelMessage('c12', {
      userId: 'u3',
      userName: 'Sam',
      content: 'Can someone validate this deployment checklist?',
    });

    const questions = await getQuestions(['c12']);
    const createdQuestion = questions.find((question) => question.messageId === posted.message.id);
    expect(createdQuestion).toBeDefined();

    await markQuestionAnswered(createdQuestion!.id);

    const notifications = await getNotifications('u3');
    const target = notifications.find((notification) => notification.questionMessageId === posted.message.id);
    expect(target).toBeDefined();

    const updated = await markNotificationRead(target!.id, 'u3');
    expect(updated.isRead).toBe(true);
  });
});
