"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRouter = void 0;
const express_1 = require("express");
const rateLimit_1 = require("../middleware/rateLimit");
const apiController_1 = require("../controllers/apiController");
const createApiRouter = (context, maxWriteRequestsPerMinute) => {
    const router = (0, express_1.Router)();
    const controller = (0, apiController_1.createApiController)(context);
    const writeLimiter = (0, rateLimit_1.createWriteRateLimiter)(maxWriteRequestsPerMinute);
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
exports.createApiRouter = createApiRouter;
