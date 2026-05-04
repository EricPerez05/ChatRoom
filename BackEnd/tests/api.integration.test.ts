import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { createApp } from '../src/app';

describe('Backend API integration', () => {
  it('returns service health', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('supports question -> answer -> notification flow', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const questionResponse = await request(app)
      .post('/api/channels/c1/messages')
      .set('x-user-id', 'u-test-asker')
      .send({
        userId: 'u-test-asker',
        userName: 'Tester',
        content: 'Can someone explain this test case?',
      });

    expect(questionResponse.status).toBe(201);

    const unansweredAfterQuestion = await request(app)
      .get('/api/questions')
      .query({ channelIds: 'c1' });

    expect(unansweredAfterQuestion.status).toBe(200);
    expect(
      unansweredAfterQuestion.body.some(
        (entry: { messageId: string }) => entry.messageId === questionResponse.body.message.id,
      ),
    ).toBe(true);

    const answerResponse = await request(app)
      .post('/api/channels/c1/messages')
      .set('x-user-id', 'u-test-helper')
      .send({
        userId: 'u-test-helper',
        userName: 'Helper',
        content: 'Yes, this is the answer.',
      });

    expect(answerResponse.status).toBe(201);

    const unansweredAfterAnswer = await request(app)
      .get('/api/questions')
      .query({ channelIds: 'c1' });

    expect(unansweredAfterAnswer.status).toBe(200);
    expect(
      unansweredAfterAnswer.body.some(
        (entry: { messageId: string }) => entry.messageId === questionResponse.body.message.id,
      ),
    ).toBe(false);

    const notifications = await request(app)
      .get('/api/notifications')
      .set('x-user-id', 'u-test-asker')
      .query({ userId: 'u-test-asker' });

    expect(notifications.status).toBe(200);
    expect(notifications.body.length).toBeGreaterThan(0);
    expect(notifications.body[0].type).toBe('question_answered');
  });

  it('rejects notification access for another user', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const response = await request(app)
      .get('/api/notifications')
      .set('x-user-id', 'u1')
      .query({ userId: 'u2' });

    expect(response.status).toBe(403);
  });

  it('marks notification as read for owner only', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    await request(app)
      .post('/api/channels/c1/messages')
      .set('x-user-id', 'u-test-owner')
      .send({
        userId: 'u-test-owner',
        userName: 'Owner',
        content: 'How should we validate read state?',
      });

    await request(app)
      .post('/api/channels/c1/messages')
      .set('x-user-id', 'u-test-replier')
      .send({
        userId: 'u-test-replier',
        userName: 'Replier',
        content: 'By marking notification as read.',
      });

    const list = await request(app)
      .get('/api/notifications')
      .set('x-user-id', 'u-test-owner')
      .query({ userId: 'u-test-owner' });

    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);

    const notificationId = list.body[0].id as string;

    const patch = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('x-user-id', 'u-test-owner')
      .send({ read: true });

    expect(patch.status).toBe(200);
    expect(patch.body.isRead).toBe(true);

    const forbiddenPatch = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('x-user-id', 'u-random')
      .send({ read: true });

    expect(forbiddenPatch.status).toBe(404);
  });

  it('supports manually marking unanswered question as answered', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const question = await request(app)
      .post('/api/channels/c2/messages')
      .set('x-user-id', 'u-manual-owner')
      .send({
        userId: 'u-manual-owner',
        userName: 'ManualOwner',
        content: 'How do we manually mark this?',
      });

    expect(question.status).toBe(201);

    const unansweredBefore = await request(app)
      .get('/api/questions')
      .query({ channelIds: 'c2' });

    const target = unansweredBefore.body.find(
      (entry: { messageId: string }) => entry.messageId === question.body.message.id,
    ) as { id: string } | undefined;

    expect(target).toBeTruthy();

    const mark = await request(app)
      .patch(`/api/questions/${target!.id}/answered`)
      .set('x-user-id', 'u-manual-owner')
      .send({});

    expect(mark.status).toBe(200);
    expect(mark.body.status).toBe('answered');

    const unansweredAfter = await request(app)
      .get('/api/questions')
      .query({ channelIds: 'c2' });

    expect(
      unansweredAfter.body.some(
        (entry: { messageId: string }) => entry.messageId === question.body.message.id,
      ),
    ).toBe(false);
  });

  it('persists discussion status updates through API', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const discussionsBefore = await request(app)
      .get('/api/discussions')
      .query({ channelIds: 'c1' });

    expect(discussionsBefore.status).toBe(200);
    expect(discussionsBefore.body.length).toBeGreaterThan(0);

    const discussionId = discussionsBefore.body[0].id as string;

    const update = await request(app)
      .patch(`/api/discussions/${discussionId}/status`)
      .set('x-user-id', 'u-you')
      .send({ status: 'resolved' });

    expect(update.status).toBe(200);
    expect(update.body.status).toBe('resolved');

    const discussionsAfter = await request(app)
      .get('/api/discussions')
      .query({ channelIds: 'c1' });

    const updated = discussionsAfter.body.find(
      (entry: { id: string }) => entry.id === discussionId,
    ) as { status: string } | undefined;

    expect(updated?.status).toBe('resolved');
  });

  it('anchors discussion thread to an in-thread message instead of latest channel message', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const createChannel = await request(app)
      .post('/api/servers/1/channels')
      .set('x-user-id', 'u-you')
      .send({
        name: 'anchor-target-channel',
        type: 'text',
        category: 'TEXT CHANNELS',
      });

    expect(createChannel.status).toBe(201);
    const channelId = createChannel.body.id as string;

    const firstDiscussionMessage = await request(app)
      .post(`/api/channels/${channelId}/messages`)
      .set('x-user-id', 'u-thread-a')
      .send({
        userId: 'u-thread-a',
        userName: 'ThreadA',
        content: 'Let us discuss the deployment plan for Thursday.',
      });

    expect(firstDiscussionMessage.status).toBe(201);

    const followUp = await request(app)
      .post(`/api/channels/${channelId}/messages`)
      .set('x-user-id', 'u-thread-b')
      .send({
        userId: 'u-thread-b',
        userName: 'ThreadB',
        content: 'I can help with rollout steps.',
      });

    expect(followUp.status).toBe(201);

    const latestMessage = await request(app)
      .post(`/api/channels/${channelId}/messages`)
      .set('x-user-id', 'u-thread-c')
      .send({
        userId: 'u-thread-c',
        userName: 'ThreadC',
        content: 'Great thanks everyone.',
      });

    expect(latestMessage.status).toBe(201);

    const discussions = await request(app)
      .get('/api/discussions')
      .query({ channelIds: channelId });

    expect(discussions.status).toBe(200);

    const createdChannelDiscussion = discussions.body.find(
      (entry: { channelId: string }) => entry.channelId === channelId,
    ) as { messageId: string } | undefined;

    expect(createdChannelDiscussion).toBeTruthy();
    expect(createdChannelDiscussion?.messageId).toBe(firstDiscussionMessage.body.id);
    expect(createdChannelDiscussion?.messageId).not.toBe(latestMessage.body.id);
  });

  it('creates and returns a new server channel', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const createResponse = await request(app)
      .post('/api/servers/1/channels')
      .set('x-user-id', 'u-you')
      .send({
        name: 'backend-new-channel',
        type: 'text',
        category: 'TEXT CHANNELS',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('backend-new-channel');

    const servers = await request(app).get('/api/servers');
    expect(servers.status).toBe(200);

    const serverOne = servers.body.find((entry: { id: string }) => entry.id === '1');
    expect(serverOne).toBeTruthy();
    expect(
      serverOne.channels.some((channel: { name: string }) => channel.name === 'backend-new-channel'),
    ).toBe(true);
  });
});