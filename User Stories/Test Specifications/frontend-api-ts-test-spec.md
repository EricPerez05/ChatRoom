# Test Specification: FrontEnd/src/app/services/api.ts

## Functions in Scope
1. fetchJson
2. fetchJsonWithInit
3. deserializeMessage
4. deserializeNotification
5. deserializeQuestion
6. deserializeDiscussion
7. getServers
8. getGroups
9. getMembers
10. createServerChannel
11. createGroupChannel
12. getChannelMessages
13. postChannelMessage
14. getQuestions
15. getDiscussions
16. markQuestionAnswered
17. updateDiscussionStatus
18. getNotifications
19. markNotificationRead

## Unit Test Table
| Test ID | Function | Purpose | Test Inputs | Expected Output |
|---|---|---|---|---|
| API-01 | fetchJson | Returns parsed JSON when HTTP is successful | path=/api/servers, mocked fetch returns ok=true and JSON array | Promise resolves to parsed array |
| API-02 | fetchJson | Throws on non-ok response | path=/api/servers, mocked fetch returns ok=false status=500 | Promise rejects with Error containing Request failed (500) |
| API-03 | fetchJsonWithInit | Sends request init and returns parsed JSON | path=/api/x, init method=POST body, mocked fetch ok=true | Promise resolves to parsed JSON and fetch called with init |
| API-04 | fetchJsonWithInit | Throws on failed response | path=/api/x, init PATCH, mocked fetch ok=false status=404 | Promise rejects with Error containing 404 |
| API-05 | deserializeMessage | Converts timestamp string to Date | message timestamp=2026-04-04T10:00:00.000Z | Returned object has timestamp as Date with matching ISO |
| API-06 | deserializeNotification | Converts createdAt string to Date | notification createdAt string | Returned object has createdAt Date |
| API-07 | deserializeQuestion | Converts askedAt string to Date | question askedAt string | Returned object has askedAt Date |
| API-08 | deserializeDiscussion | Converts lastActivity string to Date | discussion lastActivity string | Returned object has lastActivity Date |
| API-09 | getServers | Calls servers endpoint | mocked fetchJson success on /api/servers | Promise resolves to Server[] from endpoint |
| API-10 | getGroups | Calls groups endpoint | mocked fetchJson success on /api/groups | Promise resolves to Server[] from endpoint |
| API-11 | getMembers | Calls members endpoint | mocked fetchJson success on /api/members | Promise resolves to Member[] from endpoint |
| API-12 | createServerChannel | Posts server channel payload with default user header | serverId=s1, payload name/type/category | Promise resolves to created Channel and request has POST + x-user-id=u-you |
| API-13 | createGroupChannel | Posts group channel payload with default user header | groupId=g1, payload name/type/category | Promise resolves to created Channel and request has POST + x-user-id=u-you |
| API-14 | getChannelMessages | Fetches channel messages and deserializes all timestamps | channelId=c1 with two serialized messages | Promise resolves to Message[] where each timestamp is Date |
| API-15 | postChannelMessage | Posts message with user header and deserializes response | channelId=c1, payload userId=u1 | Promise resolves to Message with Date timestamp; request header x-user-id=u1 |
| API-16 | getQuestions | Builds query string when channelIds present | channelIds=[c1,c2], mocked serialized response | Calls /api/questions?channelIds=c1%2Cc2 and returns DetectedQuestion[] with Date askedAt |
| API-17 | getDiscussions | Builds query string and deserializes lastActivity | channelIds=[c1], mocked serialized response | Returns DetectedDiscussion[] with Date lastActivity |
| API-18 | markQuestionAnswered | Sends PATCH to answered endpoint | questionId=q1 | Promise resolves void; request method PATCH and body {} |
| API-19 | updateDiscussionStatus | Sends PATCH with status body | discussionId=d1, status=resolved | Promise resolves void; request body contains status=resolved |
| API-20 | getNotifications | Fetches notifications for user and deserializes createdAt | userId=u1 | Returns Notification[] with createdAt Date |
| API-21 | markNotificationRead | Marks notification read and deserializes response | notificationId=n1, userId=u1 | Returns Notification with Date createdAt; request body read=true and x-user-id=u1 |
