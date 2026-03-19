import { Link, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { getServers } from '../services/api';
import { Server } from '../types/chat';

export function ServerSidebar() {
  const { serverId } = useParams();
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    const loadServers = async () => {
      const loadedServers = await getServers();
      setServers(loadedServers);
    };

    void loadServers();
  }, []);

  return (
    <div className="w-16 bg-[#f5f5f5] border-r border-[#e0e0e0] flex flex-col items-center py-2 gap-1">
      {/* App Icon */}
      <div className="w-12 h-12 flex items-center justify-center mb-2">
        <div className="w-10 h-10 bg-[#6264a7] rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">T</span>
        </div>
      </div>

      {/* Servers List */}
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

      {/* Spacer for bottom area (settings, etc.) */}
      <div className="mt-auto w-full flex items-center justify-center py-2">
        {/* reserved */}
      </div>
    </div>
  );
}