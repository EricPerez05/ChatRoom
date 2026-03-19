import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { getGroups, getServers } from '../services/api';
import { Server } from '../types/chat';

export function Home() {
  const [servers, setServers] = useState<Server[]>([]);
  const [groups, setGroups] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedServers, loadedGroups] = await Promise.all([
          getServers(),
          getGroups(),
        ]);

        setServers(loadedServers);
        setGroups(loadedGroups);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-sm text-[#616161]">Loading chats...</div>;
  }

  const firstServer = servers[0];
  const firstServerTextChannel = firstServer?.channels.find((channel) => channel.type === 'text');

  if (firstServer && firstServerTextChannel) {
    return <Navigate to={`/server/${firstServer.id}/channel/${firstServerTextChannel.id}`} replace />;
  }

  const firstGroup = groups[0];
  const firstGroupTextChannel = firstGroup?.channels.find((channel) => channel.type === 'text');

  if (firstGroup && firstGroupTextChannel) {
    return <Navigate to={`/group/${firstGroup.id}/channel/${firstGroupTextChannel.id}`} replace />;
  }

  return <div className="h-screen flex items-center justify-center text-sm text-[#616161]">No chats available.</div>;
}
