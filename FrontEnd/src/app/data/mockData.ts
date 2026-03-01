export interface Server {
  id: string;
  name: string;
  icon?: string;
  channels: Channel[];
  // Mocked list of people currently in the call for this server
  currentCallMembers?: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category: string;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'offline';
}

export const servers: Server[] = [
  {
    id: '1',
    name: 'General Community',
    icon: '🏠',
    channels: [
      { id: 'c1', name: 'general', type: 'text', category: 'TEXT CHANNELS' },
      { id: 'c2', name: 'random', type: 'text', category: 'TEXT CHANNELS' },
      { id: 'c3', name: 'memes', type: 'text', category: 'TEXT CHANNELS' },
    ],
    currentCallMembers: ['Alex', 'Jordan'],
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
    currentCallMembers: ['Sam'],
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
    currentCallMembers: [],
  },
];

export const messages: Record<string, Message[]> = {
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
  ],
};

export const members: Member[] = [
  { id: 'u1', name: 'Alex', avatar: '👤', status: 'online' },
  { id: 'u2', name: 'Jordan', avatar: '👨', status: 'online' },
  { id: 'u3', name: 'Sam', avatar: '👩', status: 'online' },
  { id: 'u4', name: 'Morgan', avatar: '🧑', status: 'idle' },
  { id: 'u5', name: 'Casey', avatar: '👨', status: 'offline' },
  { id: 'u6', name: 'Taylor', avatar: '👩', status: 'online' },
];

// Groups reuse the Server structure for now (separate namespace from servers)
export const groups: Server[] = [
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
export const groupMessages: Record<string, Message[]> = {
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
  ],
};
