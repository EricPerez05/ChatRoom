export type QuestionLifecycleStatus = 'unanswered' | 'answered';

export interface QuestionStatus {
  id: string;
  channelId: string;
  questionMessageId: string;
  questionContent: string;
  askedByUserId: string;
  askedBy: string;
  askedAt: Date;
  status: QuestionLifecycleStatus;
  answeredAt?: Date;
  answeredByUserId?: string;
  answeredMessageId?: string;
}

export interface DetectedQuestionDto {
  id: string;
  content: string;
  askedBy: string;
  askedAt: Date;
  channelId: string;
  channelName: string;
  messageId: string;
}