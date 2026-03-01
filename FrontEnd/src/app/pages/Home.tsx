import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { ServerSidebar } from '../components/ServerSidebar';

export function Home() {
  const [selectedDm, setSelectedDm] = useState('Alex');
  const [message, setMessage] = useState('');

  const directMessages = [
    { id: 'dm1', name: 'Alex', status: 'Online' },
    { id: 'dm2', name: 'Jordan', status: 'Idle' },
    { id: 'dm3', name: 'Sam', status: 'Offline' },
  ];

  return (
    <div className="h-screen flex bg-white">
      <ServerSidebar />

      <div className="w-80 border-r border-[#e0e0e0] bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-[#e0e0e0]">
          <h2 className="text-xl font-semibold text-[#242424]">Direct Messages</h2>
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-[#949494] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#d1d1d1] rounded outline-none focus:border-[#6264a7]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {directMessages.map((dm) => (
            <button
              key={dm.id}
              type="button"
              onClick={() => setSelectedDm(dm.name)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#f5f5f5] ${
                selectedDm === dm.name ? 'bg-[#e8e8f8]' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#6264a7] text-white text-sm font-semibold flex items-center justify-center">
                {dm.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#242424] truncate">{dm.name}</p>
                <p className="text-xs text-[#616161]">{dm.status}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="h-14 px-6 border-b border-[#e0e0e0] flex items-center">
          <h3 className="text-lg font-semibold text-[#242424]">{selectedDm}</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-xl bg-[#f5f5f5] rounded-lg px-4 py-3 text-sm text-[#242424]">
            This is your direct message thread with {selectedDm}.
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-[#e0e0e0]">
          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden focus-within:border-[#6264a7] bg-white px-3 py-2 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Message ${selectedDm}`}
              className="flex-1 bg-transparent text-[#242424] placeholder-[#616161] outline-none text-sm"
            />
            <button
              type="button"
              disabled={!message.trim()}
              onClick={() => setMessage('')}
              className="p-1.5 hover:bg-[#f5f5f5] rounded text-[#6264a7] hover:text-[#5b5fc7] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
