import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { ServerSidebar } from '../components/ServerSidebar';
import { ChannelList } from '../components/ChannelList';
import { MessageArea } from '../components/MessageArea';
import { MemberList } from '../components/MemberList';
import { getChannelMessages, getGroups, getMembers, postChannelMessage } from '../services/api';
import { CreateMessageInput, Member, Message, Server } from '../types/chat';

export function GroupChat() {
  const { groupId, channelId } = useParams();
  const [isParticipantsVisible, setIsParticipantsVisible] = useState(true);
  const [groups, setGroups] = useState<Server[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadMessages = async (targetChannelId: string) => {
    const loadedMessages = await getChannelMessages(targetChannelId);
    setChannelMessages(loadedMessages);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedGroups, loadedMembers] = await Promise.all([
          getGroups(),
          getMembers(),
        ]);

        setGroups(loadedGroups);
        setMembers(loadedMembers);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!channelId) {
        setChannelMessages([]);
        return;
      }

      await reloadMessages(channelId);
    };

    void loadMessages();
  }, [channelId]);

  const handleSendMessage = async (targetChannelId: string, payload: CreateMessageInput) => {
    return postChannelMessage(targetChannelId, payload);
  };

  const handleChannelCreated = (targetGroupId: string, createdChannel: Server['channels'][number]) => {
    setGroups((current) => current.map((entry) => {
      if (entry.id !== targetGroupId) {
        return entry;
      }

      if (entry.channels.some((channel) => channel.id === createdChannel.id)) {
        return entry;
      }

      return {
        ...entry,
        channels: [...entry.channels, createdChannel],
      };
    }));
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-sm text-[#616161]">Loading group chat...</div>;
  }

  const group = groups.find((s) => s.id === groupId);

  if (!group) {
    return <Navigate to="/groups" replace />;
  }

  let channel = group.channels.find((c) => c.id === channelId);

  if (!channelId || !channel) {
    const firstText = group.channels.find((c) => c.type === 'text');
    if (firstText) {
      return <Navigate to={`/group/${groupId}/channel/${firstText.id}`} replace />;
    }
  }

  return (
    <div className="h-screen flex bg-white">
      <ServerSidebar />
      <ChannelList server={group} onChannelCreated={handleChannelCreated} />
      {channel && (
        <>
          <MessageArea
            channel={channel}
            messages={channelMessages}
            members={members}
            isParticipantsVisible={isParticipantsVisible}
            onToggleParticipants={() =>
              setIsParticipantsVisible((current) => !current)
            }
            onSendMessage={handleSendMessage}
          />
          {isParticipantsVisible && <MemberList members={members} />}
        </>
      )}
    </div>
  );
}
