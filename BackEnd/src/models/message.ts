export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
}

export interface CreateMessageInput {
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
}