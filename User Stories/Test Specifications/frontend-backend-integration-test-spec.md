# Frontend-Backend Integration Test Specification

## Functionality that must be tested

- Frontend API client can reach backend public REST endpoints.
- Catalog data endpoints return server, group, and member data to the UI.
- Channel creation requests from frontend persist in backend channel catalogs.
- Message posting from frontend persists and is returned by channel message queries.
- Question detection pipeline updates when new messages are posted.
- Question status transitions to answered through frontend action.
- Discussion status updates persist across repeated fetches.
- Notification retrieval and notification read state updates work end-to-end.

## Integration tests

| Test purpose | Inputs | Expected output |
| --- | --- | --- |
| Load base catalog data for initial app screens | Frontend calls `getServers()`, `getGroups()`, `getMembers()` | All three responses return non-empty arrays with valid object shapes |
| Create a server channel through frontend API | `createServerChannel('1', { name, type, category })` | Response contains created channel and matches input name/type/category |
| Create a group channel through frontend API | `createGroupChannel('g1', { name, type, category })` | Response contains created group channel and matches input name/type/category |
| Read existing channel messages | `getChannelMessages('c2')` | Response contains at least one message with parsed `Date` timestamp |
| Post new channel message | `postChannelMessage('c2', { userId, userName, content })` | Response returns created message; subsequent `getChannelMessages('c2')` contains it |
| Detect seeded unanswered question and resolve it | `getQuestions(['c12'])`, then `markQuestionAnswered(questionId)` | Question with `messageId='m20'` exists before update and is absent after update |
| Persist discussion status updates | `getDiscussions(['c7'])`, then `updateDiscussionStatus(discussionId, 'resolved')`, then `getDiscussions(['c7'])` | Discussion status becomes `resolved` in subsequent fetch |
| Produce and read notifications for answered question | `postChannelMessage('c12', question)`, `getQuestions(['c12'])`, `markQuestionAnswered(questionId)`, `getNotifications('u3')`, `markNotificationRead(notificationId, 'u3')` | Notification for posted question is returned and `isRead` is `true` after update |
