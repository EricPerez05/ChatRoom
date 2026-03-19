"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionDetectionService = void 0;
const QUESTION_STARTERS = /^(who|what|when|where|why|how|can|could|should|does|do|is|are)\b/i;
class QuestionDetectionService {
    isLikelyQuestion(content) {
        const trimmed = content.trim();
        return trimmed.includes('?') || QUESTION_STARTERS.test(trimmed);
    }
    toDetectedQuestionDto(statuses, channelNameMap) {
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
exports.QuestionDetectionService = QuestionDetectionService;
