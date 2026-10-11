import React from 'react';
import type { Message } from '../types/chat';

interface ChatBubbleProps {
    message: Message;
    accentColorClass: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
    message,
    accentColorClass,
    }) => {
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`p-3 rounded-xl border max-w-lg ${accentColorClass}`}>
        <div className="flex justify-between items-center mb-1 text-xs opacity-75 font-mono">
            <span className="font-bold">{message.username}</span>
            <span>{formattedTime}</span>
        </div>
        <p className="text-sm font-mono break-words">{message.text}</p>
        </div>
    );
};
