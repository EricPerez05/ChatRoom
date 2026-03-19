import { Message } from '../models/message';
import {
  DiscussionStateRepository,
  DiscussionStatus,
} from '../repositories/discussionStateRepository';

export interface DetectedDiscussionDto {
  id: string;
  topic: string;
  status: DiscussionStatus;
  participants: string[];
  lastActivity: Date;
  channelId: string;
  channelName: string;
  messageCount: number;
  messageId: string;
}

const DISCUSSION_KEYWORDS = [
  'roadmap',
  'design',
  'deployment',
  'plan',
  'api',
  'performance',
  'review',
  'architecture',
  'documentation',
  'runtime',
  'checklist',
  'tournament',
];

const hasDiscussionKeyword = (content: string) => {
  const normalized = content.toLowerCase();
  return DISCUSSION_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const topicFromMessages = (channelName: string, channelMessages: Message[]) => {
  const combined = channelMessages.map((message) => message.content.toLowerCase()).join(' ');

  if (combined.includes('roadmap')) return 'Roadmap planning';
  if (combined.includes('design')) return 'Design system discussion';
  if (combined.includes('deployment')) return 'Deployment process';
  if (combined.includes('api') || combined.includes('performance')) return 'API performance optimization';
  if (combined.includes('runtime') || combined.includes('assignment')) return 'Assignment problem solving';
  if (combined.includes('tournament')) return 'Tournament planning';
  if (combined.includes('team-building')) return 'Team-building ideas';

  return `Discussion in #${channelName}`;
};

const getDiscussionStatus = (lastActivity: Date, referenceTime: number): DiscussionStatus => {
  const hoursBehind = Math.floor((referenceTime - lastActivity.getTime()) / (60 * 60 * 1000));

  if (hoursBehind <= 8) return 'active';
  if (hoursBehind <= 24) return 'detected';
  if (hoursBehind <= 72) return 'resolved';
  return 'archived';
};

const isLikelyQuestion = (content: string) => {
  const trimmed = content.trim();
  return trimmed.includes('?') || /^(who|what|when|where|why|how|can|could|should|does|do|is|are)\b/i.test(trimmed);
};

const getThreadAnchorMessageId = (messages: Message[]) => {
  const firstQuestion = messages.find((message) => isLikelyQuestion(message.content));
  if (firstQuestion) {
    return firstQuestion.id;
  }

  const firstKeywordMessage = messages.find((message) => hasDiscussionKeyword(message.content));
  if (firstKeywordMessage) {
    return firstKeywordMessage.id;
  }

  return messages[0]?.id;
};

export class DiscussionService {
  constructor(private readonly discussionStateRepository: DiscussionStateRepository) {}

  async setDiscussionStatus(discussionId: string, status: DiscussionStatus) {
    return this.discussionStateRepository.setStatus(discussionId, status);
  }

  async detect(
    messagesByChannel: Record<string, Message[]>,
    channelNameMap: Map<string, string>,
    channelIds?: string[],
  ): Promise<DetectedDiscussionDto[]> {
    const selectedChannelIds = channelIds && channelIds.length > 0
      ? channelIds
      : Object.keys(messagesByChannel);

    const channels = selectedChannelIds
      .map((channelId) => ({ channelId, messages: messagesByChannel[channelId] || [] }))
      .filter((entry) => entry.messages.length > 0);

    if (channels.length === 0) {
      return [];
    }

    const referenceTime = Math.max(
      ...channels.flatMap((entry) => entry.messages.map((message) => message.timestamp.getTime())),
    );

    const detected = await Promise.all(channels.map(async (entry) => {
        const orderedMessages = [...entry.messages]
          .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
        const participants = Array.from(new Set(orderedMessages.map((message) => message.userName)));
        const textBlob = orderedMessages.map((message) => message.content.toLowerCase()).join(' ');
        const keywordHits = DISCUSSION_KEYWORDS.filter((keyword) => textBlob.includes(keyword)).length;
        const questionCount = orderedMessages.filter((message) => isLikelyQuestion(message.content)).length;

        if (orderedMessages.length < 3 || participants.length < 2 || (keywordHits === 0 && questionCount === 0)) {
          return null;
        }

        const lastMessage = orderedMessages[orderedMessages.length - 1];

        const discussionId = `d-${entry.channelId}`;
        const computedStatus = getDiscussionStatus(lastMessage.timestamp, referenceTime);
        const overriddenStatus = await this.discussionStateRepository.getStatus(discussionId);
        const threadAnchorMessageId = getThreadAnchorMessageId(orderedMessages) || lastMessage.id;

        return {
          id: discussionId,
          topic: topicFromMessages(channelNameMap.get(entry.channelId) || entry.channelId, orderedMessages),
          status: overriddenStatus || computedStatus,
          participants,
          lastActivity: lastMessage.timestamp,
          channelId: entry.channelId,
          channelName: channelNameMap.get(entry.channelId) || entry.channelId,
          messageCount: orderedMessages.length,
          messageId: threadAnchorMessageId,
        } satisfies DetectedDiscussionDto;
      }));

    return detected
      .filter((discussion): discussion is DetectedDiscussionDto => Boolean(discussion))
      .sort((left, right) => right.lastActivity.getTime() - left.lastActivity.getTime());
  }
}