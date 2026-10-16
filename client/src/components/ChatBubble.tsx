import React from 'react';
import type { Message } from '../types/chat';

interface ChatBubbleProps {
  message: Message;
  accentColorClass: string;
  currentUserUsername?: string;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  accentColorClass,
  currentUserUsername,
  onDeleteMessage,
}) => {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isOwnMessage =
    currentUserUsername && message.username === currentUserUsername;

  const handleDelete = () => {
    if (message._id && onDeleteMessage) {
      onDeleteMessage(message._id);
    }
  };

  return (
    <div
      className={`p-3 rounded-xl border border-black/20 shadow-sm max-w-lg text-black ${accentColorClass}`}
    >
      <div className="flex justify-between items-center mb-1 text-xs font-bold text-black/80 font-mono">
        <span>{message.username}</span>
        <div className="flex items-center gap-2">
          <span className="text-black/60">{formattedTime}</span>
          {isOwnMessage && message._id && (
            <button
              onClick={handleDelete}
              className="text-black/60 hover:text-red-600 transition-colors p-0.5 rounded focus:outline-none"
              title="Delete Message"
              type="button"
            >
              {/* Trash Can SVG Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="text-sm font-semibold font-mono break-words text-black leading-relaxed">
        {message.text}
      </p>
    </div>
  );
};
