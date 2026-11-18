import React from 'react';
import type { RoomTheme } from '../types/theme.ts';

interface RoomHeaderProps {
  rooms: RoomTheme[];
  currentRoom: string;
  onSelectRoom: (roomName: string) => void;
  onLogout: () => void;
  lockedRooms?: string[]; // Premium rooms the user hasn't unlocked yet
}

export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="Locked"
  >
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  rooms,
  currentRoom,
  onSelectRoom,
  onLogout,
  lockedRooms = [],
}) => {
  return (
    <nav className="flex items-center justify-between gap-3 p-4 bg-black/60 border-b border-gray-800">
      <div className="flex gap-3 overflow-x-auto min-w-0">
        {rooms.map((room) => {
          const isActive = room.name === currentRoom;
          return (
            <button
              key={room.name}
              disabled={!room.isAvailable}
              onClick={() => room.isAvailable && onSelectRoom(room.name)}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-400'
                  : room.isAvailable
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-900/50 text-gray-600 cursor-not-allowed border border-gray-800'
              }`}
            >
              The {room.name} Room
              {lockedRooms.includes(room.name) && (
                <LockIcon className="ml-2 inline-block h-3.5 w-3.5 -mt-0.5 text-fuchsia-300" />
              )}
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
        className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-mono text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700"
      >
        Sign out
      </button>
    </nav>
  );
};
