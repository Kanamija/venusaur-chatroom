// import React from 'react';
// import type { RoomTheme } from '../types/theme';

// interface ChatRoomLayoutProps {
//     theme: RoomTheme;
//     children: React.ReactNode;
//     inputText: string;
//     onInputChange: (val: string) => void;
//     onSubmitMessage: (e: React.FormEvent) => void;
//     }

//     export const ChatRoomLayout: React.FC<ChatRoomLayoutProps> = ({
//     theme,
//     children,
//     inputText,
//     onInputChange,
//     onSubmitMessage,
//     }) => {
//     return (
//         <div
//         className={`flex flex-col h-screen bg-gradient-to-b ${theme.bgGradient} text-white`}
//         >
//         {/* Room Header with Character Sprite in Top-Right */}
//         <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-black/40 backdrop-blur-sm">
//             <h1 className="text-2xl font-bold font-mono tracking-wide">
//             The {theme.name} Room
//             </h1>

//             {/* Character Sprite as seen in the design sketch */}
//             <div className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 rounded-full border border-white/20 flex items-center justify-center p-1 shadow-lg">
//             <img
//                 src={theme.spriteUrl}
//                 alt={theme.name}
//                 className="w-full h-full object-contain pixelated"
//             />
//             </div>
//         </div>

//         {/* Messages Scroll Area */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
//             {children}
//         </div>

//         {/* Message Input Footer */}
//         <form
//             onSubmit={onSubmitMessage}
//             className="p-4 bg-black/80 border-t border-white/10 max-w-4xl w-full mx-auto flex gap-3"
//         >
//             <input
//             type="text"
//             value={inputText}
//             onChange={(e) => onInputChange(e.target.value)}
//             placeholder={`Message The ${theme.name} Room...`}
//             className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white font-mono"
//             />
//             <button
//             type="submit"
//             className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors font-mono shadow-md"
//             >
//             Send
//             </button>
//         </form>
//         </div>
//     );
// };

/*
===================================================================
ORIGINAL SOCKET / BACKEND CODE (COMMENTED OUT FOR UI TESTING)
===================================================================

... your original ChatRoomLayout code here ...

===================================================================
*/

// TEMPORARY LOCAL STATE IMPLEMENTATION FOR FRONTEND TESTING
import React, {
    type ReactNode,
    type Dispatch,
    type SetStateAction,
} from 'react';
import type { RoomTheme } from '../types/theme';

interface ChatRoomLayoutProps {
    theme: RoomTheme;
    inputText: string;
    onInputChange: Dispatch<SetStateAction<string>>;
    onSubmitMessage: (e: React.FormEvent<HTMLFormElement>) => void;
    children?: ReactNode;
}

export default function ChatRoomLayout({
    theme,
    inputText,
    onInputChange,
    onSubmitMessage,
    children,
}: ChatRoomLayoutProps) {
    return (
        <div
            className={`h-screen flex flex-col bg-gradient-to-b ${theme.bgGradient} text-white overflow-hidden`}
        >
            {/* Room Title Header */}
            <div className="px-8 pt-4 pb-2 max-w-6xl w-full mx-auto">
                <h1
                    className={`text-3xl font-black font-mono tracking-wider drop-shadow ${
                        theme.name === 'Charizard' ? 'text-amber-900' : 'text-white'
                    }`}
                >
                    The {theme.name} Room
                </h1>
            </div>

            {/* Middle Section: Chat Feed (Left) & Large Sprite (Right) */}
            <div className="flex-1 max-w-6xl w-full mx-auto px-8 py-2 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden items-center">
                
                {/* Left Column (Messages Feed) */}
                <div className="md:col-span-2 h-full flex flex-col overflow-y-auto pr-2 space-y-4">
                    {children}
                </div>

                {/* Right Column (Centered Character) */}
                {theme.spriteUrl && (
                    <div className="hidden md:flex items-center justify-center h-full relative">
                        <img
                            src={theme.spriteUrl}
                            alt={`${theme.name} Sprite`}
                            className="w-56 h-56 lg:w-64 lg:h-64 object-contain drop-shadow-2xl"
                            style={{
                                animation: 'gentleFloat 3.5s ease-in-out infinite',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Input Bar Form - Always Visible At Bottom */}
            <form
                onSubmit={onSubmitMessage}
                className="p-4 bg-black/80 backdrop-blur-md border-t border-gray-800 flex gap-4 max-w-6xl w-full mx-auto"
            >
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder={`Message The ${theme.name} Room...`}
                    className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                />
                <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono px-6 py-3 rounded-xl text-sm transition-colors"
                >
                    Send
                </button>
            </form>

            {/* Smooth Floating Keyframe Animation */}
            <style>{`
                @keyframes gentleFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
            `}</style>
        </div>
    );
}