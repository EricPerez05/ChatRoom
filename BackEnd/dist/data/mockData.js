"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetectedDiscussions = exports.getUnansweredQuestions = exports.groupMessages = exports.groups = exports.members = exports.messages = exports.servers = void 0;
exports.servers = [
    {
        id: '1',
        name: 'General Community',
        icon: '🏠',
        channels: [
            { id: 'c1', name: 'general', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'c2', name: 'random', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'c3', name: 'memes', type: 'text', category: 'TEXT CHANNELS' },
        ],
    },
    {
        id: '2',
        name: 'Gaming Squad',
        icon: '🎮',
        channels: [
            { id: 'c6', name: 'announcements', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'c7', name: 'game-chat', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'c8', name: 'lfg', type: 'text', category: 'TEXT CHANNELS' },
        ],
    },
    {
        id: '3',
        name: 'Design Team',
        icon: '🎨',
        channels: [
            { id: 'c11', name: 'design-chat', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'c12', name: 'feedback', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'c13', name: 'resources', type: 'text', category: 'TEXT CHANNELS' },
        ],
    },
];
exports.messages = {
    c1: [
        {
            id: 'm1',
            userId: 'u1',
            userName: 'Alex',
            userAvatar: '👤',
            content: 'Hey everyone! Welcome to the server!',
            timestamp: new Date(2026, 1, 18, 10, 30),
        },
        {
            id: 'm2',
            userId: 'u2',
            userName: 'Jordan',
            userAvatar: '👨',
            content: 'Thanks! Excited to be here 🎉',
            timestamp: new Date(2026, 1, 18, 10, 32),
        },
        {
            id: 'm3',
            userId: 'u3',
            userName: 'Sam',
            userAvatar: '👩',
            content: 'Anyone up for some gaming later?',
            timestamp: new Date(2026, 1, 18, 10, 35),
        },
        {
            id: 'm4',
            userId: 'u1',
            userName: 'Alex',
            userAvatar: '👤',
            content: 'I\'m down! What game?',
            timestamp: new Date(2026, 1, 18, 10, 36),
        },
        {
            id: 'm5',
            userId: 'u4',
            userName: 'Morgan',
            userAvatar: '🧑',
            content: 'Count me in too!',
            timestamp: new Date(2026, 1, 18, 10, 38),
        },
        {
            id: 'm8',
            userId: 'u2',
            userName: 'Jordan',
            userAvatar: '👨',
            content: 'Can we lock the Q1 roadmap milestones before Friday?',
            timestamp: new Date(2026, 1, 18, 10, 50),
        },
        {
            id: 'm9',
            userId: 'u1',
            userName: 'Alex',
            userAvatar: '👤',
            content: 'Yes, let\'s review roadmap scope and owners in this thread.',
            timestamp: new Date(2026, 1, 18, 10, 55),
        },
        {
            id: 'm10',
            userId: 'u3',
            userName: 'Sam',
            userAvatar: '👩',
            content: 'I\'ll post a revised project plan after lunch.',
            timestamp: new Date(2026, 1, 18, 11, 0),
        },
    ],
    c2: [
        {
            id: 'm6',
            userId: 'u2',
            userName: 'Jordan',
            userAvatar: '👨',
            content: 'Random chat time!',
            timestamp: new Date(2026, 1, 18, 11, 0),
        },
        {
            id: 'm11',
            userId: 'u5',
            userName: 'Casey',
            userAvatar: '👨',
            content: 'Anyone have team-building event ideas for March?',
            timestamp: new Date(2026, 1, 18, 11, 12),
        },
        {
            id: 'm12',
            userId: 'u4',
            userName: 'Morgan',
            userAvatar: '🧑',
            content: 'Escape room or bowling could work for the whole group.',
            timestamp: new Date(2026, 1, 18, 11, 14),
        },
    ],
    c6: [
        {
            id: 'm7',
            userId: 'u1',
            userName: 'Alex',
            userAvatar: '👤',
            content: '📢 New tournament starting next week!',
            timestamp: new Date(2026, 1, 18, 9, 0),
        },
        {
            id: 'm13',
            userId: 'u6',
            userName: 'Taylor',
            userAvatar: '👩',
            content: 'Should we open registration tonight?',
            timestamp: new Date(2026, 1, 18, 9, 15),
        },
    ],
    c7: [
        {
            id: 'm14',
            userId: 'u1',
            userName: 'Alex',
            userAvatar: '👤',
            content: 'API latency spikes are back after the latest patch.',
            timestamp: new Date(2026, 1, 19, 8, 30),
        },
        {
            id: 'm15',
            userId: 'u2',
            userName: 'Jordan',
            userAvatar: '👨',
            content: 'Can we profile the matchmaking endpoint today?',
            timestamp: new Date(2026, 1, 19, 8, 35),
        },
        {
            id: 'm16',
            userId: 'u6',
            userName: 'Taylor',
            userAvatar: '👩',
            content: 'I found a database query causing performance bottlenecks.',
            timestamp: new Date(2026, 1, 19, 8, 45),
        },
    ],
    c11: [
        {
            id: 'm17',
            userId: 'u4',
            userName: 'Morgan',
            userAvatar: '🧑',
            content: 'Let\'s finalize the new design system tokens and spacing scale.',
            timestamp: new Date(2026, 1, 19, 10, 5),
        },
        {
            id: 'm18',
            userId: 'u5',
            userName: 'Casey',
            userAvatar: '👨',
            content: 'Should we keep the primary button fill or move to outline?',
            timestamp: new Date(2026, 1, 19, 10, 9),
        },
        {
            id: 'm19',
            userId: 'u4',
            userName: 'Morgan',
            userAvatar: '🧑',
            content: 'Keep fill for now and publish guidance in documentation.',
            timestamp: new Date(2026, 1, 19, 10, 16),
        },
    ],
    c12: [
        {
            id: 'm20',
            userId: 'u3',
            userName: 'Sam',
            userAvatar: '👩',
            content: 'Can someone review my onboarding mockups?',
            timestamp: new Date(2026, 1, 19, 11, 20),
        },
    ],
};
exports.members = [
    { id: 'u1', name: 'Alex', avatar: '👤', status: 'online' },
    { id: 'u2', name: 'Jordan', avatar: '👨', status: 'online' },
    { id: 'u3', name: 'Sam', avatar: '👩', status: 'online' },
    { id: 'u4', name: 'Morgan', avatar: '🧑', status: 'idle' },
    { id: 'u5', name: 'Casey', avatar: '👨', status: 'offline' },
    { id: 'u6', name: 'Taylor', avatar: '👩', status: 'online' },
];
// Groups reuse the Server structure for now (separate namespace from servers)
exports.groups = [
    {
        id: 'g1',
        name: 'Study Group A',
        icon: '📚',
        channels: [
            { id: 'g1c1', name: 'questions', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'g1c2', name: 'resources', type: 'text', category: 'TEXT CHANNELS' },
        ],
    },
    {
        id: 'g2',
        name: 'Project Team',
        icon: '🛠️',
        channels: [
            { id: 'g2c1', name: 'general', type: 'text', category: 'TEXT CHANNELS' },
            { id: 'g2c2', name: 'design', type: 'text', category: 'TEXT CHANNELS' },
        ],
    },
];
// Messages for group channels (mocked backend data)
exports.groupMessages = {
    g1c1: [
        {
            id: 'gm1',
            userId: 'u2',
            userName: 'Jordan',
            userAvatar: '👨',
            content: 'Does anyone understand problem 3 from the assignment?',
            timestamp: new Date(2026, 1, 20, 9, 15),
        },
        {
            id: 'gm2',
            userId: 'u3',
            userName: 'Sam',
            userAvatar: '👩',
            content: 'I can pair later today.',
            timestamp: new Date(2026, 1, 20, 9, 20),
        },
        {
            id: 'gm4',
            userId: 'u2',
            userName: 'Jordan',
            userAvatar: '👨',
            content: 'What\'s the best way to prove the runtime for question 4?',
            timestamp: new Date(2026, 1, 20, 9, 28),
        },
    ],
    g2c1: [
        {
            id: 'gm3',
            userId: 'u1',
            userName: 'Alex',
            userAvatar: '👤',
            content: "I'll post the project plan by EOD.",
            timestamp: new Date(2026, 1, 19, 14, 0),
        },
        {
            id: 'gm5',
            userId: 'u6',
            userName: 'Taylor',
            userAvatar: '👩',
            content: 'Do we need a separate deployment checklist for staging?',
            timestamp: new Date(2026, 1, 19, 14, 12),
        },
    ],
    g2c2: [
        {
            id: 'gm6',
            userId: 'u4',
            userName: 'Morgan',
            userAvatar: '🧑',
            content: 'Design review at 3 PM: typography, spacing, and card hierarchy.',
            timestamp: new Date(2026, 1, 20, 8, 45),
        },
        {
            id: 'gm7',
            userId: 'u5',
            userName: 'Casey',
            userAvatar: '👨',
            content: 'Could we simplify the navigation pattern in mobile view?',
            timestamp: new Date(2026, 1, 20, 8, 54),
        },
        {
            id: 'gm8',
            userId: 'u4',
            userName: 'Morgan',
            userAvatar: '🧑',
            content: 'Yes, we can prototype a compact nav and test it tomorrow.',
            timestamp: new Date(2026, 1, 20, 9, 2),
        },
    ],
};
const DISCUSSION_KEYWORDS = [
    'roadmap',
    'design',
    'deployment',
    'plan',
    'api',
    'performance',
    'review',
    'architecture',
    'documentation',
    'runtime',
    'checklist',
    'tournament',
];
const QUESTION_STARTERS = /^(who|what|when|where|why|how|can|could|should|does|do|is|are)\b/i;
const buildChannelNameMap = () => {
    const allChannels = [...exports.servers, ...exports.groups].flatMap((container) => container.channels);
    return new Map(allChannels.map((channel) => [channel.id, channel.name]));
};
const getAllMessageContexts = () => {
    const channelNameMap = buildChannelNameMap();
    const allMessageRecords = [exports.messages, exports.groupMessages];
    return allMessageRecords.flatMap((record) => Object.entries(record).flatMap(([channelId, channelMessages]) => channelMessages.map((message) => ({
        channelId,
        channelName: channelNameMap.get(channelId) || channelId,
        message,
    }))));
};
const isLikelyQuestion = (content) => {
    const trimmed = content.trim();
    return trimmed.includes('?') || QUESTION_STARTERS.test(trimmed);
};
const filterByChannelIds = (items, channelIds) => {
    if (!channelIds || channelIds.length === 0) {
        return items;
    }
    const channelSet = new Set(channelIds);
    return items.filter((item) => channelSet.has(item.channelId));
};
const getUnansweredQuestions = (channelIds) => {
    const contexts = filterByChannelIds(getAllMessageContexts(), channelIds);
    const byChannel = contexts.reduce((acc, entry) => {
        if (!acc[entry.channelId]) {
            acc[entry.channelId] = [];
        }
        acc[entry.channelId].push(entry);
        return acc;
    }, {});
    const detected = [];
    Object.values(byChannel).forEach((channelEntries) => {
        const ordered = [...channelEntries].sort((left, right) => left.message.timestamp.getTime() - right.message.timestamp.getTime());
        ordered.forEach((entry, index) => {
            if (!isLikelyQuestion(entry.message.content)) {
                return;
            }
            const hasReplyFromSomeoneElse = ordered
                .slice(index + 1)
                .some((next) => next.message.userId !== entry.message.userId);
            if (!hasReplyFromSomeoneElse) {
                detected.push({
                    id: `q-${entry.message.id}`,
                    content: entry.message.content,
                    askedBy: entry.message.userName,
                    askedAt: entry.message.timestamp,
                    channelId: entry.channelId,
                    channelName: entry.channelName,
                    messageId: entry.message.id,
                });
            }
        });
    });
    return detected.sort((left, right) => right.askedAt.getTime() - left.askedAt.getTime());
};
exports.getUnansweredQuestions = getUnansweredQuestions;
const topicFromMessages = (channelName, channelMessages) => {
    const combined = channelMessages.map((message) => message.content.toLowerCase()).join(' ');
    if (combined.includes('roadmap'))
        return 'Roadmap planning';
    if (combined.includes('design'))
        return 'Design system discussion';
    if (combined.includes('deployment'))
        return 'Deployment process';
    if (combined.includes('api') || combined.includes('performance'))
        return 'API performance optimization';
    if (combined.includes('runtime') || combined.includes('assignment'))
        return 'Assignment problem solving';
    if (combined.includes('tournament'))
        return 'Tournament planning';
    if (combined.includes('team-building'))
        return 'Team-building ideas';
    return `Discussion in #${channelName}`;
};
const getDiscussionStatus = (lastActivity, referenceTime) => {
    const hoursBehind = Math.floor((referenceTime - lastActivity.getTime()) / (60 * 60 * 1000));
    if (hoursBehind <= 8)
        return 'active';
    if (hoursBehind <= 24)
        return 'detected';
    if (hoursBehind <= 72)
        return 'resolved';
    return 'archived';
};
const getDetectedDiscussions = (channelIds) => {
    const contexts = filterByChannelIds(getAllMessageContexts(), channelIds);
    const byChannel = contexts.reduce((acc, entry) => {
        if (!acc[entry.channelId]) {
            acc[entry.channelId] = [];
        }
        acc[entry.channelId].push(entry);
        return acc;
    }, {});
    if (contexts.length === 0) {
        return [];
    }
    const referenceTime = Math.max(...contexts.map((entry) => entry.message.timestamp.getTime()));
    const discussions = Object.entries(byChannel)
        .map(([channelId, channelEntries]) => {
        const orderedMessages = [...channelEntries]
            .map((entry) => entry.message)
            .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
        const participants = Array.from(new Set(orderedMessages.map((message) => message.userName)));
        const textBlob = orderedMessages.map((message) => message.content.toLowerCase()).join(' ');
        const keywordHits = DISCUSSION_KEYWORDS.filter((keyword) => textBlob.includes(keyword)).length;
        const questionCount = orderedMessages.filter((message) => isLikelyQuestion(message.content)).length;
        if (orderedMessages.length < 3 || participants.length < 2 || (keywordHits === 0 && questionCount === 0)) {
            return null;
        }
        const lastActivity = orderedMessages[orderedMessages.length - 1].timestamp;
        const targetMessage = orderedMessages[orderedMessages.length - 1];
        return {
            id: `d-${channelId}`,
            topic: topicFromMessages(channelEntries[0].channelName, orderedMessages),
            status: getDiscussionStatus(lastActivity, referenceTime),
            participants,
            lastActivity,
            channelId,
            channelName: channelEntries[0].channelName,
            messageCount: orderedMessages.length,
            messageId: targetMessage.id,
        };
    })
        .filter((discussion) => Boolean(discussion));
    return discussions.sort((left, right) => right.lastActivity.getTime() - left.lastActivity.getTime());
};
exports.getDetectedDiscussions = getDetectedDiscussions;
