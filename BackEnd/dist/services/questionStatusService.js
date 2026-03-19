"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionStatusService = void 0;
let messageCounter = 1;
let questionCounter = 1;
class QuestionStatusService {
    constructor(messageRepository, questionStatusRepository, questionDetectionService, notificationService) {
        this.messageRepository = messageRepository;
        this.questionStatusRepository = questionStatusRepository;
        this.questionDetectionService = questionDetectionService;
        this.notificationService = notificationService;
    }
    async ingestMessage(input) {
        const createdMessage = {
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
    async getUnansweredStatuses(channelIds) {
        const all = channelIds && channelIds.length > 0
            ? await this.questionStatusRepository.listByChannels(channelIds)
            : await this.questionStatusRepository.listByStatus('unanswered');
        return all.filter((status) => status.status === 'unanswered');
    }
    async markQuestionAsAnswered(questionId, answeredByUserId) {
        const existing = await this.questionStatusRepository.findById(questionId);
        if (!existing || existing.status === 'answered') {
            return existing;
        }
        const updated = {
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
    async seedFromExistingMessages(messages) {
        const sorted = [...messages].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
        for (const message of sorted) {
            if (this.questionDetectionService.isLikelyQuestion(message.content)) {
                await this.createQuestionStatusIfAbsent(message);
            }
            else {
                await this.evaluateAnswerTransitions(message);
            }
        }
    }
    async createQuestionStatusIfAbsent(message) {
        const existing = await this.questionStatusRepository.findByQuestionMessageId(message.id);
        if (existing) {
            return;
        }
        const status = {
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
    async evaluateAnswerTransitions(newMessage) {
        const pending = (await this.questionStatusRepository
            .listByChannel(newMessage.channelId))
            .filter((status) => status.status === 'unanswered')
            .filter((status) => status.askedAt.getTime() < newMessage.timestamp.getTime())
            .filter((status) => status.askedByUserId !== newMessage.userId);
        for (const status of pending) {
            const updated = {
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
exports.QuestionStatusService = QuestionStatusService;
