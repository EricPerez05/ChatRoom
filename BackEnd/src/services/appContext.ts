import { groupMessages, groups, members, messages, servers } from '../data/mockData';
import { env } from '../config/env';
import { getDbClient } from '../db/client';
import { Message } from '../models/message';
import {
  InMemoryMessageRepository,
  MessageRepository,
  PostgresMessageRepository,
} from '../repositories/messageRepository';
import {
  InMemoryNotificationRepository,
  NotificationRepository,
  PostgresNotificationRepository,
} from '../repositories/notificationRepository';
import {
  InMemoryQuestionStatusRepository,
  PostgresQuestionStatusRepository,
  QuestionStatusRepository,
} from '../repositories/questionStatusRepository';
import { DiscussionService } from './discussionService';
import { NotificationService } from './notificationService';
import { QuestionDetectionService } from './questionDetectionService';
import { QuestionStatusService } from './questionStatusService';
import { ChannelCatalogService } from './channelCatalogService';
import { SimulatedResponseService } from './simulatedResponseService';
import { MemberPresenceService } from './memberPresenceService';
import { SimulatedConversationService } from './simulatedConversationService';
import {
  DiscussionStateRepository,
  InMemoryDiscussionStateRepository,
  PostgresDiscussionStateRepository,
} from '../repositories/discussionStateRepository';

const flattenMessages = (): Message[] => {
  const all = { ...messages, ...groupMessages };

  return Object.entries(all).flatMap(([channelId, channelMessages]) =>
    channelMessages.map((message) => ({
      id: message.id,
      channelId,
      userId: message.userId,
      userName: message.userName,
      userAvatar: message.userAvatar,
      content: message.content,
      timestamp: message.timestamp,
    })),
  );
};

const buildChannelNameMap = () => {
  const allChannels = [...servers, ...groups].flatMap((container) => container.channels);
  return new Map(allChannels.map((channel) => [channel.id, channel.name]));
};

export const createAppContext = async () => {
  const activeMembers = members.map((member) => ({ ...member }));
  const channelNameMap = buildChannelNameMap();
  const seededMessages = flattenMessages();
  let messageRepository: MessageRepository;
  let questionStatusRepository: QuestionStatusRepository;
  let notificationRepository: NotificationRepository;
  let discussionStateRepository: DiscussionStateRepository;

  if (env.persistenceMode === 'postgres') {
    const db = getDbClient();
    messageRepository = new PostgresMessageRepository(db);
    questionStatusRepository = new PostgresQuestionStatusRepository(db);
    notificationRepository = new PostgresNotificationRepository(db);
    discussionStateRepository = new PostgresDiscussionStateRepository(db);
  } else {
    messageRepository = new InMemoryMessageRepository(seededMessages);
    questionStatusRepository = new InMemoryQuestionStatusRepository();
    notificationRepository = new InMemoryNotificationRepository();
    discussionStateRepository = new InMemoryDiscussionStateRepository();
  }

  const questionDetectionService = new QuestionDetectionService();
  const notificationService = new NotificationService(notificationRepository);
  const memberPresenceService = new MemberPresenceService(activeMembers);
  memberPresenceService.startAutoUpdates();
  const simulatedResponseService = new SimulatedResponseService(
    activeMembers,
    questionDetectionService,
    memberPresenceService,
  );
  const questionStatusService = new QuestionStatusService(
    messageRepository,
    questionStatusRepository,
    questionDetectionService,
    notificationService,
  );
  if (env.persistenceMode === 'memory') {
    await questionStatusService.seedFromExistingMessages(seededMessages);
  }

  const discussionService = new DiscussionService(discussionStateRepository);
  const channelCatalogService = new ChannelCatalogService(servers, groups, channelNameMap);
  const simulatedConversationService = new SimulatedConversationService(
    messageRepository,
    simulatedResponseService,
  );
  simulatedConversationService.startAutoReplies();

  return {
    staticData: {
      servers,
      groups,
      members: activeMembers,
    },
    channelNameMap,
    services: {
      questionDetectionService,
      questionStatusService,
      notificationService,
      discussionService,
      channelCatalogService,
      simulatedResponseService,
      memberPresenceService,
      simulatedConversationService,
    },
    repositories: {
      messageRepository,
    },
  };
};

export type AppContext = Awaited<ReturnType<typeof createAppContext>>;