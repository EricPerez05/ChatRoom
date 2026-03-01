import { useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { ServerSidebar } from '../components/ServerSidebar';
import { ChannelList } from '../components/ChannelList';
import { MessageArea } from '../components/MessageArea';
import { MemberList } from '../components/MemberList';
import { servers, messages, members } from '../data/mockData';

export function Chat() {
  const { serverId, channelId } = useParams();
  const [isParticipantsVisible, setIsParticipantsVisible] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);

  // Find the server
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
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

  // Get messages for this channel
  const channelMessages = messages[channelId || ''] || [];

  return (
    <div className="h-screen flex bg-white">
      <ServerSidebar />
      <ChannelList
        server={server}
        callStatus={{
          isInCall,
          isVideoOn,
          currentUserName: 'You',
        }}
      />
      {channel && (
        <>
          <MessageArea
            channel={channel}
            messages={channelMessages}
            isParticipantsVisible={isParticipantsVisible}
            onToggleParticipants={() =>
              setIsParticipantsVisible((current) => !current)
            }
            isInCall={isInCall}
            isVideoOn={isVideoOn}
            onToggleCall={() => {
              setIsInCall((current) => {
                const next = !current;
                if (!next) {
                  setIsVideoOn(false);
                }
                return next;
              });
            }}
            onToggleVideo={() => {
              setIsVideoOn((current) => {
                const next = !current;
                if (next) {
                  setIsInCall(true);
                }
                return next;
              });
            }}
          />
          {isParticipantsVisible && <MemberList members={members} />}
        </>
      )}
    </div>
  );
}