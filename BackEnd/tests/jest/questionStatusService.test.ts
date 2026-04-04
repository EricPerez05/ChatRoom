import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QuestionStatusService } from '../../src/services/questionStatusService';
import { CreateMessageInput, Message } from '../../src/models/message';
import { QuestionStatus } from '../../src/models/questionStatus';

type MockFn = ReturnType<typeof jest.fn>;

type MockMessageRepository = {
  save: MockFn;
};

type MockQuestionStatusRepository = {
  save: MockFn;
  findById: MockFn;
  findByQuestionMessageId: MockFn;
  listByChannel: MockFn;
  listByChannels: MockFn;
  listByStatus: MockFn;
};

type MockQuestionDetectionService = {
  isLikelyQuestion: MockFn;
};

type MockNotificationService = {
  createQuestionAnsweredNotification: MockFn;
};

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'm1',
  channelId: 'c1',
  userId: 'u1',
  userName: 'Alex',
  userAvatar: 'A',
  content: 'Hello',
  timestamp: new Date('2026-04-04T10:00:00.000Z'),
  ...overrides,
});

const makeStatus = (overrides: Partial<QuestionStatus> = {}): QuestionStatus => ({
  id: 'q1',
  channelId: 'c1',
  questionMessageId: 'm-question-1',
  questionContent: 'Can someone help?',
  askedByUserId: 'u-asker',
  askedBy: 'Jordan',
  askedAt: new Date('2026-04-04T09:00:00.000Z'),
  status: 'unanswered',
  ...overrides,
});

describe('QuestionStatusService (Jest)', () => {
  let messageRepository: MockMessageRepository;
  let questionStatusRepository: MockQuestionStatusRepository;
  let questionDetectionService: MockQuestionDetectionService;
  let notificationService: MockNotificationService;
  let service: QuestionStatusService;

  beforeEach(() => {
    messageRepository = {
      save: jest.fn(),
    };

    questionStatusRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByQuestionMessageId: jest.fn(),
      listByChannel: jest.fn(),
      listByChannels: jest.fn(),
      listByStatus: jest.fn(),
    };

    questionDetectionService = {
      isLikelyQuestion: jest.fn(),
    };

    notificationService = {
      createQuestionAnsweredNotification: jest.fn(),
    };

    service = new QuestionStatusService(
      messageRepository as any,
      questionStatusRepository as any,
      questionDetectionService as any,
      notificationService as any,
    );
  });

  it('constructor creates service with provided dependencies', () => {
    expect(service).toBeInstanceOf(QuestionStatusService);
  });

  it('ingestMessage saves message and creates question status when content is a question', async () => {
    questionDetectionService.isLikelyQuestion.mockReturnValue(true);
    questionStatusRepository.findByQuestionMessageId.mockResolvedValue(undefined);

    const input: CreateMessageInput = {
      channelId: 'c1',
      userId: 'u1',
      userName: 'Alex',
      content: 'Can someone review this?',
    };

    const created = await service.ingestMessage(input);

    expect(messageRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      channelId: 'c1',
      userId: 'u1',
      content: 'Can someone review this?',
    }));
    expect(questionStatusRepository.findByQuestionMessageId).toHaveBeenCalledWith(created.id);
    expect(questionStatusRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      questionMessageId: created.id,
      status: 'unanswered',
    }));
    expect(created.userAvatar).toBe('👤');
  });

  it('ingestMessage evaluates answer transitions for non-question message', async () => {
    questionDetectionService.isLikelyQuestion.mockReturnValue(false);
    questionStatusRepository.listByChannel.mockResolvedValue([]);

    const input: CreateMessageInput = {
      channelId: 'c1',
      userId: 'u2',
      userName: 'Taylor',
      content: 'Here is the answer',
    };

    await service.ingestMessage(input);

    expect(messageRepository.save).toHaveBeenCalledTimes(1);
    expect(questionStatusRepository.listByChannel).toHaveBeenCalledWith('c1');
  });

  it('getUnansweredStatuses uses listByChannels when channelIds provided', async () => {
    questionStatusRepository.listByChannels.mockResolvedValue([
      makeStatus({ id: 'q1', status: 'unanswered' }),
      makeStatus({ id: 'q2', status: 'answered' }),
    ]);

    const result = await service.getUnansweredStatuses(['c1', 'c2']);

    expect(questionStatusRepository.listByChannels).toHaveBeenCalledWith(['c1', 'c2']);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('unanswered');
  });

  it('getUnansweredStatuses uses listByStatus when channelIds omitted', async () => {
    questionStatusRepository.listByStatus.mockResolvedValue([
      makeStatus({ id: 'q1', status: 'unanswered' }),
      makeStatus({ id: 'q2', status: 'answered' }),
    ]);

    const result = await service.getUnansweredStatuses();

    expect(questionStatusRepository.listByStatus).toHaveBeenCalledWith('unanswered');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q1');
  });

  it('markQuestionAsAnswered returns undefined when question does not exist', async () => {
    questionStatusRepository.findById.mockResolvedValue(undefined);

    const result = await service.markQuestionAsAnswered('q404', 'u2');

    expect(result).toBeUndefined();
    expect(questionStatusRepository.save).not.toHaveBeenCalled();
    expect(notificationService.createQuestionAnsweredNotification).not.toHaveBeenCalled();
  });

  it('markQuestionAsAnswered returns existing status when already answered', async () => {
    const existing = makeStatus({ id: 'q1', status: 'answered' });
    questionStatusRepository.findById.mockResolvedValue(existing);

    const result = await service.markQuestionAsAnswered('q1', 'u2');

    expect(result).toEqual(existing);
    expect(questionStatusRepository.save).not.toHaveBeenCalled();
  });

  it('markQuestionAsAnswered updates unanswered status and emits notification', async () => {
    const existing = makeStatus({ id: 'q1', status: 'unanswered' });
    questionStatusRepository.findById.mockResolvedValue(existing);
    questionStatusRepository.save.mockImplementation(async (status: QuestionStatus) => status);

    const result = await service.markQuestionAsAnswered('q1', 'u-answerer');

    expect(questionStatusRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'q1',
      status: 'answered',
      answeredByUserId: 'u-answerer',
    }));
    expect(notificationService.createQuestionAnsweredNotification).toHaveBeenCalledTimes(1);
    expect(result?.status).toBe('answered');
  });

  it('seedFromExistingMessages processes messages in chronological order', async () => {
    const laterQuestion = makeMessage({
      id: 'm-late',
      content: 'Can someone help later?',
      timestamp: new Date('2026-04-04T11:00:00.000Z'),
    });
    const earlierAnswer = makeMessage({
      id: 'm-early',
      content: 'Here is an earlier message',
      userId: 'u2',
      timestamp: new Date('2026-04-04T10:00:00.000Z'),
    });

    questionDetectionService.isLikelyQuestion.mockImplementation((content: string) => content.includes('?'));
    questionStatusRepository.listByChannel.mockResolvedValue([]);
    questionStatusRepository.findByQuestionMessageId.mockResolvedValue(undefined);

    await service.seedFromExistingMessages([laterQuestion, earlierAnswer]);

    const callOrder = questionDetectionService.isLikelyQuestion.mock.calls.map((call) => call[0]);
    expect(callOrder).toEqual(['Here is an earlier message', 'Can someone help later?']);
  });

  it('createQuestionStatusIfAbsent does not save when status already exists', async () => {
    questionStatusRepository.findByQuestionMessageId.mockResolvedValue(makeStatus());

    await (service as any).createQuestionStatusIfAbsent(makeMessage({ id: 'm-existing' }));

    expect(questionStatusRepository.save).not.toHaveBeenCalled();
  });

  it('createQuestionStatusIfAbsent saves unanswered status when missing', async () => {
    questionStatusRepository.findByQuestionMessageId.mockResolvedValue(undefined);

    const message = makeMessage({ id: 'm-question-2', content: 'Need help?', userId: 'u7', userName: 'Sam' });
    await (service as any).createQuestionStatusIfAbsent(message);

    expect(questionStatusRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      questionMessageId: 'm-question-2',
      askedByUserId: 'u7',
      askedBy: 'Sam',
      status: 'unanswered',
    }));
  });

  it('evaluateAnswerTransitions updates only eligible pending statuses', async () => {
    const newMessage = makeMessage({
      id: 'm-answer',
      channelId: 'c1',
      userId: 'u-answerer',
      timestamp: new Date('2026-04-04T12:00:00.000Z'),
    });

    const eligible = makeStatus({
      id: 'q-eligible',
      channelId: 'c1',
      askedAt: new Date('2026-04-04T11:00:00.000Z'),
      askedByUserId: 'u-asker',
      status: 'unanswered',
    });
    const sameAuthor = makeStatus({
      id: 'q-self',
      channelId: 'c1',
      askedAt: new Date('2026-04-04T11:00:00.000Z'),
      askedByUserId: 'u-answerer',
      status: 'unanswered',
    });
    const alreadyAnswered = makeStatus({
      id: 'q-answered',
      channelId: 'c1',
      askedAt: new Date('2026-04-04T11:00:00.000Z'),
      status: 'answered',
    });
    const askedAfter = makeStatus({
      id: 'q-future',
      channelId: 'c1',
      askedAt: new Date('2026-04-04T13:00:00.000Z'),
      status: 'unanswered',
    });

    questionStatusRepository.listByChannel.mockResolvedValue([
      eligible,
      sameAuthor,
      alreadyAnswered,
      askedAfter,
    ]);

    await (service as any).evaluateAnswerTransitions(newMessage);

    expect(questionStatusRepository.save).toHaveBeenCalledTimes(1);
    expect(questionStatusRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'q-eligible',
      status: 'answered',
      answeredByUserId: 'u-answerer',
      answeredMessageId: 'm-answer',
    }));
    expect(notificationService.createQuestionAnsweredNotification).toHaveBeenCalledTimes(1);
  });

  it('evaluateAnswerTransitions emits one notification per transitioned status', async () => {
    const newMessage = makeMessage({
      id: 'm-answer-2',
      channelId: 'c1',
      userId: 'u-helper',
      timestamp: new Date('2026-04-04T14:00:00.000Z'),
    });

    const s1 = makeStatus({ id: 'q1', askedAt: new Date('2026-04-04T12:00:00.000Z') });
    const s2 = makeStatus({ id: 'q2', askedAt: new Date('2026-04-04T12:30:00.000Z') });

    questionStatusRepository.listByChannel.mockResolvedValue([s1, s2]);

    await (service as any).evaluateAnswerTransitions(newMessage);

    expect(questionStatusRepository.save).toHaveBeenCalledTimes(2);
    expect(notificationService.createQuestionAnsweredNotification).toHaveBeenCalledTimes(2);
  });
});
