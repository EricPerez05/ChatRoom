export interface Server {
  id: string;
  name: string;
  icon?: string;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category: string;
}

export interface Message {
  id: string;
  channelId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
}

export interface CreateMessageInput {
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
}

export interface DetectedQuestion {
  id: string;
  content: string;
  askedBy: string;
  askedAt: Date;
  channelId: string;
  channelName: string;
  messageId: string;
}

export interface DetectedDiscussion {
  id: string;
  topic: string;
  status: 'active' | 'detected' | 'resolved' | 'archived';
  participants: string[];
  lastActivity: Date;
  channelId: string;
  channelName: string;
  messageCount: number;
  messageId: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'offline';
}

export interface Notification {
  id: string;
  type: 'question_answered';
  questionMessageId: string;
  channelId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
