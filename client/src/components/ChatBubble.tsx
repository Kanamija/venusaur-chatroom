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
    <div
      className={`p-3 rounded-xl border border-black/20 shadow-sm max-w-lg text-black ${accentColorClass}`}
    >
      <div className="flex justify-between items-center mb-1 text-xs font-bold text-black/80 font-mono">
        <span>{message.username}</span>
        <span className="text-black/60">{formattedTime}</span>
      </div>
      <p className="text-sm font-semibold font-mono break-words text-black leading-relaxed">
        {message.text}
      </p>
    </div>
  );
};
