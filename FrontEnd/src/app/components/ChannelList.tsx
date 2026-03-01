import { Link, useNavigate, useParams } from 'react-router';
import { Hash, Plus, MoreHorizontal, Bell, BellOff } from 'lucide-react';
import { Channel, Server } from '../data/mockData';
import { useEffect, useState } from 'react';
import { UnansweredQuestions } from './UnansweredQuestions';
import { OngoingDiscussions } from './OngoingDiscussions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ChannelListProps {
  server: Server;
  callStatus?: {
    isInCall: boolean;
    isVideoOn: boolean;
    currentUserName?: string;
  };
}

export function ChannelList({ server, callStatus }: ChannelListProps) {
  const navigate = useNavigate();
  const { channelId } = useParams();

  const [activeTab, setActiveTab] = useState<'channels' | 'questions' | 'discussions'>('channels');
  const [localChannels, setLocalChannels] = useState<Channel[]>(server.channels);
  const [mutedChannels, setMutedChannels] = useState<Set<string>>(new Set());
  const [isServerMuted, setIsServerMuted] = useState(false);
  const [serverDisplayName, setServerDisplayName] = useState(server.name);
  const [isRenamingServer, setIsRenamingServer] = useState(false);
  const [draftServerName, setDraftServerName] = useState(server.name);
  const [addingChannelCategory, setAddingChannelCategory] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');

  useEffect(() => {
    setServerDisplayName(server.name);
    setDraftServerName(server.name);
    setIsRenamingServer(false);
    setLocalChannels(server.channels);
    setAddingChannelCategory(null);
    setNewChannelName('');
  }, [server.id, server.name]);

  const toggleChannelMute = (channelIdToToggle: string) => {
    setMutedChannels((current) => {
      const updated = new Set(current);
      if (updated.has(channelIdToToggle)) {
        updated.delete(channelIdToToggle);
      } else {
        updated.add(channelIdToToggle);
      }
      return updated;
    });
  };

  const handleStartRenameServer = () => {
    setDraftServerName(serverDisplayName);
    setIsRenamingServer(true);
  };

  const handleSubmitRenameServer = () => {
    const nextName = draftServerName.trim();
    if (nextName) {
      setServerDisplayName(nextName);
    }
    setDraftServerName((current) => current.trim() || serverDisplayName);
    setIsRenamingServer(false);
  };

  const handleCancelRenameServer = () => {
    setDraftServerName(serverDisplayName);
    setIsRenamingServer(false);
  };

  const handleLeaveServer = () => {
    navigate('/');
  };

  const handleCreateChannel = (category: string) => {
    if (!newChannelName.trim()) {
      return;
    }

    const normalizedName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    const newChannel: Channel = {
      id: `c-${Date.now()}`,
      name: normalizedName,
      type: 'text',
      category,
    };

    setLocalChannels((current) => [...current, newChannel]);
    setNewChannelName('');
    setAddingChannelCategory(null);
  };

  // Group channels by category
  const categories = localChannels.reduce((acc, channel) => {
    // Only show text channels; voice channels have been removed in favor of a call box
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {} as Record<string, typeof server.channels>);

  const currentUserName = callStatus?.currentUserName || 'You';
  const callMembers = [...(server.currentCallMembers || [])];
  if (callStatus?.isInCall && !callMembers.includes(currentUserName)) {
    callMembers.push(currentUserName);
  }

  return (
    <div className="w-80 bg-white border-r border-[#e0e0e0] flex flex-col">
      {/* Server Header */}
      <div className="px-5 py-4 border-b border-[#e0e0e0]">
        <div className="flex items-center justify-between mb-3">
          {isRenamingServer ? (
            <input
              autoFocus
              type="text"
              value={draftServerName}
              onChange={(e) => setDraftServerName(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={handleSubmitRenameServer}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitRenameServer();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelRenameServer();
                }
              }}
              className="flex-1 min-w-0 mr-2 text-xl font-semibold text-[#242424] bg-transparent border border-[#d1d1d1] rounded px-2 py-0.5 outline-none focus:border-[#6264a7]"
            />
          ) : (
            <h2 className="text-xl font-semibold text-[#242424] truncate">{serverDisplayName}</h2>
          )}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-[#f5f5f5] rounded" type="button">
                  <MoreHorizontal className="w-4 h-4 text-[#616161]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  handleStartRenameServer();
                }}>
                  Rename Server
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  setIsServerMuted((current) => !current);
                }}>
                  {isServerMuted ? 'Unmute Server' : 'Mute Server'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleLeaveServer();
                  }}
                >
                  Leave Server
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('channels')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'channels'
                ? 'border-[#6264a7] text-[#6264a7]'
                : 'border-transparent text-[#616161] hover:text-[#242424]'
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative whitespace-nowrap ${
              activeTab === 'discussions'
                ? 'border-[#6264a7] text-[#6264a7]'
                : 'border-transparent text-[#616161] hover:text-[#242424]'
            }`}
          >
            Discussions
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#059669] text-white text-[10px] rounded-full flex items-center justify-center">
              2
            </span>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-[#6264a7] text-[#6264a7]'
                : 'border-transparent text-[#616161] hover:text-[#242424]'
            }`}
          >
            Questions
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#ea580c] text-white text-[10px] rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>

      {/* Channel List */}
      {activeTab === 'channels' && (
        <div className="flex-1 overflow-y-auto">
          {/* Pinned/Favorites section could go here */}
          
          {Object.entries(categories).map(([category, channels]) => (
            <div key={category} className="py-3">
              <div className="px-5 mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#616161]">
                  {category}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAddingChannelCategory(category);
                    setNewChannelName('');
                  }}
                  className="p-1 hover:bg-[#f5f5f5] rounded opacity-0 hover:opacity-100"
                >
                  <Plus className="w-3.5 h-3.5 text-[#616161]" />
                </button>
              </div>
              <div className="space-y-0.5">
                {channels.map((channel) => (
                  <Link
                    key={channel.id}
                    to={`/server/${server.id}/channel/${channel.id}`}
                  >
                    <div
                      className={`mx-2 px-3 py-2.5 rounded flex items-center justify-between cursor-pointer group ${
                        channelId === channel.id
                          ? 'bg-[#e8e8f8]'
                          : 'hover:bg-[#f5f5f5]'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 ${
                            channelId === channel.id
                              ? 'text-[#6264a7]'
                              : 'text-[#616161]'
                          }`}
                        >
                          <Hash className="w-4 h-4" />
                        </div>
                        <span className={`text-sm truncate ${
                          channelId === channel.id
                            ? 'font-semibold text-[#242424]'
                            : 'text-[#424242]'
                        }`}>
                          {channel.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleChannelMute(channel.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            mutedChannels.has(channel.id)
                              ? 'hover:bg-[#ffebee]'
                              : 'hover:bg-white'
                          }`}
                        >
                          {mutedChannels.has(channel.id) ? (
                            <BellOff className="w-3.5 h-3.5 text-[#d32f2f]" />
                          ) : (
                            <Bell className="w-3.5 h-3.5 text-[#616161]" />
                          )}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1 hover:bg-white rounded"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-[#616161]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              toggleChannelMute(channel.id);
                            }}>
                              {mutedChannels.has(channel.id) ? 'Unmute Channel' : 'Mute Channel'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Channel Notifications
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Edit Channel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {category.toLowerCase().includes('text') && (
                <div className="px-5 pt-2">
                  {addingChannelCategory === category ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateChannel(category);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setAddingChannelCategory(null);
                            setNewChannelName('');
                          }
                        }}
                        placeholder="new-channel-name"
                        className="w-full px-3 py-2 text-sm border border-[#d1d1d1] rounded outline-none focus:border-[#6264a7]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateChannel(category)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#6264a7] rounded hover:bg-[#5b5fc7]"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingChannelCategory(null);
                            setNewChannelName('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-[#616161] hover:bg-[#f5f5f5] rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingChannelCategory(category);
                        setNewChannelName('');
                      }}
                      className="w-full px-3 py-2 text-sm text-[#6264a7] hover:bg-[#f5f5f5] rounded flex items-center gap-2 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add a channel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Currently in call box (replaces voice channels section) */}
          <div className="px-5 py-3 border-t border-[#f0f0f0] mt-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-[#616161] uppercase">
                Currently in call
              </h3>
            </div>
            {callMembers.length > 0 ? (
              <ul className="space-y-1">
                {callMembers.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-2 text-sm text-[#424242]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#92c353]" />
                    <span className="truncate">{name}</span>
                    {name === currentUserName && callStatus?.isVideoOn && (
                      <span
                        className="w-2 h-2 rounded-full bg-[#dc2626]"
                        title="Recording"
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#949494]">
                No one is currently in the call.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && <UnansweredQuestions />}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && <OngoingDiscussions />}

    </div>
  );
}