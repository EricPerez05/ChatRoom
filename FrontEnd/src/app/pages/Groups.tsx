import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getGroups } from '../services/api';
import { Server } from '../types/chat';

export function Groups() {
  const [groups, setGroups] = useState<Server[]>([]);

  useEffect(() => {
    const loadGroups = async () => {
      const loadedGroups = await getGroups();
      setGroups(loadedGroups);
    };

    void loadGroups();
  }, []);

  return (
    <div className="h-screen flex items-start p-6 bg-white">
      <div className="max-w-3xl w-full">
        <h1 className="text-2xl font-semibold mb-4">Group Chats</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Link key={g.id} to={`/group/${g.id}`}>
              <div className="border rounded p-4 hover:shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{g.icon}</div>
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-sm text-gray-500">{g.channels.length} channels</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
