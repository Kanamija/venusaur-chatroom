import React from 'react';
import type { RoomTheme } from '../types/theme';
import { PsychicScene } from './PsychicScene';

interface ChatRoomLayoutProps {
  theme: RoomTheme;
  inputText: string;
  onInputChange: (val: string) => void;
  onSubmitMessage: (e: React.FormEvent) => void;
  children: React.ReactNode;
  isLocked?: boolean; // Premium room the user hasn't unlocked
  lockedContent?: React.ReactNode; // Shown in the message area while locked
}

export const ChatRoomLayout: React.FC<ChatRoomLayoutProps> = ({
  theme,
  inputText,
  onInputChange,
  onSubmitMessage,
  children,
  isLocked = false,
  lockedContent,
}) => {
  return (
    <div
      className={`relative flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-6 overflow-hidden bg-gradient-to-br ${theme.bgGradient}`}
    >
      {/* Optional animated scene (premium rooms) */}
      {theme.effect === 'psychic' && theme.bgImageUrl && (
        <PsychicScene imageUrl={theme.bgImageUrl} />
      )}

      {/* Left Column: Title + Scrollable Message Feed */}
      <div className="relative z-10 flex flex-col h-full min-h-0 overflow-hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-wide font-mono drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          The {theme.name} Room
        </h1>

        {isLocked ? (
          <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
            {lockedContent}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">{children}</div>
        )}

        {/* Bottom Input Form */}
        <form onSubmit={onSubmitMessage} className="mt-4 flex gap-2 min-w-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            aria-label={`Message The ${theme.name} Room`} // Added accessible label
            placeholder={
              isLocked
                ? `Unlock The ${theme.name} Room to chat`
                : `Message The ${theme.name} Room...`
            }
            disabled={isLocked}
            className="flex-1 min-w-0 bg-black/40 border border-white/20 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-white font-mono text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLocked}
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-semibold px-4 sm:px-6 py-3 rounded-lg transition-colors font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-400"
          >
            Send
          </button>
        </form>
      </div>

      {/* Right Column: Large Floating Bouncing Sprite */}
      <div className="hidden md:flex items-center justify-center relative z-10">
        {theme.effect === 'psychic' ? (
          <img
            src={theme.spriteUrl}
            alt={theme.name}
            className="w-80 h-80 object-contain psy-float"
          />
        ) : (
          <img
            src={theme.spriteUrl}
            alt={theme.name}
            className="w-80 h-80 object-contain animate-bounce drop-shadow-2xl"
            style={{ animationDuration: '3s' }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatRoomLayout;
