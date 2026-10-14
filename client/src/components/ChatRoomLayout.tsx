import React from 'react';
import type { RoomTheme } from '../types/theme';

interface ChatRoomLayoutProps {
  theme: RoomTheme;
  inputText: string;
  onInputChange: (val: string) => void;
  onSubmitMessage: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export const ChatRoomLayout: React.FC<ChatRoomLayoutProps> = ({
  theme,
  inputText,
  onInputChange,
  onSubmitMessage,
  children,
}) => {
  return (
    <div
      className={`flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-hidden bg-gradient-to-br ${theme.bgGradient}`}
    >
      {/* Left Column: Title + Scrollable Message Feed */}
      <div className="flex flex-col h-full overflow-hidden">
        <h1 className="text-3xl font-bold text-white mb-4 tracking-wide font-mono">
          The {theme.name} Room
        </h1>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">{children}</div>

        {/* Bottom Input Form */}
        <form onSubmit={onSubmitMessage} className="mt-4 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Message The ${theme.name} Room...`}
            className="flex-1 bg-black/40 border border-white/20 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-white font-mono text-sm"
          />
          <button
            type="submit"
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-semibold px-6 py-3 rounded-lg transition-colors font-mono text-sm"
          >
            Send
          </button>
        </form>
      </div>

      {/* Right Column: Large Floating Bouncing Sprite */}
      <div className="hidden md:flex items-center justify-center relative">
        <img
          src={theme.spriteUrl}
          alt={theme.name}
          className="w-80 h-80 object-contain animate-bounce drop-shadow-2xl"
          style={{ animationDuration: '3s' }}
        />
      </div>
    </div>
  );
};

export default ChatRoomLayout;
