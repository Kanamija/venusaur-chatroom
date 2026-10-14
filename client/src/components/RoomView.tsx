import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import type { RoomTheme } from '../types/theme';
import { ChatBubble } from './ChatBubble';
import { ChatRoomLayout } from './ChatRoomLayout';
import { RoomHeader } from './RoomHeader';

// Complementary bubble color options per room theme
const COMPLEMENTARY_BUBBLE_STYLES: Record<
  string,
  { primary: string; secondary: string }
> = {
  Venusaur: {
    primary: 'bg-rose-300 border-rose-400',
    secondary: 'bg-emerald-200 border-emerald-300',
  },
  Charizard: {
    primary: 'bg-sky-200 border-sky-300',
    secondary: 'bg-amber-100 border-amber-200',
  },
  Pikachu: {
    primary: 'bg-yellow-300 border-yellow-400',
    secondary: 'bg-purple-200 border-purple-300',
  },
};

// Define all 3 rooms with their complementary accent bases
const ROOM_CONFIGS: RoomTheme[] = [
  {
    name: 'Venusaur',
    bgGradient: 'from-teal-600 via-emerald-600 to-teal-900',
    accentColor: 'bg-rose-300 border-rose-400',
    spriteUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
    isAvailable: true,
  },
  {
    name: 'Charizard',
    bgGradient: 'from-amber-200 via-orange-300 to-amber-500',
    accentColor: 'bg-sky-200 border-sky-300',
    spriteUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    isAvailable: true,
  },
  {
    name: 'Pikachu',
    bgGradient: 'from-purple-900 via-indigo-950 to-slate-950',
    accentColor: 'bg-yellow-300 border-yellow-400',
    spriteUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    isAvailable: true,
  },
];

interface RoomViewProps {
  user?: { username: string } | null;
  socket?: any;
}

export const RoomView: React.FC<RoomViewProps> = ({ user, socket }) => {
  const [currentRoomName, setCurrentRoomName] = useState<string>('Venusaur');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTheme =
    ROOM_CONFIGS.find((r) => r.name === currentRoomName) || ROOM_CONFIGS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle room joining and socket message subscriptions
  useEffect(() => {
    if (!socket) return;

    // Clear feed when switching room views
    setMessages([]);

    // 1. Send plain room string per Kanami's backend spec ('Venusaur', 'Charizard', 'Pikachu')
    socket.emit('join_room', currentRoomName);

    // 2. Subscribe to incoming messages
    const handleReceiveMessage = (newMessage: Message) => {
      if (newMessage.roomId === currentRoomName) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [currentRoomName, socket]);

  const handleSelectRoom = (roomName: string) => {
    setCurrentRoomName(roomName);
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentUsername = user?.username || 'Trainer';

    if (socket) {
      // Emit live message object to socket server
      socket.emit('send_message', {
        roomId: currentRoomName,
        text: inputText,
      });
    } else {
      // Local optimistic fallback if socket isn't connected yet
      const newMessage: Message = {
        roomId: currentRoomName,
        text: inputText,
        username: currentUsername,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
    }

    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <RoomHeader
        rooms={ROOM_CONFIGS}
        currentRoom={currentRoomName}
        onSelectRoom={handleSelectRoom}
      />

      <ChatRoomLayout
        theme={activeTheme}
        inputText={inputText}
        onInputChange={setInputText}
        onSubmitMessage={handleSubmitMessage}
      >
        {messages.map((msg, index) => {
          const roomStyles =
            COMPLEMENTARY_BUBBLE_STYLES[currentRoomName] ||
            COMPLEMENTARY_BUBBLE_STYLES.Venusaur;

          const dynamicBubbleColor =
            index % 2 === 0 ? roomStyles.primary : roomStyles.secondary;

          return (
            <ChatBubble
              key={msg.createdAt || index}
              message={msg}
              accentColorClass={dynamicBubbleColor}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </ChatRoomLayout>
    </div>
  );
};

export default RoomView;
