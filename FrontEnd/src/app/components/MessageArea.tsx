import { useEffect, useRef, useState } from 'react';
import { Hash, Users, Video, Phone, Send, Paperclip, Smile, Bold, Italic, Underline, AtSign, X } from 'lucide-react';
import { Channel, Message } from '../data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MessageAreaProps {
  channel: Channel;
  messages: Message[];
  isParticipantsVisible: boolean;
  onToggleParticipants: () => void;
  isInCall: boolean;
  isVideoOn: boolean;
  onToggleCall: () => void;
  onToggleVideo: () => void;
}

interface LocalMessage extends Message {
  attachments?: string[];
}

export function MessageArea({
  channel,
  messages,
  isParticipantsVisible,
  onToggleParticipants,
  isInCall,
  isVideoOn,
  onToggleCall,
  onToggleVideo,
}: MessageAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>(messages);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalMessages(messages);
    setNewMessage('');
    setSelectedAttachments([]);
  }, [messages, channel.id]);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const insertAtCursor = (textToInsert: string) => {
    const input = inputRef.current;
    if (!input) {
      setNewMessage((current) => current + textToInsert);
      return;
    }

    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? newMessage.length;
    const updated =
      newMessage.slice(0, start) + textToInsert + newMessage.slice(end);

    setNewMessage(updated);

    requestAnimationFrame(() => {
      input.focus();
      const caret = start + textToInsert.length;
      input.setSelectionRange(caret, caret);
    });
  };

  const wrapSelection = (prefix: string, suffix: string, placeholder: string) => {
    const input = inputRef.current;
    if (!input) {
      setNewMessage((current) => `${current}${prefix}${placeholder}${suffix}`);
      return;
    }

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = newMessage.slice(start, end);
    const content = selectedText || placeholder;

    const updated =
      newMessage.slice(0, start) +
      `${prefix}${content}${suffix}` +
      newMessage.slice(end);

    setNewMessage(updated);

    requestAnimationFrame(() => {
      input.focus();
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + content.length;
      input.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleAttachFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    setSelectedAttachments((current) => [
      ...current,
      ...files.map((file) => file.name),
    ]);
    event.target.value = '';
  };

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed && selectedAttachments.length === 0) {
      return;
    }

    const outgoingMessage: LocalMessage = {
      id: `local-${Date.now()}`,
      userId: 'u-you',
      userName: 'You',
      userAvatar: '👤',
      content: trimmed || 'Sent an attachment',
      timestamp: new Date(),
      attachments: selectedAttachments,
    };

    setLocalMessages((current) => [...current, outgoingMessage]);
    setNewMessage('');
    setSelectedAttachments([]);
  };

  const renderFormattedContent = (content: string) => {
    const parts = content
      .split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|@[a-zA-Z0-9_]+)/g)
      .filter(Boolean);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith('__') && part.endsWith('__')) {
        return <span key={`${part}-${index}`} className="underline">{part.slice(2, -2)}</span>;
      }

      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
      }

      if (part.startsWith('@')) {
        return (
          <span
            key={`${part}-${index}`}
            className="text-[#6264a7] font-medium"
          >
            {part}
          </span>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Channel Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-[#e0e0e0]">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-[#616161]" />
          <span className="font-semibold text-[#242424]">{channel.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleVideo}
            className={`p-1 rounded ${
              isVideoOn
                ? 'text-[#dc2626] bg-[#fef2f2]'
                : 'text-[#616161] hover:text-[#242424] hover:bg-[#f5f5f5]'
            }`}
            aria-label="Toggle video"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onToggleCall}
            className={`p-1 rounded ${
              isInCall
                ? 'text-[#059669] bg-[#ecfdf5]'
                : 'text-[#616161] hover:text-[#242424] hover:bg-[#f5f5f5]'
            }`}
            aria-label="Toggle call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onToggleParticipants}
            className={`p-1 rounded ${
              isParticipantsVisible
                ? 'text-[#6264a7] bg-[#f5f5f5]'
                : 'text-[#616161] hover:text-[#242424] hover:bg-[#f5f5f5]'
            }`}
            aria-label="Toggle participants"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Channel Start */}
        <div className="mb-6 pb-6 border-b border-[#e0e0e0]">
          <div className="w-12 h-12 rounded-full bg-[#6264a7] flex items-center justify-center mb-3">
            <Hash className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-[#242424] mb-2">
            {channel.name}
          </h3>
          <p className="text-[#616161] text-sm">
            This channel is for everything related to {channel.name}. Start a conversation or share updates with the team.
          </p>
        </div>

        {/* Message List */}
        <div className="space-y-4">
          {localMessages.map((message, index) => {
            const showDate =
              index === 0 ||
              formatDate(localMessages[index - 1].timestamp) !==
                formatDate(message.timestamp);

            const showAvatar =
              index === 0 ||
              localMessages[index - 1].userId !== message.userId ||
              showDate;

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center gap-4 my-6">
                    <div className="h-px flex-1 bg-[#e0e0e0]"></div>
                    <span className="text-xs text-[#616161] font-medium px-2">
                      {formatDate(message.timestamp)}
                    </span>
                    <div className="h-px flex-1 bg-[#e0e0e0]"></div>
                  </div>
                )}
                <div className="flex gap-3 hover:bg-[#f5f5f5] px-4 py-2 -mx-4 rounded group">
                  {showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-[#6264a7] flex items-center justify-center text-white flex-shrink-0 text-xs font-semibold">
                      {getInitials(message.userName)}
                    </div>
                  ) : (
                    <div className="w-8 flex-shrink-0"></div>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-[#242424] text-sm">
                          {message.userName}
                        </span>
                        <span className="text-xs text-[#616161]">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className="text-[#242424] text-sm leading-relaxed">
                      {renderFormattedContent(message.content)}
                    </div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((attachment) => (
                          <span
                            key={attachment}
                            className="px-2 py-1 rounded bg-[#f5f5f5] text-xs text-[#424242]"
                          >
                            📎 {attachment}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Input */}
      <div className="px-6 pb-6 pt-2 border-t border-[#e0e0e0]">
        <div className="border border-[#e0e0e0] rounded-lg overflow-hidden focus-within:border-[#6264a7] bg-white">
          {selectedAttachments.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2 border-b border-[#f0f0f0] pb-2">
              {selectedAttachments.map((attachment) => (
                <span
                  key={attachment}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#f5f5f5] text-xs text-[#424242]"
                >
                  📎 {attachment}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAttachments((current) =>
                        current.filter((fileName) => fileName !== attachment),
                      )
                    }
                    className="hover:text-[#242424]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Type a message in ${channel.name}`}
              className="w-full bg-transparent text-[#242424] placeholder-[#616161] outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (newMessage.trim() || selectedAttachments.length > 0)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <div className="px-3 pb-2 flex items-center justify-between border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1 pt-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelection('**', '**', 'bold text')}
                className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#616161] hover:text-[#242424]"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelection('*', '*', 'italic text')}
                className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#616161] hover:text-[#242424]"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelection('__', '__', 'underlined text')}
                className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#616161] hover:text-[#242424]"
              >
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-[#e0e0e0] mx-1"></div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachFiles}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#616161] hover:text-[#242424]"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#616161] hover:text-[#242424]"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  {['😀', '😂', '🔥', '🎉', '👍', '❤️'].map((emoji) => (
                    <DropdownMenuItem
                      key={emoji}
                      onSelect={(e) => {
                        e.preventDefault();
                        insertAtCursor(`${emoji} `);
                      }}
                    >
                      {emoji}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertAtCursor('@')}
                className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#616161] hover:text-[#242424]"
              >
                <AtSign className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSendMessage}
              className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#6264a7] hover:text-[#5b5fc7] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newMessage.trim() && selectedAttachments.length === 0}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}