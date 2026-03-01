import { useState } from 'react';
import { MessageSquare, Loader2, AlertCircle, Archive, CheckCircle2, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Discussion {
  id: string;
  topic: string;
  status: 'active' | 'detected' | 'resolved' | 'archived';
  participants: string[];
  lastActivity: Date;
  channelName: string;
  messageCount: number;
}

type ViewState = 'loading' | 'error' | 'empty' | 'success';
type DiscussionFilter = 'all' | 'active' | 'past';
const RESOLVED_RETENTION_DAYS = 7;

export function OngoingDiscussions() {
  const [viewState, setViewState] = useState<ViewState>('success');
  const [activeFilter, setActiveFilter] = useState<DiscussionFilter>('all');
  
  const [discussions, setDiscussions] = useState<Discussion[]>([
    {
      id: 'd1',
      topic: 'Q1 Product Roadmap Planning',
      status: 'active',
      participants: ['Alex', 'Jordan', 'Sam'],
      lastActivity: new Date(2026, 1, 18, 11, 45),
      channelName: 'general',
      messageCount: 24,
    },
    {
      id: 'd2',
      topic: 'New design system implementation',
      status: 'detected',
      participants: ['Morgan', 'Casey'],
      lastActivity: new Date(2026, 1, 18, 10, 30),
      channelName: 'design-chat',
      messageCount: 8,
    },
    {
      id: 'd3',
      topic: 'API performance optimization',
      status: 'active',
      participants: ['Taylor', 'Alex', 'Jordan'],
      lastActivity: new Date(2026, 1, 18, 9, 15),
      channelName: 'game-chat',
      messageCount: 15,
    },
    {
      id: 'd4',
      topic: 'Deployment process documentation',
      status: 'resolved',
      participants: ['Sam', 'Morgan'],
      lastActivity: new Date(2026, 1, 17, 16, 20),
      channelName: 'general',
      messageCount: 12,
    },
    {
      id: 'd5',
      topic: 'Team building event ideas',
      status: 'archived',
      participants: ['Casey', 'Taylor', 'Alex'],
      lastActivity: new Date(2026, 1, 15, 14, 0),
      channelName: 'random',
      messageCount: 31,
    },
  ]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusConfig = (status: Discussion['status']) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'text-[#059669]',
          bgColor: 'bg-[#d1fae5]',
          icon: TrendingUp,
        };
      case 'detected':
        return {
          label: 'Detected',
          color: 'text-[#6366f1]',
          bgColor: 'bg-[#e0e7ff]',
          icon: Sparkles,
        };
      case 'resolved':
        return {
          label: 'Resolved',
          color: 'text-[#0891b2]',
          bgColor: 'bg-[#cffafe]',
          icon: CheckCircle2,
        };
      case 'archived':
        return {
          label: 'Archived',
          color: 'text-[#6b7280]',
          bgColor: 'bg-[#f3f4f6]',
          icon: Archive,
        };
    }
  };

  const getDeletionDeadline = (discussion: Discussion) => {
    return new Date(
      discussion.lastActivity.getTime() +
      RESOLVED_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
  };

  const formatTimeUntilDeletion = (discussion: Discussion) => {
    const deadline = getDeletionDeadline(discussion).getTime();
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      return null;
    }

    const hoursRemaining = Math.floor(remaining / (60 * 60 * 1000));
    const daysRemaining = Math.floor(hoursRemaining / 24);
    const finalHours = hoursRemaining % 24;

    if (daysRemaining > 0) {
      return `Deletes in ${daysRemaining}d ${finalHours}h`;
    }

    return `Deletes in ${Math.max(finalHours, 1)}h`;
  };

  const handleArchiveDiscussion = (discussionId: string) => {
    setDiscussions((current) =>
      current.map((discussion) =>
        discussion.id === discussionId
          ? { ...discussion, status: 'archived' }
          : discussion,
      ),
    );
  };

  const getFilterLabel = (filter: DiscussionFilter) => {
    if (filter === 'all') return 'All';
    if (filter === 'active') return 'Active';
    return 'Past';
  };

  const activeCount = discussions.filter(
    (discussion) => discussion.status === 'active' || discussion.status === 'detected',
  ).length;

  const pastCount = discussions.filter(
    (discussion) => discussion.status === 'resolved' || discussion.status === 'archived',
  ).length;

  const filteredDiscussions = discussions.filter((discussion) => {
    if (activeFilter === 'all') {
      return true;
    }

    if (activeFilter === 'active') {
      return discussion.status === 'active' || discussion.status === 'detected';
    }

    return discussion.status === 'resolved' || discussion.status === 'archived';
  });

  // Loading State
  if (viewState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-[#6264a7] animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424] mb-1">
            Analyzing conversations...
          </h3>
          <p className="text-xs text-[#616161]">
            Detecting ongoing discussions
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (viewState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#dc2626]" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424] mb-1">
            Failed to load discussions
          </h3>
          <p className="text-xs text-[#616161] mb-4">
            Unable to retrieve discussion data
          </p>
          <button
            onClick={() => setViewState('success')}
            className="px-4 py-2 bg-[#6264a7] text-white text-sm rounded hover:bg-[#5b5fc7] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (viewState === 'empty') {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-[#616161]" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424] mb-1">
            No discussions found
          </h3>
          <p className="text-xs text-[#616161]">
            Start conversations in channels to see them here
          </p>
        </div>
      </div>
    );
  }

  // Success State with Discussions
  return (
    <div className="flex-1 flex flex-col">
      {/* Filter Dropdown */}
      <div className="px-4 py-3 border-b border-[#e0e0e0] bg-[#fafafa]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full px-3 py-2 text-sm rounded border border-[#e0e0e0] bg-white text-[#242424] flex items-center justify-between hover:bg-[#f5f5f5] transition-colors">
              <span>
                {getFilterLabel(activeFilter)}
                {activeFilter === 'all' && ` (${discussions.length})`}
                {activeFilter === 'active' && ` (${activeCount})`}
                {activeFilter === 'past' && ` (${pastCount})`}
              </span>
              <ChevronDown className="w-4 h-4 text-[#616161]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onSelect={() => setActiveFilter('all')}>
              All ({discussions.length})
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setActiveFilter('active')}>
              Active ({activeCount})
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setActiveFilter('past')}>
              Past ({pastCount})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Discussions List */}
      <div className="flex-1 overflow-y-auto">
        {filteredDiscussions.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center">
              <p className="text-sm text-[#616161]">No {getFilterLabel(activeFilter).toLowerCase()} discussions</p>
            </div>
          </div>
        ) : (
          filteredDiscussions.map((discussion) => {
            const statusConfig = getStatusConfig(discussion.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={discussion.id}
                className="px-4 py-4 border-b border-[#f0f0f0] hover:bg-[#f5f5f5] cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 ${statusConfig.bgColor} rounded-full flex items-center justify-center mt-0.5`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#242424] flex-1">
                        {discussion.topic}
                      </h4>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-[#616161] mb-3">
                      <span>
                        {discussion.messageCount} messages
                      </span>
                      <span>•</span>
                      <span>
                        {discussion.participants.length} participants
                      </span>
                      <span>•</span>
                      <span>
                        #{discussion.channelName}
                      </span>
                      <span>•</span>
                      <span>
                        {formatTimeAgo(discussion.lastActivity)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex -space-x-2">
                        {discussion.participants.slice(0, 3).map((participant, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full bg-[#6264a7] border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold"
                            title={participant}
                          >
                            {participant.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {discussion.participants.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-[#e0e0e0] border-2 border-white flex items-center justify-center text-[#616161] text-[10px] font-semibold">
                            +{discussion.participants.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-[#616161]">
                        {discussion.participants.slice(0, 2).join(', ')}
                        {discussion.participants.length > 2 && ` +${discussion.participants.length - 2} more`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1 text-xs bg-[#6264a7] text-white rounded hover:bg-[#5b5fc7] transition-colors">
                        View thread
                      </button>
                      {discussion.status === 'active' && (
                        <button className="px-3 py-1 text-xs bg-white border border-[#e0e0e0] text-[#424242] rounded hover:bg-[#f5f5f5] transition-colors">
                          Mark as resolved
                        </button>
                      )}
                      {discussion.status === 'detected' && (
                        <button className="px-3 py-1 text-xs bg-white border border-[#e0e0e0] text-[#424242] rounded hover:bg-[#f5f5f5] transition-colors">
                          Confirm as active
                        </button>
                      )}
                      {discussion.status === 'resolved' && (
                        <>
                          {formatTimeUntilDeletion(discussion) && (
                            <span className="px-3 py-1 text-xs bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] rounded">
                              {formatTimeUntilDeletion(discussion)}
                            </span>
                          )}
                          <button
                            onClick={() => handleArchiveDiscussion(discussion.id)}
                            className="px-3 py-1 text-xs bg-white border border-[#e0e0e0] text-[#424242] rounded hover:bg-[#f5f5f5] transition-colors"
                          >
                            Archive
                          </button>
                        </>
                      )}
                      {discussion.status === 'archived' && (
                        <span className="px-3 py-1 text-xs bg-[#f3f4f6] border border-[#e5e7eb] text-[#4b5563] rounded">
                          Archived • kept
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
