import { Router } from 'express';
import { createWriteRateLimiter } from '../middleware/rateLimit';
import { AppContext } from '../services/appContext';
import { createApiController } from '../controllers/apiController';

export const createApiRouter = (context: AppContext, maxWriteRequestsPerMinute: number) => {
  const router = Router();
  const controller = createApiController(context);
  const writeLimiter = createWriteRateLimiter(maxWriteRequestsPerMinute);

  router.get('/servers', controller.getServers);
  router.get('/groups', controller.getGroups);
  router.get('/members', controller.getMembers);
  router.post('/servers/:serverId/channels', writeLimiter, controller.postServerChannel);
  router.post('/groups/:groupId/channels', writeLimiter, controller.postGroupChannel);

  router.get('/channels/:channelId/messages', controller.getChannelMessages);
  router.post('/channels/:channelId/messages', writeLimiter, controller.postChannelMessage);

  router.get('/questions', controller.getQuestions);
  router.patch('/questions/:questionId/answered', writeLimiter, controller.markQuestionAnswered);
  router.get('/discussions', controller.getDiscussions);
  router.patch('/discussions/:discussionId/status', writeLimiter, controller.updateDiscussionStatus);

  router.get('/notifications', controller.getNotifications);
  router.patch('/notifications/:notificationId/read', writeLimiter, controller.markNotificationRead);

  return {
    router,
    controller,
  };
};