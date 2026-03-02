import { Link, useNavigate, useParams } from 'react-router';
import { MessageSquare, Star, Plus } from 'lucide-react';
import { groups, groupMessages, servers, type Server } from '../data/mockData';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export function ServerSidebar() {
  const navigate = useNavigate();
  const { serverId } = useParams();
  const [starredServerIds, setStarredServerIds] = useState<Set<string>>(new Set());
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [groupError, setGroupError] = useState('');

  const sortedServers = [...servers].sort((first, second) => {
    const firstIsStarred = starredServerIds.has(first.id);
    const secondIsStarred = starredServerIds.has(second.id);

    if (firstIsStarred === secondIsStarred) {
      return 0;
    }

    return firstIsStarred ? -1 : 1;
  });

  const toggleServerStar = (serverIdToToggle: string) => {
    setStarredServerIds((current) => {
      const next = new Set(current);
      if (next.has(serverIdToToggle)) {
        next.delete(serverIdToToggle);
      } else {
        next.add(serverIdToToggle);
      }
      return next;
    });
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      setGroupError('Please enter a group name.');
      return;
    }

    const groupId = `g-${Date.now()}`;
    const defaultChannelId = `${groupId}-c1`;
    const createdGroup: Server = {
      id: groupId,
      name: trimmedName,
      icon: '👥',
      channels: [
        {
          id: defaultChannelId,
          name: 'general',
          type: 'text',
          category: 'TEXT CHANNELS',
        },
      ],
      currentCallMembers: [],
    };

    groups.push(createdGroup);
    groupMessages[defaultChannelId] = [];
    setNewGroupName('');
    setGroupError('');
    setCreateGroupOpen(false);
    navigate(`/group/${groupId}/channel/${defaultChannelId}`);
  };

  const handleJoinGroup = () => {
    const trimmedLink = groupLink.trim();
    if (!trimmedLink) {
      setGroupError('Please enter a group invite link.');
      return;
    }

    const match = trimmedLink.match(/\/group\/([^/]+)(?:\/channel\/([^/?#]+))?/i);
    if (!match) {
      setGroupError('Link must include /group/{groupId}.');
      return;
    }

    const [, groupIdFromLink, channelIdFromLink] = match;
    let existingGroup = groups.find((group) => group.id === groupIdFromLink);

    if (!existingGroup) {
      const defaultChannelId = `${groupIdFromLink}-c1`;
      existingGroup = {
        id: groupIdFromLink,
        name: `Joined ${groupIdFromLink}`,
        icon: '👥',
        channels: [
          {
            id: defaultChannelId,
            name: 'general',
            type: 'text',
            category: 'TEXT CHANNELS',
          },
        ],
        currentCallMembers: [],
      };
      groups.push(existingGroup);
      groupMessages[defaultChannelId] = groupMessages[defaultChannelId] || [];
    }

    const targetChannelId =
      channelIdFromLink || existingGroup.channels.find((channel) => channel.type === 'text')?.id;

    if (!targetChannelId) {
      setGroupError('No text channel found in that group.');
      return;
    }

    setGroupLink('');
    setGroupError('');
    setJoinGroupOpen(false);
    navigate(`/group/${existingGroup.id}/channel/${targetChannelId}`);
  };

  return (
    <div className="w-16 bg-[#f5f5f5] border-r border-[#e0e0e0] flex flex-col items-center py-2 gap-1">
      {/* App Icon */}
      <div className="w-12 h-12 flex items-center justify-center mb-2">
        <div className="w-10 h-10 bg-[#6264a7] rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">T</span>
        </div>
      </div>

      {/* Navigation Icons */}
      <Link to="/">
        <div className={`w-12 h-12 flex items-center justify-center rounded hover:bg-[#e5e5e5] cursor-pointer relative group`}>
          <MessageSquare className="w-5 h-5 text-[#424242]" />
          <div className="absolute left-0 w-0.5 h-8 bg-[#6264a7] rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </Link>

      {/* Servers List */}
      <div className="flex flex-col gap-1 py-2">
        {sortedServers.map((server) => (
          <div key={server.id} className="relative group">
            <Link to={`/server/${server.id}`}>
              <div className={`w-12 h-12 flex items-center justify-center rounded hover:bg-[#e5e5e5] cursor-pointer ${serverId === server.id ? 'bg-[#e5e5e5]' : ''}`}>
                <span className="text-lg">{server.icon || '📁'}</span>
                <div className="absolute left-0 w-0.5 h-8 bg-[#6264a7] rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => toggleServerStar(server.id)}
              className={`absolute -top-1 -right-1 p-1 bg-white rounded-full border border-[#e0e0e0] transition-opacity ${
                starredServerIds.has(server.id)
                  ? 'opacity-100 hover:bg-[#fff7ed]'
                  : 'opacity-0 group-hover:opacity-100 hover:bg-[#f5f5f5]'
              }`}
            >
              <Star
                className={`w-3 h-3 ${
                  starredServerIds.has(server.id)
                    ? 'text-[#d97706] fill-[#d97706]'
                    : 'text-[#616161]'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center rounded hover:bg-[#e5e5e5] cursor-pointer relative group"
            aria-label="Create or join group"
          >
            <Plus className="w-5 h-5 text-[#424242]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-44">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setGroupError('');
              setCreateGroupOpen(true);
            }}
          >
            Create group
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setGroupError('');
              setJoinGroupOpen(true);
            }}
          >
            Join group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Enter a name for your new group.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            type="text"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCreateGroup();
              }
            }}
            placeholder="Group name"
            className="w-full px-3 py-2 text-sm border border-[#d1d1d1] rounded outline-none focus:border-[#6264a7]"
          />
          {groupError && <p className="text-xs text-[#dc2626]">{groupError}</p>}
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setCreateGroupOpen(false);
                setGroupError('');
                setNewGroupName('');
              }}
              className="px-3 py-2 text-sm border border-[#e0e0e0] rounded hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              className="px-3 py-2 text-sm text-white bg-[#6264a7] rounded hover:bg-[#5b5fc7]"
            >
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Group</DialogTitle>
            <DialogDescription>
              Paste a group invite link.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            type="text"
            value={groupLink}
            onChange={(event) => setGroupLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleJoinGroup();
              }
            }}
            placeholder="https://.../group/g1/channel/g1c1"
            className="w-full px-3 py-2 text-sm border border-[#d1d1d1] rounded outline-none focus:border-[#6264a7]"
          />
          {groupError && <p className="text-xs text-[#dc2626]">{groupError}</p>}
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setJoinGroupOpen(false);
                setGroupError('');
                setGroupLink('');
              }}
              className="px-3 py-2 text-sm border border-[#e0e0e0] rounded hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleJoinGroup}
              className="px-3 py-2 text-sm text-white bg-[#6264a7] rounded hover:bg-[#5b5fc7]"
            >
              Join
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spacer for bottom area (settings, etc.) */}
      <div className="mt-auto w-full flex items-center justify-center py-2">
        {/* reserved */}
      </div>
    </div>
  );
}