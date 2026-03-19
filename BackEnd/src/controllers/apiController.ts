import { Request, Response } from 'express';
import { ApiError } from '../middleware/apiError';
import {
  parseChannelIdParam,
  parseChannelCreateBody,
  parseChannelIdsQuery,
  parseDiscussionIdParam,
  parseDiscussionStatusBody,
  parseGroupIdParam,
  parseMessageCreateBody,
  parseNotificationIdParam,
  parseQuestionIdParam,
  parseServerIdParam,
  requireNotificationReadBody,
  requireUserIdQuery,
} from '../middleware/validation';
import { AppContext } from '../services/appContext';

export const createApiController = (context: AppContext) => {
  const getRoot = (_req: Request, res: Response) => {
    res.json({
      message: 'ChatRoom backend is running',
      health: '/health',
      api: '/api',
    });
  };

  const getHealth = (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'chatroom-backend' });
  };

  const getServers = (_req: Request, res: Response) => {
    res.json(context.staticData.servers);
  };

  const getGroups = (_req: Request, res: Response) => {
    res.json(context.staticData.groups);
  };

  const getMembers = (_req: Request, res: Response) => {
    res.json(context.staticData.members);
  };

  const postServerChannel = (req: Request, res: Response) => {
    const serverId = parseServerIdParam(req);
    const body = parseChannelCreateBody(req);

    const created = context.services.channelCatalogService.addServerChannel(serverId, body);
    if (!created) {
      throw new ApiError(404, 'Server not found');
    }

    res.status(201).json(created);
  };

  const postGroupChannel = (req: Request, res: Response) => {
    const groupId = parseGroupIdParam(req);
    const body = parseChannelCreateBody(req);

    const created = context.services.channelCatalogService.addGroupChannel(groupId, body);
    if (!created) {
      throw new ApiError(404, 'Group not found');
    }

    res.status(201).json(created);
  };

  const getChannelMessages = async (req: Request, res: Response) => {
    const channelId = parseChannelIdParam(req);
    res.json(await context.repositories.messageRepository.listByChannel(channelId));
  };

  const postChannelMessage = async (req: Request, res: Response) => {
    const channelId = parseChannelIdParam(req);
    const body = parseMessageCreateBody(req);

    const created = await context.services.questionStatusService.ingestMessage({
      channelId,
      userId: body.userId,
      userName: body.userName,
      userAvatar: body.userAvatar,
      content: body.content,
    });

    res.status(201).json(created);
  };

  const getQuestions = async (req: Request, res: Response) => {
    const channelIds = parseChannelIdsQuery(req);
    const unanswered = await context.services.questionStatusService.getUnansweredStatuses(channelIds);
    const dto = context.services.questionDetectionService.toDetectedQuestionDto(
      unanswered,
      context.channelNameMap,
    );
    res.json(dto);
  };

  const getDiscussions = async (req: Request, res: Response) => {
    const channelIds = parseChannelIdsQuery(req);
    const sourceChannelIds = channelIds && channelIds.length > 0
      ? channelIds
      : Array.from(context.channelNameMap.keys());

    const byChannelEntries = await Promise.all(
      sourceChannelIds.map(async (channelId) => {
        const channelMessages = await context.repositories.messageRepository.listByChannel(channelId);
        return [channelId, channelMessages] as const;
      }),
    );
    const byChannel = Object.fromEntries(byChannelEntries);

    res.json(await context.services.discussionService.detect(byChannel, context.channelNameMap, channelIds));
  };

  const getNotifications = async (req: Request, res: Response) => {
    const userId = requireUserIdQuery(req);
    res.json(await context.services.notificationService.listByUser(userId));
  };

  const markNotificationRead = async (req: Request, res: Response) => {
    const notificationId = parseNotificationIdParam(req);
    requireNotificationReadBody(req);

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Missing user identity (x-user-id header)');
    }

    const updated = await context.services.notificationService.markRead(notificationId, userId);
    if (!updated) {
      throw new ApiError(404, 'Notification not found');
    }

    res.json(updated);
  };

  const markQuestionAnswered = async (req: Request, res: Response) => {
    const questionId = parseQuestionIdParam(req);
    const actorUserId = req.user?.id || 'system';

    const updated = await context.services.questionStatusService.markQuestionAsAnswered(questionId, actorUserId);
    if (!updated) {
      throw new ApiError(404, 'Question not found');
    }

    res.json({
      id: updated.id,
      status: updated.status,
      answeredAt: updated.answeredAt,
    });
  };

  const updateDiscussionStatus = async (req: Request, res: Response) => {
    const discussionId = parseDiscussionIdParam(req);
    const status = parseDiscussionStatusBody(req);

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