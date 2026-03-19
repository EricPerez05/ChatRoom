import { DetectedQuestionDto, QuestionStatus } from '../models/questionStatus';

const QUESTION_STARTERS = /^(who|what|when|where|why|how|can|could|should|does|do|is|are)\b/i;

export class QuestionDetectionService {
  isLikelyQuestion(content: string): boolean {
    const trimmed = content.trim();
    return trimmed.includes('?') || QUESTION_STARTERS.test(trimmed);
  }

  toDetectedQuestionDto(statuses: QuestionStatus[], channelNameMap: Map<string, string>): DetectedQuestionDto[] {
    return statuses
      .filter((status) => status.status === 'unanswered')
      .map((status) => ({
        id: status.id,
        content: status.questionContent,
        askedBy: status.askedBy,
        askedAt: status.askedAt,
        channelId: status.channelId,
        channelName: channelNameMap.get(status.channelId) || status.channelId,
        messageId: status.questionMessageId,
      }))
      .sort((left, right) => right.askedAt.getTime() - left.askedAt.getTime());
  }
}