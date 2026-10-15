import React from 'react';
import type { RoomTheme } from '../types/theme.ts';

interface RoomHeaderProps {
  rooms: RoomTheme[];
  currentRoom: string;
  onSelectRoom: (roomName: string) => void;
  onLogout: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  rooms,
  currentRoom,
  onSelectRoom,
  onLogout,
}) => {
  return (
    <nav className="flex items-center justify-between p-4 bg-black/60 border-b border-gray-800">
      <div className="flex gap-3">
        {rooms.map((room) => {
          const isActive = room.name === currentRoom;
          return (
            <button
              key={room.name}
              disabled={!room.isAvailable}
              onClick={() => room.isAvailable && onSelectRoom(room.name)}
              className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-400'
                  : room.isAvailable
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-900/50 text-gray-600 cursor-not-allowed border border-gray-800'
              }`}
            >
              The {room.name} Room
              {!room.isAvailable && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Coming Soon)
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={onLogout}
        className="px-4 py-2 rounded-lg font-mono text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700"
      >
        Sign out
      </button>
    </nav>
  );
};
