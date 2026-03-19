import { CreateMessageInput, Message } from '../models/message';
import { QuestionStatus } from '../models/questionStatus';
import { MessageRepository } from '../repositories/messageRepository';
import { QuestionStatusRepository } from '../repositories/questionStatusRepository';
import { NotificationService } from './notificationService';
import { QuestionDetectionService } from './questionDetectionService';

let messageCounter = 1;
let questionCounter = 1;

export class QuestionStatusService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly questionStatusRepository: QuestionStatusRepository,
    private readonly questionDetectionService: QuestionDetectionService,
    private readonly notificationService: NotificationService,
  ) {}

  async ingestMessage(input: CreateMessageInput): Promise<Message> {
    const createdMessage: Message = {
      id: `m-live-${messageCounter++}`,
      channelId: input.channelId,
      userId: input.userId,
      userName: input.userName,
      userAvatar: input.userAvatar || '👤',
      content: input.content,
      timestamp: new Date(),
    };

    await this.messageRepository.save(createdMessage);

    if (this.questionDetectionService.isLikelyQuestion(createdMessage.content)) {
      await this.createQuestionStatusIfAbsent(createdMessage);
      return createdMessage;
    }

    await this.evaluateAnswerTransitions(createdMessage);
    return createdMessage;
  }

  async getUnansweredStatuses(channelIds?: string[]): Promise<QuestionStatus[]> {
    const all = channelIds && channelIds.length > 0
      ? await this.questionStatusRepository.listByChannels(channelIds)
      : await this.questionStatusRepository.listByStatus('unanswered');

    return all.filter((status) => status.status === 'unanswered');
  }

  async markQuestionAsAnswered(
    questionId: string,
    answeredByUserId: string,
  ): Promise<QuestionStatus | undefined> {
    const existing = await this.questionStatusRepository.findById(questionId);
    if (!existing || existing.status === 'answered') {
      return existing;
    }

    const updated: QuestionStatus = {
      ...existing,
      status: 'answered',
      answeredAt: new Date(),
      answeredByUserId,
      answeredMessageId: existing.answeredMessageId,
    };

    await this.questionStatusRepository.save(updated);
    await this.notificationService.createQuestionAnsweredNotification(updated);
    return updated;
  }

  async seedFromExistingMessages(messages: Message[]) {
    const sorted = [...messages].sort(
      (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
    );

    for (const message of sorted) {
      if (this.questionDetectionService.isLikelyQuestion(message.content)) {
        await this.createQuestionStatusIfAbsent(message);
      } else {
        await this.evaluateAnswerTransitions(message);
      }
    }
  }

  private async createQuestionStatusIfAbsent(message: Message) {
    const existing = await this.questionStatusRepository.findByQuestionMessageId(message.id);
    if (existing) {
      return;
    }

    const status: QuestionStatus = {
      id: `q-${questionCounter++}`,
      channelId: message.channelId,
      questionMessageId: message.id,
      questionContent: message.content,
      askedByUserId: message.userId,
      askedBy: message.userName,
      askedAt: message.timestamp,
      status: 'unanswered',
    };

    await this.questionStatusRepository.save(status);
  }

  private async evaluateAnswerTransitions(newMessage: Message) {
    const pending = (await this.questionStatusRepository
      .listByChannel(newMessage.channelId))
      .filter((status) => status.status === 'unanswered')
      .filter((status) => status.askedAt.getTime() < newMessage.timestamp.getTime())
      .filter((status) => status.askedByUserId !== newMessage.userId);

    for (const status of pending) {
      const updated: QuestionStatus = {
        ...status,
        status: 'answered',
        answeredAt: newMessage.timestamp,
        answeredByUserId: newMessage.userId,
        answeredMessageId: newMessage.id,
      };

      await this.questionStatusRepository.save(updated);
      await this.notificationService.createQuestionAnsweredNotification(updated);
    }
  }
}