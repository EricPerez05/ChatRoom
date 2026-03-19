"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppContext = void 0;
const mockData_1 = require("../data/mockData");
const env_1 = require("../config/env");
const client_1 = require("../db/client");
const messageRepository_1 = require("../repositories/messageRepository");
const notificationRepository_1 = require("../repositories/notificationRepository");
const questionStatusRepository_1 = require("../repositories/questionStatusRepository");
const discussionService_1 = require("./discussionService");
const notificationService_1 = require("./notificationService");
const questionDetectionService_1 = require("./questionDetectionService");
const questionStatusService_1 = require("./questionStatusService");
const channelCatalogService_1 = require("./channelCatalogService");
const discussionStateRepository_1 = require("../repositories/discussionStateRepository");
const flattenMessages = () => {
    const all = { ...mockData_1.messages, ...mockData_1.groupMessages };
    return Object.entries(all).flatMap(([channelId, channelMessages]) => channelMessages.map((message) => ({
        id: message.id,
        channelId,
        userId: message.userId,
        userName: message.userName,
        userAvatar: message.userAvatar,
        content: message.content,
        timestamp: message.timestamp,
    })));
};
const buildChannelNameMap = () => {
    const allChannels = [...mockData_1.servers, ...mockData_1.groups].flatMap((container) => container.channels);
    return new Map(allChannels.map((channel) => [channel.id, channel.name]));
};
const createAppContext = async () => {
    const channelNameMap = buildChannelNameMap();
    const seededMessages = flattenMessages();
    let messageRepository;
    let questionStatusRepository;
    let notificationRepository;
    let discussionStateRepository;
    if (env_1.env.persistenceMode === 'postgres') {
        const db = (0, client_1.getDbClient)();
        messageRepository = new messageRepository_1.PostgresMessageRepository(db);
        questionStatusRepository = new questionStatusRepository_1.PostgresQuestionStatusRepository(db);
        notificationRepository = new notificationRepository_1.PostgresNotificationRepository(db);
        discussionStateRepository = new discussionStateRepository_1.PostgresDiscussionStateRepository(db);
    }
    else {
        messageRepository = new messageRepository_1.InMemoryMessageRepository(seededMessages);
        questionStatusRepository = new questionStatusRepository_1.InMemoryQuestionStatusRepository();
        notificationRepository = new notificationRepository_1.InMemoryNotificationRepository();
        discussionStateRepository = new discussionStateRepository_1.InMemoryDiscussionStateRepository();
    }
    const questionDetectionService = new questionDetectionService_1.QuestionDetectionService();
    const notificationService = new notificationService_1.NotificationService(notificationRepository);
    const questionStatusService = new questionStatusService_1.QuestionStatusService(messageRepository, questionStatusRepository, questionDetectionService, notificationService);
    if (env_1.env.persistenceMode === 'memory') {
        await questionStatusService.seedFromExistingMessages(seededMessages);
    }
    const discussionService = new discussionService_1.DiscussionService(discussionStateRepository);
    const channelCatalogService = new channelCatalogService_1.ChannelCatalogService(mockData_1.servers, mockData_1.groups, channelNameMap);
    return {
        staticData: {
            servers: mockData_1.servers,
            groups: mockData_1.groups,
            members: mockData_1.members,
        },
        channelNameMap,
        services: {
            questionDetectionService,
            questionStatusService,
            notificationService,
            discussionService,
            channelCatalogService,
        },
        repositories: {
            messageRepository,
        },
    };
};
exports.createAppContext = createAppContext;
