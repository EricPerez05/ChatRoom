import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { createApp } from '../src/app';

describe('User stories module API path smoke test', () => {
  it('covers US1 and US2 through module-facing APIs', async () => {
    const { app } = await createApp({ enableRequestLogging: false });

    const servers = await request(app).get('/api/servers');
    const groups = await request(app).get('/api/groups');
    const members = await request(app).get('/api/members');

    expect(servers.status).toBe(200);
    expect(groups.status).toBe(200);
    expect(members.status).toBe(200);
    expect(Array.isArray(servers.body)).toBe(true);
    expect(Array.isArray(groups.body)).toBe(true);
    expect(Array.isArray(members.body)).toBe(true);

    const initialMessages = await request(app).get('/api/channels/c1/messages');
    expect(initialMessages.status).toBe(200);
    expect(Array.isArray(initialMessages.body)).toBe(true);

    const ask = await request(app)
      .post('/api/channels/c1/messages')
      .set('x-user-id', 'u-us1-asker')
      .send({
        userId: 'u-us1-asker',
        userName: 'US1 Asker',
        content: 'Can anyone help me verify this user story?',
      });

    expect(ask.status).toBe(201);

    const unansweredAfterAsk = await request(app)
      .get('/api/questions')
      .query({ channelIds: 'c1' });

    expect(unansweredAfterAsk.status).toBe(200);
    expect(
      unansweredAfterAsk.body.some(
        (entry: { messageId: string }) => entry.messageId === ask.body.message.id,
      ),
    ).toBe(true);

    const answer = await request(app)
      .post('/api/channels/c1/messages')
      .set('x-user-id', 'u-us1-helper')
      .send({
        userId: 'u-us1-helper',
        userName: 'US1 Helper',
        content: 'Yes, this is answered for US2 notification flow.',
      });

    expect(answer.status).toBe(201);

    const unansweredAfterAnswer = await request(app)
      .get('/api/questions')
      .query({ channelIds: 'c1' });

    expect(unansweredAfterAnswer.status).toBe(200);
    expect(
      unansweredAfterAnswer.body.some(
        (entry: { messageId: string }) => entry.messageId === ask.body.message.id,
      ),
    ).toBe(false);

    const discussions = await request(app)
      .get('/api/discussions')
      .query({ channelIds: 'c1' });

    expect(discussions.status).toBe(200);
    expect(Array.isArray(discussions.body)).toBe(true);

    const askerNotifications = await request(app)
      .get('/api/notifications')
      .set('x-user-id', 'u-us1-asker')
      .query({ userId: 'u-us1-asker' });

    expect(askerNotifications.status).toBe(200);
    expect(askerNotifications.body.length).toBeGreaterThan(0);

    const latestNotificationId = askerNotifications.body[0].id as string;

    const markRead = await request(app)
      .patch(`/api/notifications/${latestNotificationId}/read`)
      .set('x-user-id', 'u-us1-asker')
      .send({ read: true });

    expect(markRead.status).toBe(200);
    expect(markRead.body.isRead).toBe(true);
  });
});
