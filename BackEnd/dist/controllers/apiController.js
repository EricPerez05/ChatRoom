"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiController = void 0;
const apiError_1 = require("../middleware/apiError");
const validation_1 = require("../middleware/validation");
const createApiController = (context) => {
    const getRoot = (_req, res) => {
        res.json({
            message: 'ChatRoom backend is running',
            health: '/health',
            api: '/api',
        });
    };
    const getHealth = (_req, res) => {
        res.json({ ok: true, service: 'chatroom-backend' });
    };
    const getServers = (_req, res) => {
        res.json(context.staticData.servers);
    };
    const getGroups = (_req, res) => {
        res.json(context.staticData.groups);
    };
    const getMembers = (_req, res) => {
        res.json(context.staticData.members);
    };
    const postServerChannel = (req, res) => {
        const serverId = (0, validation_1.parseServerIdParam)(req);
        const body = (0, validation_1.parseChannelCreateBody)(req);
        const created = context.services.channelCatalogService.addServerChannel(serverId, body);
        if (!created) {
            throw new apiError_1.ApiError(404, 'Server not found');
        }
        res.status(201).json(created);
    };
    const postGroupChannel = (req, res) => {
        const groupId = (0, validation_1.parseGroupIdParam)(req);
        const body = (0, validation_1.parseChannelCreateBody)(req);
        const created = context.services.channelCatalogService.addGroupChannel(groupId, body);
        if (!created) {
            throw new apiError_1.ApiError(404, 'Group not found');
        }
        res.status(201).json(created);
    };
    const getChannelMessages = async (req, res) => {
        const channelId = (0, validation_1.parseChannelIdParam)(req);
        res.json(await context.repositories.messageRepository.listByChannel(channelId));
    };
    const postChannelMessage = async (req, res) => {
        const channelId = (0, validation_1.parseChannelIdParam)(req);
        const body = (0, validation_1.parseMessageCreateBody)(req);
        const created = await context.services.questionStatusService.ingestMessage({
            channelId,
            userId: body.userId,
            userName: body.userName,
            userAvatar: body.userAvatar,
            content: body.content,
        });
        res.status(201).json(created);
    };
    const getQuestions = async (req, res) => {
        const channelIds = (0, validation_1.parseChannelIdsQuery)(req);
        const unanswered = await context.services.questionStatusService.getUnansweredStatuses(channelIds);
        const dto = context.services.questionDetectionService.toDetectedQuestionDto(unanswered, context.channelNameMap);
        res.json(dto);
    };
    const getDiscussions = async (req, res) => {
        const channelIds = (0, validation_1.parseChannelIdsQuery)(req);
        const sourceChannelIds = channelIds && channelIds.length > 0
            ? channelIds
            : Array.from(context.channelNameMap.keys());
        const byChannelEntries = await Promise.all(sourceChannelIds.map(async (channelId) => {
            const channelMessages = await context.repositories.messageRepository.listByChannel(channelId);
            return [channelId, channelMessages];
        }));
        const byChannel = Object.fromEntries(byChannelEntries);
        res.json(await context.services.discussionService.detect(byChannel, context.channelNameMap, channelIds));
    };
    const getNotifications = async (req, res) => {
        const userId = (0, validation_1.requireUserIdQuery)(req);
        res.json(await context.services.notificationService.listByUser(userId));
    };
    const markNotificationRead = async (req, res) => {
        const notificationId = (0, validation_1.parseNotificationIdParam)(req);
        (0, validation_1.requireNotificationReadBody)(req);
        const userId = req.user?.id;
        if (!userId) {
            throw new apiError_1.ApiError(401, 'Missing user identity (x-user-id header)');
        }
        const updated = await context.services.notificationService.markRead(notificationId, userId);
        if (!updated) {
            throw new apiError_1.ApiError(404, 'Notification not found');
        }
        res.json(updated);
    };
    const markQuestionAnswered = async (req, res) => {
        const questionId = (0, validation_1.parseQuestionIdParam)(req);
        const actorUserId = req.user?.id || 'system';
        const updated = await context.services.questionStatusService.markQuestionAsAnswered(questionId, actorUserId);
        if (!updated) {
            throw new apiError_1.ApiError(404, 'Question not found');
        }
        res.json({
            id: updated.id,
            status: updated.status,
            answeredAt: updated.answeredAt,
        });
    };
    const updateDiscussionStatus = async (req, res) => {
        const discussionId = (0, validation_1.parseDiscussionIdParam)(req);
        const status = (0, validation_1.parseDiscussionStatusBody)(req);
        const updatedStatus = await context.services.discussionService.setDiscussionStatus(discussionId, status);
        res.json({ id: discussionId, status: updatedStatus });
    };
    return {
        getRoot,
        getHealth,
        getServers,
        getGroups,
        getMembers,
        postServerChannel,
        postGroupChannel,
        getChannelMessages,
        postChannelMessage,
        getQuestions,
        getDiscussions,
        getNotifications,
        markNotificationRead,
        markQuestionAnswered,
        updateDiscussionStatus,
    };
};
exports.createApiController = createApiController;
