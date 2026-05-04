import { Link, useParams } from 'react-router';
import { Hash, Plus } from 'lucide-react';
import { Channel, Server } from '../types/chat';
import { useEffect, useState } from 'react';
import { UnansweredQuestions } from './UnansweredQuestions';
import { OngoingDiscussions } from './OngoingDiscussions';
import { createGroupChannel, createServerChannel, getDiscussions, getQuestions } from '../services/api';

interface ChannelListProps {
  server: Server;
  onChannelCreated?: (containerId: string, channel: Channel) => void;
}

export function ChannelList({ server, onChannelCreated }: ChannelListProps) {
  const { channelId, serverId, groupId } = useParams();

  const [activeTab, setActiveTab] = useState<'channels' | 'questions' | 'discussions'>('channels');
  const [localChannels, setLocalChannels] = useState<Channel[]>(server.channels);
  const [serverDisplayName, setServerDisplayName] = useState(server.name);
  const [addingChannelCategory, setAddingChannelCategory] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const channelIds = localChannels.map((channel) => channel.id);
  const [questionCount, setQuestionCount] = useState(0);
  const [discussionCount, setDiscussionCount] = useState(0);

  const loadTabCounts = async () => {
    const [questions, discussions] = await Promise.all([
      getQuestions(channelIds),
      getDiscussions(channelIds),
    ]);

    setQuestionCount(questions.length);
    setDiscussionCount(
      discussions.filter(
        (discussion) => discussion.status === 'active' || discussion.status === 'detected',
      ).length,
    );
  };

  useEffect(() => {
    setServerDisplayName(server.name);
    setLocalChannels(server.channels);
    setAddingChannelCategory(null);
    setNewChannelName('');
  }, [server.id, server.name, server.channels]);

  useEffect(() => {
    void loadTabCounts();

    const intervalId = window.setInterval(() => {
      void loadTabCounts();
    }, 3000);

    const handleWindowFocus = () => {
      void loadTabCounts();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [channelIds.join('|')]);

  const handleCreateChannel = async (category: string) => {
    if (!newChannelName.trim()) {
      return;
    }

    const normalizedName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    try {
      let created: Channel | undefined;

      if (serverId) {
        created = await createServerChannel(serverId, {
          name: normalizedName,
          type: 'text',
          category,
        });
      } else if (groupId) {
        created = await createGroupChannel(groupId, {
          name: normalizedName,
          type: 'text',
          category,
        });
      }

      if (created) {
        onChannelCreated?.(server.id, created);
        setLocalChannels((current) => {
          if (current.some((channel) => channel.id === created.id)) {
            return current;
          }
          return [...current, created];
        });
      }
    } catch {
      return;
    } finally {
      setNewChannelName('');
      setAddingChannelCategory(null);
      void loadTabCounts();
    }
  };

  // Group channels by category
  const categories = localChannels.reduce((acc, channel) => {
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {} as Record<string, typeof server.channels>);

  return (
    <div className="w-80 bg-white border-r border-[#e0e0e0] flex flex-col">
      {/* Server Header */}
      <div className="px-5 py-4 border-b border-[#e0e0e0]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-[#242424] truncate">{serverDisplayName}</h2>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('channels')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors text-center ${
              activeTab === 'channels'
                ? 'border-[#6264a7] text-[#6264a7]'
                : 'border-transparent text-[#616161] hover:text-[#242424]'
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative text-center ${
              activeTab === 'discussions'
                ? 'border-[#6264a7] text-[#6264a7]'
                : 'border-transparent text-[#616161] hover:text-[#242424]'
            }`}
          >
            Discussions
            {discussionCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#059669] text-white text-[10px] rounded-full flex items-center justify-center">
                {discussionCount > 9 ? '9+' : discussionCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative text-center ${
              activeTab === 'questions'
                ? 'border-[#6264a7] text-[#6264a7]'
                : 'border-transparent text-[#616161] hover:text-[#242424]'
            }`}
          >
            Questions
            {questionCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#ea580c] text-white text-[10px] rounded-full flex items-center justify-center">
                {questionCount > 9 ? '9+' : questionCount}
              </span>
            )}
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" />
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
                            void handleCreateChannel(category);
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
                          onClick={() => {
                            void handleCreateChannel(category);
                          }}
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

        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <UnansweredQuestions
          channelIds={channelIds}
          onCountChange={(count) => setQuestionCount(count)}
        />
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <OngoingDiscussions
          channelIds={channelIds}
          onActiveCountChange={(count) => setDiscussionCount(count)}
        />
      )}

    </div>
  );
}