import { Member } from '../types/chat';
import { MoreHorizontal } from 'lucide-react';

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  const onlineMembers = members.filter((m) => m.status === 'online');
  const idleMembers = members.filter((m) => m.status === 'idle');
  const offlineMembers = members.filter((m) => m.status === 'offline');

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'online':
        return 'bg-[#92c353]';
      case 'idle':
        return 'bg-[#ffaa44]';
      case 'offline':
        return 'bg-[#bebebe]';
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const renderMembers = (membersList: Member[], label: string) => {
    if (membersList.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-4 mb-2 text-xs font-semibold text-[#616161] uppercase">
          {label} ({membersList.length})
        </div>
        {membersList.map((member) => (
          <div
            key={member.id}
            className="px-3 py-2 mx-2 rounded flex items-center justify-between hover:bg-[#f5f5f5] cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#6264a7] flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(member.name)}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(
                    member.status
                  )} rounded-full border-2 border-white`}
                ></div>
              </div>
              <span className="text-sm text-[#424242]">
                {member.name}
              </span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[#616161] opacity-0 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-64 bg-[#fafafa] border-l border-[#e0e0e0] overflow-y-auto">
      <div className="h-14 px-4 flex items-center border-b border-[#e0e0e0]">
        <span className="font-semibold text-[#242424]">Participants</span>
      </div>
      <div className="py-4">
        {renderMembers(onlineMembers, 'Online')}
        {renderMembers(idleMembers, 'Away')}
        {renderMembers(offlineMembers, 'Offline')}
      </div>
    </div>
  );
}