import { Link, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { getGroups, getServers } from '../services/api';
import { Server } from '../types/chat';

export function ServerSidebar() {
  const { serverId, groupId } = useParams();
  const [servers, setServers] = useState<Server[]>([]);
  const [groups, setGroups] = useState<Server[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedServers, loadedGroups] = await Promise.all([
          getServers(),
          getGroups(),
        ]);
        setServers(loadedServers);
        setGroups(loadedGroups);
      } catch {
        // Keep previous lists so navigation does not disappear after transient API errors.
      }
    };

    void load();
  }, []);

  return (
    <div className="w-16 bg-[#f5f5f5] border-r border-[#e0e0e0] flex flex-col items-center py-2 gap-1">
      {/* App Icon */}
      <div className="w-12 h-12 flex items-center justify-center mb-2">
        <div className="w-10 h-10 bg-[#6264a7] rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">T</span>
        </div>
      </div>

      {/* Servers */}
      <div className="flex flex-col gap-1 py-2">
        {servers.map((server) => (
          <div key={server.id} className="relative group">
            <Link to={`/server/${server.id}`}>
              <div className={`w-12 h-12 flex items-center justify-center rounded hover:bg-[#e5e5e5] cursor-pointer ${serverId === server.id ? 'bg-[#e5e5e5]' : ''}`}>
                <span className="text-lg">{server.icon || '📁'}</span>
                <div className="absolute left-0 w-0.5 h-8 bg-[#6264a7] rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Group chats (same rail; separate links so servers ↔ groups stay reachable) */}
      {groups.length > 0 && (
        <div className="flex flex-col gap-1 py-2 border-t border-[#e0e0e0] mt-1">
          {groups.map((group) => (
            <div key={group.id} className="relative group">
              <Link to={`/group/${group.id}`}>
                <div className={`w-12 h-12 flex items-center justify-center rounded hover:bg-[#e5e5e5] cursor-pointer ${groupId === group.id ? 'bg-[#e5e5e5]' : ''}`}>
                  <span className="text-lg">{group.icon || '👥'}</span>
                  <div className="absolute left-0 w-0.5 h-8 bg-[#6264a7] rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Spacer for bottom area (settings, etc.) */}
      <div className="mt-auto w-full flex items-center justify-center py-2">
        {/* reserved */}
      </div>
    </div>
  );
}