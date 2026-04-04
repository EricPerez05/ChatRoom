# Test Specification: BackEnd/src/controllers/apiController.ts

## Functions in Scope
1. createApiController
2. getRoot
3. getHealth
4. getServers
5. getGroups
6. getMembers
7. postServerChannel
8. postGroupChannel
9. getChannelMessages
10. postChannelMessage
11. getQuestions
12. getDiscussions
13. getNotifications
14. markNotificationRead
15. markQuestionAnswered
16. updateDiscussionStatus

## Unit Test Table
| Test ID | Function | Purpose | Test Inputs | Expected Output |
|---|---|---|---|---|
| CTR-01 | createApiController | Returns object exposing all handlers | mocked AppContext | Returned object has all 15 expected handler functions |
| CTR-02 | getRoot | Returns service discovery payload | req empty, mocked res.json | Response JSON includes message, health, api |
| CTR-03 | getHealth | Returns health check payload | req empty | Response JSON ok=true and service=chatroom-backend |
| CTR-04 | getServers | Returns static servers from context | context.staticData.servers preset | Response JSON equals preset servers |
| CTR-05 | getGroups | Returns static groups from context | context.staticData.groups preset | Response JSON equals preset groups |
| CTR-06 | getMembers | Returns static members from context | context.staticData.members preset | Response JSON equals preset members |
| CTR-07 | postServerChannel | Creates server channel and returns 201 | parsed serverId/body valid, service returns channel | Response status 201 with created channel |
| CTR-08 | postServerChannel | Throws 404 ApiError when server missing | service returns undefined | Throws ApiError with status 404 |
| CTR-09 | postGroupChannel | Creates group channel and returns 201 | parsed groupId/body valid, service returns channel | Response status 201 with created channel |
| CTR-10 | postGroupChannel | Throws 404 ApiError when group missing | service returns undefined | Throws ApiError with status 404 |
| CTR-11 | getChannelMessages | Returns messages for channel | parseChannelIdParam returns c1, repository returns messages | Response JSON equals repository list |
| CTR-12 | postChannelMessage | Ingests message and returns 201 | parse body + channel, service returns created message | Response status 201 with created message |
| CTR-13 | getQuestions | Converts unanswered statuses to DTO and returns list | parseChannelIdsQuery returns [c1], service returns statuses | Response JSON equals DTO output from questionDetectionService |
| CTR-14 | getDiscussions | Uses requested channelIds and returns detection output | parseChannelIdsQuery returns [c1,c2], repo returns per channel, detect returns list | Response JSON equals detect result |
| CTR-15 | getDiscussions | Falls back to all known channel IDs when no query | parseChannelIdsQuery undefined, channelNameMap has ids | detect called with map keys as source channels |
| CTR-16 | getNotifications | Requires userId query and returns notifications | requireUserIdQuery returns u1, listByUser returns list | Response JSON equals notification list |
| CTR-17 | markNotificationRead | Rejects when user identity header missing | req.user undefined | Throws ApiError 401 |
| CTR-18 | markNotificationRead | Rejects when notification does not exist | req.user.id present, markRead returns undefined | Throws ApiError 404 |
| CTR-19 | markNotificationRead | Returns updated notification | req.user.id present, markRead returns entity | Response JSON equals updated notification |
| CTR-20 | markQuestionAnswered | Marks question with req.user.id actor | req.user.id=u2, service returns updated status | Response JSON contains id, status, answeredAt |
| CTR-21 | markQuestionAnswered | Falls back to system actor when req.user missing | req.user undefined, service mock inspects args | Service called with actorUserId=system |
| CTR-22 | markQuestionAnswered | Throws 404 when question not found | service returns undefined | Throws ApiError 404 |
| CTR-23 | updateDiscussionStatus | Updates status and returns payload | parseDiscussionId/status valid, service returns updated status | Response JSON contains id and updated status |
