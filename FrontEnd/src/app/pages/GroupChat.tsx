import { useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { ServerSidebar } from '../components/ServerSidebar';
import { ChannelList } from '../components/ChannelList';
import { MessageArea } from '../components/MessageArea';
import { MemberList } from '../components/MemberList';
import { groups, groupMessages, members } from '../data/mockData';

export function GroupChat() {
  const { groupId, channelId } = useParams();
  const [isParticipantsVisible, setIsParticipantsVisible] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);

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

  const channelMessages = groupMessages[channelId || ''] || [];

  return (
    <div className="h-screen flex bg-white">
      <ServerSidebar />
      <ChannelList
        server={group}
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
