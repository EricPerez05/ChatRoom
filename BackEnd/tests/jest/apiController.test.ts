import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApiError } from '../../src/middleware/apiError';
import { createApiController } from '../../src/controllers/apiController';
import * as validation from '../../src/middleware/validation';

type MockFn = ReturnType<typeof jest.fn>;

jest.mock('../../src/middleware/validation', () => ({
  parseChannelIdParam: jest.fn(),
  parseChannelCreateBody: jest.fn(),
  parseChannelIdsQuery: jest.fn(),
  parseDiscussionIdParam: jest.fn(),
  parseDiscussionStatusBody: jest.fn(),
  parseGroupIdParam: jest.fn(),
  parseMessageCreateBody: jest.fn(),
  parseNotificationIdParam: jest.fn(),
  parseQuestionIdParam: jest.fn(),
  parseServerIdParam: jest.fn(),
  requireNotificationReadBody: jest.fn(),
  requireUserIdQuery: jest.fn(),
}));

type MockContext = {
  staticData: {
    servers: unknown[];
    groups: unknown[];
    members: unknown[];
  };
  channelNameMap: Map<string, string>;
  repositories: {
    messageRepository: {
      listByChannel: MockFn;
      save: MockFn;
    };
  };
  services: {
    channelCatalogService: {
      addServerChannel: MockFn;
      addGroupChannel: MockFn;
    };
    questionStatusService: {
      ingestMessage: MockFn;
      getUnansweredStatuses: MockFn;
      markQuestionAsAnswered: MockFn;
    };
    questionDetectionService: {
      toDetectedQuestionDto: MockFn;
    };
    discussionService: {
      detect: MockFn;
      setDiscussionStatus: MockFn;
    };
    notificationService: {
      listByUser: MockFn;
      markRead: MockFn;
    };
    simulatedResponseService: {
      generateResponsesForMessage: MockFn;
    };
    memberPresenceService: {
      listMembers: MockFn;
    };
    simulatedConversationService: {
      setChannelActive: MockFn;
    };
  };
};

const createMockContext = (): MockContext => ({
  staticData: {
    servers: [{ id: 's1' }],
    groups: [{ id: 'g1' }],
    members: [{ id: 'u1' }],
  },
  channelNameMap: new Map([
    ['c1', 'general'],
    ['c2', 'random'],
  ]),
  repositories: {
    messageRepository: {
      listByChannel: jest.fn(),
      save: jest.fn(),
    },
  },
  services: {
    channelCatalogService: {
      addServerChannel: jest.fn(),
      addGroupChannel: jest.fn(),
    },
    questionStatusService: {
      ingestMessage: jest.fn(),
      getUnansweredStatuses: jest.fn(),
      markQuestionAsAnswered: jest.fn(),
    },
    questionDetectionService: {
      toDetectedQuestionDto: jest.fn(),
    },
    discussionService: {
      detect: jest.fn(),
      setDiscussionStatus: jest.fn(),
    },
    notificationService: {
      listByUser: jest.fn(),
      markRead: jest.fn(),
    },
    simulatedResponseService: {
      generateResponsesForMessage: jest.fn(),
    },
    memberPresenceService: {
      listMembers: jest.fn(),
    },
    simulatedConversationService: {
      setChannelActive: jest.fn(),
    },
  },
});

const createMockRes = () => {
  const res: any = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('apiController', () => {
  let context: MockContext;
  let req: any;
  let res: any;

  beforeEach(() => {
    context = createMockContext();
    req = { user: { id: 'u-actor' } };
    res = createMockRes();

    (validation.parseChannelIdParam as MockFn).mockReturnValue('c1');
    (validation.parseChannelCreateBody as MockFn).mockReturnValue({
      name: 'new-channel',
      type: 'text',
      category: 'TEXT CHANNELS',
    });
    (validation.parseChannelIdsQuery as MockFn).mockReturnValue(['c1']);
    (validation.parseDiscussionIdParam as MockFn).mockReturnValue('d1');
    (validation.parseDiscussionStatusBody as MockFn).mockReturnValue('resolved');
    (validation.parseGroupIdParam as MockFn).mockReturnValue('g1');
    (validation.parseMessageCreateBody as MockFn).mockReturnValue({
      userId: 'u1',
      userName: 'Alex',
      userAvatar: 'A',
      content: 'hello',
    });
    (validation.parseNotificationIdParam as MockFn).mockReturnValue('n1');
    (validation.parseQuestionIdParam as MockFn).mockReturnValue('q1');
    (validation.parseServerIdParam as MockFn).mockReturnValue('s1');
    (validation.requireNotificationReadBody as MockFn).mockReturnValue(true);
    (validation.requireUserIdQuery as MockFn).mockReturnValue('u1');
  });

  it('createApiController exposes expected handlers', () => {
    const controller = createApiController(context as any);

    expect(Object.keys(controller).sort()).toEqual([
      'getChannelMessages',
      'getDiscussions',
      'getGroups',
      'getHealth',
      'getMembers',
      'getNotifications',
      'getQuestions',
      'getRoot',
      'getServers',
      'markNotificationRead',
      'markQuestionAnswered',
      'postChannelMessage',
      'postGroupChannel',
      'postServerChannel',
      'updateDiscussionStatus',
    ]);
  });

  it('getRoot returns service metadata', () => {
    const controller = createApiController(context as any);
    controller.getRoot(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'ChatRoom backend is running',
      health: '/health',
      api: '/api',
    });
  });

  it('getHealth returns health response', () => {
    const controller = createApiController(context as any);
    controller.getHealth(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, service: 'chatroom-backend' });
  });

  it('getServers/getGroups/getMembers return static data', () => {
    const controller = createApiController(context as any);

    controller.getServers(req, res);
    expect(res.json).toHaveBeenCalledWith(context.staticData.servers);

    controller.getGroups(req, res);
    expect(res.json).toHaveBeenCalledWith(context.staticData.groups);

    controller.getMembers(req, res);
    expect(res.json).toHaveBeenCalledWith(context.services.memberPresenceService.listMembers());
  });

  it('postServerChannel returns 201 with created channel', () => {
    const controller = createApiController(context as any);
    const created = { id: 'c100', name: 'new-channel' };
    context.services.channelCatalogService.addServerChannel.mockReturnValue(created);

    controller.postServerChannel(req, res);

    expect(context.services.channelCatalogService.addServerChannel).toHaveBeenCalledWith('s1', {
      name: 'new-channel',
      type: 'text',
      category: 'TEXT CHANNELS',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('postServerChannel throws 404 when server not found', () => {
    const controller = createApiController(context as any);
    context.services.channelCatalogService.addServerChannel.mockReturnValue(undefined);

    expect(() => controller.postServerChannel(req, res)).toThrow(ApiError);
    expect(() => controller.postServerChannel(req, res)).toThrow('Server not found');
  });

  it('postGroupChannel handles create and not-found paths', () => {
    const controller = createApiController(context as any);
    const created = { id: 'cg1', name: 'group-channel' };
    context.services.channelCatalogService.addGroupChannel.mockReturnValue(created);

    controller.postGroupChannel(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);

    context.services.channelCatalogService.addGroupChannel.mockReturnValue(undefined);
    expect(() => controller.postGroupChannel(req, res)).toThrow('Group not found');
  });

  it('getChannelMessages fetches messages by parsed channel id', async () => {
    const controller = createApiController(context as any);
    const messages = [{ id: 'm1' }];
    context.repositories.messageRepository.listByChannel.mockResolvedValue(messages);

    await controller.getChannelMessages(req, res);

    expect(context.repositories.messageRepository.listByChannel).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith(messages);
  });

  it('postChannelMessage ingests message and returns 201', async () => {
    const controller = createApiController(context as any);
    const created = { id: 'm-live-1' };
    const simulated = [{ id: 'm-sim-1' }];
    context.services.questionStatusService.ingestMessage.mockResolvedValue(created);
    context.services.simulatedResponseService.generateResponsesForMessage.mockResolvedValue(simulated);
    context.services.memberPresenceService.listMembers.mockReturnValue(context.staticData.members);

    await controller.postChannelMessage(req, res);

    expect(context.services.questionStatusService.ingestMessage).toHaveBeenCalledWith({
      channelId: 'c1',
      userId: 'u1',
      userName: 'Alex',
      userAvatar: 'A',
      content: 'hello',
    });
    expect(context.services.simulatedConversationService.setChannelActive).toHaveBeenCalledWith('c1', false);
    expect(context.services.simulatedResponseService.generateResponsesForMessage).toHaveBeenCalledWith(
      created,
      { allowConversation: false },
    );
    expect(context.repositories.messageRepository.save).toHaveBeenCalledWith(simulated[0]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: created, simulated });
  });

  it('getQuestions maps unanswered statuses to DTO and returns it', async () => {
    const controller = createApiController(context as any);
    const statuses = [{ id: 'q1' }];
    const dto = [{ id: 'dto-1' }];
    context.services.questionStatusService.getUnansweredStatuses.mockResolvedValue(statuses);
    context.services.questionDetectionService.toDetectedQuestionDto.mockReturnValue(dto);

    await controller.getQuestions(req, res);

    expect(context.services.questionStatusService.getUnansweredStatuses).toHaveBeenCalledWith(['c1']);
    expect(context.services.questionDetectionService.toDetectedQuestionDto).toHaveBeenCalledWith(
      statuses,
      context.channelNameMap,
    );
    expect(res.json).toHaveBeenCalledWith(dto);
  });

  it('getDiscussions uses requested channelIds and delegates to detect()', async () => {
    const controller = createApiController(context as any);
    context.repositories.messageRepository.listByChannel
      .mockResolvedValueOnce([{ id: 'm1' }])
      .mockResolvedValueOnce([{ id: 'm2' }]);
    context.services.discussionService.detect.mockResolvedValue([{ id: 'd1' }]);
    (validation.parseChannelIdsQuery as MockFn).mockReturnValue(['c1', 'c2']);

    await controller.getDiscussions(req, res);

    expect(context.repositories.messageRepository.listByChannel).toHaveBeenNthCalledWith(1, 'c1');
    expect(context.repositories.messageRepository.listByChannel).toHaveBeenNthCalledWith(2, 'c2');
    expect(context.services.discussionService.detect).toHaveBeenCalledWith(
      { c1: [{ id: 'm1' }], c2: [{ id: 'm2' }] },
      context.channelNameMap,
      ['c1', 'c2'],
    );
    expect(res.json).toHaveBeenCalledWith([{ id: 'd1' }]);
  });

  it('getDiscussions falls back to channelNameMap keys when no channelIds query', async () => {
    const controller = createApiController(context as any);
    (validation.parseChannelIdsQuery as MockFn).mockReturnValue(undefined);
    context.repositories.messageRepository.listByChannel
      .mockResolvedValueOnce([{ id: 'm1' }])
      .mockResolvedValueOnce([{ id: 'm2' }]);
    context.services.discussionService.detect.mockResolvedValue([{ id: 'd2' }]);

    await controller.getDiscussions(req, res);

    expect(context.repositories.messageRepository.listByChannel).toHaveBeenNthCalledWith(1, 'c1');
    expect(context.repositories.messageRepository.listByChannel).toHaveBeenNthCalledWith(2, 'c2');
    expect(context.services.discussionService.detect).toHaveBeenCalledWith(
      { c1: [{ id: 'm1' }], c2: [{ id: 'm2' }] },
      context.channelNameMap,
      undefined,
    );
  });

  it('getNotifications returns notifications for query user id', async () => {
    const controller = createApiController(context as any);
    const notifications = [{ id: 'n1' }];
    context.services.notificationService.listByUser.mockResolvedValue(notifications);

    await controller.getNotifications(req, res);

    expect(validation.requireUserIdQuery).toHaveBeenCalledWith(req);
    expect(context.services.notificationService.listByUser).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(notifications);
  });

  it('markNotificationRead throws 401 when req.user.id missing', async () => {
    const controller = createApiController(context as any);
    req.user = undefined;

    await expect(controller.markNotificationRead(req, res)).rejects.toThrow(ApiError);
    await expect(controller.markNotificationRead(req, res)).rejects.toThrow(
      'Missing user identity (x-user-id header)',
    );
  });

  it('markNotificationRead throws 404 when notification is absent', async () => {
    const controller = createApiController(context as any);
    context.services.notificationService.markRead.mockResolvedValue(undefined);

    await expect(controller.markNotificationRead(req, res)).rejects.toThrow('Notification not found');
  });

  it('markNotificationRead returns updated notification', async () => {
    const controller = createApiController(context as any);
    const updated = { id: 'n1', isRead: true };
    context.services.notificationService.markRead.mockResolvedValue(updated);

    await controller.markNotificationRead(req, res);

    expect(validation.requireNotificationReadBody).toHaveBeenCalledWith(req);
    expect(context.services.notificationService.markRead).toHaveBeenCalledWith('n1', 'u-actor');
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('markQuestionAnswered returns mapped payload and uses req.user.id', async () => {
    const controller = createApiController(context as any);
    const status = {
      id: 'q1',
      status: 'answered',
      answeredAt: new Date('2026-04-04T00:00:00.000Z'),
    };
    context.services.questionStatusService.markQuestionAsAnswered.mockResolvedValue(status);

    await controller.markQuestionAnswered(req, res);

    expect(context.services.questionStatusService.markQuestionAsAnswered).toHaveBeenCalledWith('q1', 'u-actor');
    expect(res.json).toHaveBeenCalledWith({
      id: 'q1',
      status: 'answered',
      answeredAt: status.answeredAt,
    });
  });

  it('markQuestionAnswered uses system actor fallback and throws 404 when missing', async () => {
    const controller = createApiController(context as any);

    req.user = undefined;
    context.services.questionStatusService.markQuestionAsAnswered.mockResolvedValueOnce({
      id: 'q1',
      status: 'answered',
      answeredAt: null,
    });
    await controller.markQuestionAnswered(req, res);
    expect(context.services.questionStatusService.markQuestionAsAnswered).toHaveBeenCalledWith('q1', 'system');

    context.services.questionStatusService.markQuestionAsAnswered.mockResolvedValueOnce(undefined);
    await expect(controller.markQuestionAnswered(req, res)).rejects.toThrow('Question not found');
  });

  it('updateDiscussionStatus returns id and updated status', async () => {
    const controller = createApiController(context as any);
    context.services.discussionService.setDiscussionStatus.mockResolvedValue('resolved');

    await controller.updateDiscussionStatus(req, res);

    expect(context.services.discussionService.setDiscussionStatus).toHaveBeenCalledWith('d1', 'resolved');
    expect(res.json).toHaveBeenCalledWith({ id: 'd1', status: 'resolved' });
  });
});
