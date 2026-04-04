# Test Specification: FrontEnd/src/app/components/OngoingDiscussions.tsx

## Functions in Scope
1. readHiddenDiscussionIds
2. writeHiddenDiscussionIds
3. OngoingDiscussions
4. loadDiscussions
5. buildChannelPath
6. formatTimeAgo
7. getStatusConfig
8. getDeletionDeadline
9. formatTimeUntilDeletion
10. handleArchiveDiscussion
11. handleResolveDiscussion
12. handleHideDiscussion
13. getFilterLabel

## Unit Test Table
| Test ID | Function | Purpose | Test Inputs | Expected Output |
|---|---|---|---|---|
| ODG-01 | readHiddenDiscussionIds | Returns empty Set when localStorage key missing | localStorage.getItem returns null | Returns empty Set |
| ODG-02 | readHiddenDiscussionIds | Returns only string IDs from stored JSON array | stored value ["d1",2,"d2",null] | Returns Set containing d1 and d2 only |
| ODG-03 | readHiddenDiscussionIds | Handles invalid JSON safely | stored value {invalid | Returns empty Set |
| ODG-04 | writeHiddenDiscussionIds | Persists Set values as JSON array | hiddenIds Set(d1,d2) | localStorage.setItem called with JSON ["d1","d2"] |
| ODG-05 | OngoingDiscussions | Renders loading then success list | props channelIds=[c1], mocked getDiscussions returns one item | Loading state replaced by one rendered discussion row |
| ODG-06 | loadDiscussions | Sets active count callback for active/detected only | discussions statuses active,resolved,detected | onActiveCountChange called with 2 |
| ODG-07 | loadDiscussions | Sets error view on API failure | mocked getDiscussions throws | Error state rendered with retry button |
| ODG-08 | buildChannelPath | Builds group route when groupId exists | groupId=g1, channelId=c1, messageId=m1 | Returns /group/g1/channel/c1?message=m1 |
| ODG-09 | buildChannelPath | Builds server route when serverId exists | serverId=s1, channelId=c1, messageId=m1 | Returns /server/s1/channel/c1?message=m1 |
| ODG-10 | formatTimeAgo | Formats minute-based output | now minus 5 minutes | Returns 5m ago |
| ODG-11 | getStatusConfig | Maps resolved status to expected label/color/icon config | status=resolved | Returns object label Resolved and resolved style tokens |
| ODG-12 | getDeletionDeadline | Adds retention window to lastActivity | lastActivity fixed date | Returns date exactly +7 days |
| ODG-13 | formatTimeUntilDeletion | Returns null when deletion deadline passed | discussion lastActivity older than 7 days | Returns null |
| ODG-14 | formatTimeUntilDeletion | Returns day/hour countdown when still retained | discussion lastActivity 1 day ago | Returns string matching Deletes in Xd Yh |
| ODG-15 | handleArchiveDiscussion | Updates status to archived and reloads list | discussionId=d1, mock updateDiscussionStatus success | updateDiscussionStatus called with archived; load refresh triggered |
| ODG-16 | handleResolveDiscussion | Updates status to resolved and reloads list | discussionId=d1 | updateDiscussionStatus called with resolved; load refresh triggered |
| ODG-17 | handleHideDiscussion | Adds hidden ID and persists it | discussionId=d1 | Hidden set includes d1 and localStorage updated |
| ODG-18 | getFilterLabel | Maps filter token to user label | filter=active | Returns Active |
