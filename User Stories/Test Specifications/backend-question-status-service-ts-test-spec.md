# Test Specification: BackEnd/src/services/questionStatusService.ts

## Functions in Scope
1. constructor
2. ingestMessage
3. getUnansweredStatuses
4. markQuestionAsAnswered
5. seedFromExistingMessages
6. createQuestionStatusIfAbsent
7. evaluateAnswerTransitions

## Unit Test Table
| Test ID | Function | Purpose | Test Inputs | Expected Output |
|---|---|---|---|---|
| QSS-01 | constructor | Wires all dependencies into service instance | mocked messageRepo, questionRepo, detectionService, notificationService | New instance created and methods callable without dependency errors |
| QSS-02 | ingestMessage | Saves incoming message and creates question status when content is a question | input content=Can someone help?, detection returns true | messageRepository.save called once; createQuestionStatusIfAbsent path executed; returned message has generated id |
| QSS-03 | ingestMessage | Saves message and evaluates answer transitions when not a question | input content=Here is the fix, detection returns false | messageRepository.save called; evaluateAnswerTransitions path executed |
| QSS-04 | getUnansweredStatuses | Uses listByChannels when channelIds provided | channelIds=[c1,c2], repo returns mixed statuses | Returns only unanswered statuses from channel-limited query |
| QSS-05 | getUnansweredStatuses | Uses listByStatus when no channelIds provided | channelIds undefined, repo listByStatus returns statuses | Returns only unanswered statuses |
| QSS-06 | markQuestionAsAnswered | Returns undefined when question not found | findById returns undefined | Returns undefined and does not call save or notification |
| QSS-07 | markQuestionAsAnswered | Returns existing when already answered | findById returns status answered | Returns existing status unchanged; no notification created |
| QSS-08 | markQuestionAsAnswered | Updates unanswered question and emits notification | findById returns unanswered question | Saves answered status, calls createQuestionAnsweredNotification once, returns updated status |
| QSS-09 | seedFromExistingMessages | Processes messages in timestamp order | two messages out of order by time | Detection and transition calls occur in chronological order |
| QSS-10 | createQuestionStatusIfAbsent | Does nothing when status for message already exists | findByQuestionMessageId returns existing | save not called |
| QSS-11 | createQuestionStatusIfAbsent | Creates unanswered status when missing | findByQuestionMessageId returns undefined and message is provided | save called with new status containing question fields |
| QSS-12 | evaluateAnswerTransitions | Filters to eligible pending unanswered questions only | listByChannel returns unanswered/answered/self-authored/newer-old mix | Only eligible statuses are saved as answered |
| QSS-13 | evaluateAnswerTransitions | Emits one notification per transitioned status | listByChannel returns two eligible pending statuses | notificationService called exactly twice with updated statuses |
