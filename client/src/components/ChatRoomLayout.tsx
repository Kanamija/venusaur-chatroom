import React from 'react';
import type { RoomTheme } from '../types/theme';

interface ChatRoomLayoutProps {
    theme: RoomTheme;
    children: React.ReactNode;
    inputText: string;
    onInputChange: (val: string) => void;
    onSubmitMessage: (e: React.FormEvent) => void;
    }

    export const ChatRoomLayout: React.FC<ChatRoomLayoutProps> = ({
    theme,
    children,
    inputText,
    onInputChange,
    onSubmitMessage,
    }) => {
    return (
        <div
        className={`flex flex-col h-screen bg-gradient-to-b ${theme.bgGradient} text-white`}
        >
        {/* Room Header with Character Sprite in Top-Right */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-black/40 backdrop-blur-sm">
            <h1 className="text-2xl font-bold font-mono tracking-wide">
            The {theme.name} Room
            </h1>

            {/* Character Sprite as seen in the design sketch */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 rounded-full border border-white/20 flex items-center justify-center p-1 shadow-lg">
            <img
                src={theme.spriteUrl}
                alt={theme.name}
                className="w-full h-full object-contain pixelated"
            />
            </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
            {children}
        </div>

        {/* Message Input Footer */}
        <form
            onSubmit={onSubmitMessage}
            className="p-4 bg-black/80 border-t border-white/10 max-w-4xl w-full mx-auto flex gap-3"
        >
            <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Message The ${theme.name} Room...`}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white font-mono"
            />
            <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors font-mono shadow-md"
            >
            Send
            </button>
        </form>
        </div>
    );
};
