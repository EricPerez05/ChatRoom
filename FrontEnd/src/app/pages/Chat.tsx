import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { ServerSidebar } from '../components/ServerSidebar';
import { ChannelList } from '../components/ChannelList';
import { MessageArea } from '../components/MessageArea';
import { MemberList } from '../components/MemberList';
import { getChannelMessages, getMembers, getServers, postChannelMessage } from '../services/api';
import { CreateMessageInput, Member, Message, Server } from '../types/chat';

export function Chat() {
  const { serverId, channelId } = useParams();
  const [isParticipantsVisible, setIsParticipantsVisible] = useState(true);
  const [servers, setServers] = useState<Server[]>([]);
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
        const [loadedServers, loadedMembers] = await Promise.all([
          getServers(),
          getMembers(),
        ]);

        setServers(loadedServers);
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
    const created = await postChannelMessage(targetChannelId, payload);
    await reloadMessages(targetChannelId);
    return created;
  };

  const handleChannelCreated = (targetServerId: string, createdChannel: Server['channels'][number]) => {
    setServers((current) => current.map((entry) => {
      if (entry.id !== targetServerId) {
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
    return <div className="h-screen flex items-center justify-center text-sm text-[#616161]">Loading chat...</div>;
  }

  // Find the server
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    if (servers.length === 0) {
      return <div className="h-screen flex items-center justify-center text-sm text-[#616161]">No servers available.</div>;
    }

    // Redirect to first server if server not found
    return <Navigate to={`/server/${servers[0].id}`} replace />;
  }

  // Find the channel
  let channel = server.channels.find((c) => c.id === channelId);

  // If no channel specified, redirect to first text channel
  if (!channelId || !channel) {
    const firstTextChannel = server.channels.find((c) => c.type === 'text');
    if (firstTextChannel) {
      return (
        <Navigate
          to={`/server/${serverId}/channel/${firstTextChannel.id}`}
          replace
        />
      );
    }
  }

  return (
    <div className="h-screen flex bg-white">
      <ServerSidebar />
      <ChannelList server={server} onChannelCreated={handleChannelCreated} />
      {channel && (
        <>
          <MessageArea
            channel={channel}
            messages={channelMessages}
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