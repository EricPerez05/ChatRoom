import { useEffect, useRef, useState } from 'react';
import { Hash, Users, Send, Smile, Bold, Italic, Underline, AtSign, Loader2 } from 'lucide-react';
import { Channel, CreateMessageInput, Member, Message, PostMessageResult } from '../types/chat';
import { useLocation } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MessageAreaProps {
  channel: Channel;
  messages: Message[];
  members: Member[];
  isParticipantsVisible: boolean;
  onToggleParticipants: () => void;
  onSendMessage: (channelId: string, payload: CreateMessageInput) => Promise<PostMessageResult>;
  /** True while the parent is fetching messages for this channel (e.g. after switching channels). */
  isMessagesLoading?: boolean;
}

interface LocalMessage extends Message {
  attachments?: string[];
}

interface TypingIndicator {
  id: string;
  name: string;
}

export function MessageArea({
  channel,
  messages,
  members,
  isParticipantsVisible,
  onToggleParticipants,
  onSendMessage,
  isMessagesLoading = false,
}: MessageAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>(messages);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [mentionState, setMentionState] = useState<{ query: string; start: number; end: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isSimConversationEnabled, setIsSimConversationEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem('sim-conversation-enabled') === 'true';
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutsRef = useRef<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    typingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    typingTimeoutsRef.current = [];
    setTypingIndicators([]);
    setLocalMessages(messages);
    setNewMessage('');
    setMentionState(null);
  }, [messages, channel.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetMessageId = params.get('message');

    if (!targetMessageId) {
      setHighlightedMessageId(null);
      return;
    }

    const targetElement = document.getElementById(`message-${targetMessageId}`);
    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(targetMessageId);

    const timer = window.setTimeout(() => {
      setHighlightedMessageId((current) =>
        current === targetMessageId ? null : current,
      );
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [location.search, channel.id, localMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, typingIndicators]);

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

  const getMentionInfo = (value: string, caret: number) => {
    const upToCaret = value.slice(0, caret);
    const atIndex = upToCaret.lastIndexOf('@');
    if (atIndex === -1) {
      return null;
    }

    const prevChar = atIndex > 0 ? upToCaret[atIndex - 1] : '';
    if (prevChar && !/\s/.test(prevChar)) {
      return null;
    }

    const query = upToCaret.slice(atIndex + 1);
    if (/\s/.test(query)) {
      return null;
    }

    return { query, start: atIndex, end: caret };
  };

  const updateMentionState = (value: string, caret: number) => {
    const info = getMentionInfo(value, caret);
    setMentionState(info);
    setMentionIndex(0);
  };

  const mentionCandidates = (() => {
    if (!mentionState) {
      return [];
    }

    const query = mentionState.query.trim().toLowerCase();
    const ranked = [...members]
      .filter((member) => {
        if (query.length === 0) {
          return true;
        }
        return member.name.toLowerCase().includes(query);
      })
      .sort((left, right) => {
        const rank = (status: Member['status']) => {
          if (status === 'online') return 0;
          if (status === 'idle') return 1;
          return 2;
        };

        const statusDiff = rank(left.status) - rank(right.status);
        if (statusDiff !== 0) {
          return statusDiff;
        }

        return left.name.localeCompare(right.name);
      });

    return ranked.slice(0, 6);
  })();

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionState?.query, members]);

  const applyMention = (member: Member) => {
    if (!mentionState) {
      return;
    }

    const prefix = newMessage.slice(0, mentionState.start);
    const suffix = newMessage.slice(mentionState.end);
    const mentionText = `@${member.name} `;
    const updated = `${prefix}${mentionText}${suffix}`;
    setNewMessage(updated);
    setMentionState(null);

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }
      input.focus();
      const caret = prefix.length + mentionText.length;
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

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || isSending || isMessagesLoading) {
      return;
    }

    setIsSending(true);

    const payload: CreateMessageInput = {
      userId: 'u-you',
      userName: 'You',
      userAvatar: '👤',
      content: trimmed,
      simulateConversation: isSimConversationEnabled,
    };

    try {
      const result = await onSendMessage(channel.id, payload);
      setLocalMessages((current) => [...current, result.message]);
      queueSimulatedMessages(result.simulated.map((message) => ({ ...message })));
      setNewMessage('');
    } catch {
      return;
    } finally {
      setIsSending(false);
    }
  };

  const queueSimulatedMessages = (simulatedMessages: LocalMessage[]) => {
    if (simulatedMessages.length === 0) {
      return;
    }

    simulatedMessages.forEach((message, index) => {
      const lengthDelay = Math.min(message.content.length * 30, 1600);
      const base = 700 + lengthDelay;
      const jitter = Math.floor(Math.random() * 900);
      const delay = base + jitter + index * 550;
      const indicatorId = `typing-${message.id}`;

      setTypingIndicators((current) => {
        if (current.some((item) => item.id === indicatorId)) {
          return current;
        }
        return [...current, { id: indicatorId, name: message.userName }];
      });

      const timeoutId = window.setTimeout(() => {
        setTypingIndicators((current) => current.filter((item) => item.id !== indicatorId));
        setLocalMessages((current) => [...current, message]);
      }, delay);

      typingTimeoutsRef.current.push(timeoutId);
    });
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
            onClick={() => {
              const next = !isSimConversationEnabled;
              setIsSimConversationEnabled(next);
              window.localStorage.setItem('sim-conversation-enabled', String(next));
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isSimConversationEnabled
                ? 'bg-[#e8e8f8] border-[#b7b8e6] text-[#3f3f8f]'
                : 'bg-white border-[#d0d0d0] text-[#616161] hover:text-[#242424]'
            }`}
            aria-pressed={isSimConversationEnabled}
          >
            Sim chat {isSimConversationEnabled ? 'on' : 'off'}
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

      {isMessagesLoading && (
        <div
          className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-[#f5f5ff] border-b border-[#e0e0e8] text-[#3f3f8f] text-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-[#6264a7]" aria-hidden />
          Loading messages…
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4"
        aria-busy={isMessagesLoading}
      >
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
        <div className="space-y-2">
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
                <div
                  id={`message-${message.id}`}
                  className={`flex gap-3 px-4 py-1.5 -mx-4 rounded group transition-colors ${
                    highlightedMessageId === message.id
                      ? 'bg-[#e8e8f8] ring-1 ring-[#6264a7]/30'
                      : 'hover:bg-[#f5f5f5]'
                  }`}
                >
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
                  </div>
                </div>
              </div>
            );
          })}
          {typingIndicators.length > 0 && (
            <div className="flex gap-3 px-4 py-2 -mx-4 rounded bg-[#f5f5f5]">
              <div className="w-8 h-8 rounded-full bg-[#6264a7] flex items-center justify-center text-white flex-shrink-0 text-xs font-semibold">
                {getInitials(typingIndicators[0].name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-[#242424] text-sm">
                    {typingIndicators[0].name} is typing
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#b0b0b0] animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-[#b0b0b0] animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-[#b0b0b0] animate-pulse"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="px-6 pb-6 pt-2 border-t border-[#e0e0e0]">
        <div className="border border-[#e0e0e0] rounded-lg focus-within:border-[#6264a7] bg-white">
          <div className="px-4 py-3 relative">
            <input
              ref={inputRef}
              type="text"
              disabled={isMessagesLoading}
              value={newMessage}
              onChange={(e) => {
                const value = e.target.value;
                setNewMessage(value);
                const caret = e.target.selectionStart ?? value.length;
                updateMentionState(value, caret);
              }}
              placeholder={`Type a message in ${channel.name}`}
              className="w-full bg-transparent text-[#242424] placeholder-[#616161] outline-none text-sm"
              onClick={(e) => {
                const value = (e.target as HTMLInputElement).value;
                const caret = (e.target as HTMLInputElement).selectionStart ?? value.length;
                updateMentionState(value, caret);
              }}
              onKeyUp={(e) => {
                const target = e.currentTarget;
                const caret = target.selectionStart ?? target.value.length;
                updateMentionState(target.value, caret);
              }}
              onKeyDown={(e) => {
                if (mentionState && mentionCandidates.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIndex((current) => (current + 1) % mentionCandidates.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIndex((current) =>
                      (current - 1 + mentionCandidates.length) % mentionCandidates.length,
                    );
                    return;
                  }
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    applyMention(mentionCandidates[mentionIndex]);
                    return;
                  }
                  if (e.key === 'Escape') {
                    setMentionState(null);
                    return;
                  }
                }
                if (e.key === 'Enter' && newMessage.trim() && !isMessagesLoading) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
            />
            {mentionState && mentionCandidates.length > 0 && (
              <div className="absolute left-4 right-4 top-full z-20 mt-2 rounded-lg border border-[#e0e0e0] bg-white shadow-lg">
                <div className="py-1">
                  {mentionCandidates.map((member, index) => (
                    <button
                      key={member.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applyMention(member)}
                      className={`w-full px-3 py-2 flex items-center gap-3 text-left text-sm ${
                        index === mentionIndex ? 'bg-[#f5f5f5]' : 'hover:bg-[#f9f9f9]'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-[#6264a7] text-white flex items-center justify-center text-[11px] font-semibold">
                        {getInitials(member.name)}
                      </span>
                      <span className="flex-1 text-[#242424]">{member.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.status === 'online'
                            ? 'bg-[#3cb371]'
                            : member.status === 'idle'
                              ? 'bg-[#f5a623]'
                              : 'bg-[#b0b0b0]'
                        }`}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              onClick={() => {
                void handleSendMessage();
              }}
              className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#6264a7] hover:text-[#5b5fc7] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || !newMessage.trim() || isMessagesLoading}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}