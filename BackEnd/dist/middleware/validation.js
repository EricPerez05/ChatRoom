"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChannelCreateBody = exports.parseGroupIdParam = exports.parseServerIdParam = exports.parseDiscussionStatusBody = exports.parseDiscussionIdParam = exports.parseQuestionIdParam = exports.parseNotificationIdParam = exports.parseChannelIdParam = exports.parseMessageCreateBody = exports.requireNotificationReadBody = exports.requireUserIdQuery = exports.parseChannelIdsQuery = void 0;
const apiError_1 = require("./apiError");
const parseChannelIdsQuery = (req) => {
    const raw = req.query.channelIds;
    if (typeof raw !== 'string') {
        return undefined;
    }
    const parsed = raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
};
exports.parseChannelIdsQuery = parseChannelIdsQuery;
const requireUserIdQuery = (req) => {
    const raw = req.query.userId;
    if (typeof raw !== 'string' || raw.trim().length === 0) {
        throw new apiError_1.ApiError(400, 'Query param userId is required');
    }
    const userId = raw.trim();
    if (req.user && req.user.id !== userId) {
        throw new apiError_1.ApiError(403, 'Forbidden: cannot access notifications for another user');
    }
    return userId;
};
exports.requireUserIdQuery = requireUserIdQuery;
const requireNotificationReadBody = (req) => {
    const read = req.body?.read;
    if (read !== true) {
        throw new apiError_1.ApiError(400, 'Body must include read=true');
    }
    return true;
};
exports.requireNotificationReadBody = requireNotificationReadBody;
const parseMessageCreateBody = (req) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
        throw new apiError_1.ApiError(400, 'Request body is required');
    }
    if (typeof body.userId !== 'string' || body.userId.trim().length === 0) {
        throw new apiError_1.ApiError(400, 'userId is required');
    }
    if (typeof body.userName !== 'string' || body.userName.trim().length === 0) {
        throw new apiError_1.ApiError(400, 'userName is required');
    }
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
        throw new apiError_1.ApiError(400, 'content is required');
    }
    if (body.content.length > 2000) {
        throw new apiError_1.ApiError(400, 'content exceeds 2000 characters');
    }
    if (req.user && req.user.id !== body.userId.trim()) {
        throw new apiError_1.ApiError(403, 'Forbidden: user mismatch');
    }
    const simulateConversation = body.simulateConversation === true;
    return {
        userId: body.userId.trim(),
        userName: body.userName.trim(),
        userAvatar: typeof body.userAvatar === 'string' && body.userAvatar.trim().length > 0
            ? body.userAvatar.trim()
            : undefined,
        content: body.content.trim(),
        simulateConversation,
    };
};
exports.parseMessageCreateBody = parseMessageCreateBody;
const parseChannelIdParam = (req) => {
    const channelId = req.params.channelId;
    if (!channelId || typeof channelId !== 'string') {
        throw new apiError_1.ApiError(400, 'Invalid channelId');
    }
    return channelId;
};
exports.parseChannelIdParam = parseChannelIdParam;
const parseNotificationIdParam = (req) => {
    const notificationId = req.params.notificationId;
    if (!notificationId || typeof notificationId !== 'string') {
        throw new apiError_1.ApiError(400, 'Invalid notificationId');
    }
    return notificationId;
};
exports.parseNotificationIdParam = parseNotificationIdParam;
const parseQuestionIdParam = (req) => {
    const questionId = req.params.questionId;
    if (!questionId || typeof questionId !== 'string') {
        throw new apiError_1.ApiError(400, 'Invalid questionId');
    }
    return questionId;
};
exports.parseQuestionIdParam = parseQuestionIdParam;
const parseDiscussionIdParam = (req) => {
    const discussionId = req.params.discussionId;
    if (!discussionId || typeof discussionId !== 'string') {
        throw new apiError_1.ApiError(400, 'Invalid discussionId');
    }
    return discussionId;
};
exports.parseDiscussionIdParam = parseDiscussionIdParam;
const parseDiscussionStatusBody = (req) => {
    const status = req.body?.status;
    const allowedStatuses = ['active', 'detected', 'resolved', 'archived'];
    if (typeof status !== 'string' || !allowedStatuses.includes(status)) {
        throw new apiError_1.ApiError(400, 'Body must include status: active|detected|resolved|archived');
    }
    return status;
};
exports.parseDiscussionStatusBody = parseDiscussionStatusBody;
const parseServerIdParam = (req) => {
    const serverId = req.params.serverId;
    if (!serverId || typeof serverId !== 'string') {
        throw new apiError_1.ApiError(400, 'Invalid serverId');
    }
    return serverId;
};
exports.parseServerIdParam = parseServerIdParam;
const parseGroupIdParam = (req) => {
    const groupId = req.params.groupId;
    if (!groupId || typeof groupId !== 'string') {
        throw new apiError_1.ApiError(400, 'Invalid groupId');
    }
    return groupId;
};
exports.parseGroupIdParam = parseGroupIdParam;
const parseChannelCreateBody = (req) => {
    const body = req.body;
    if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw new apiError_1.ApiError(400, 'name is required');
    }
    const name = body.name.trim();
    if (name.length > 64) {
        throw new apiError_1.ApiError(400, 'name exceeds 64 characters');
    }
    const type = body.type === 'voice' ? 'voice' : 'text';
    const category = typeof body.category === 'string' && body.category.trim().length > 0
        ? body.category.trim()
        : 'TEXT CHANNELS';
    return {
        name,
        category,
        type,
    };
};
exports.parseChannelCreateBody = parseChannelCreateBody;
