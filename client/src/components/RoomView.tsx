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
  onLogout: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  user,
  socket,
  onLogout,
}) => {
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

  // 1. Clear state on room switch and fetch fresh history for the active room
  useEffect(() => {
    let ignore = false;
    setMessages([]); // Clear old room messages immediately so they don't bleed over

    fetch(`/api/rooms/${currentRoomName}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch room history');
        return res.json();
      })
      .then((data) => {
        if (ignore) return; // Ignore if user switched rooms while fetching

        const rawMessages = data.messages || data;
        if (Array.isArray(rawMessages)) {
          const recent50 = rawMessages.slice(-50);
          const formattedHistory: Message[] = recent50.map((msg: any) => ({
            _id: msg._id,
            roomId: msg.roomId || currentRoomName,
            text: msg.text || msg.content || '',
            username: msg.username || 'Trainer',
            createdAt: msg.createdAt || new Date().toISOString(),
          }));

          setMessages(formattedHistory);
        }
      })
      .catch((err) => {
        if (!ignore) console.error('Error fetching room history:', err);
      });

    return () => {
      ignore = true; // Cleanup flag when room changes
    };
  }, [currentRoomName]);

  // 2. Handle room joining and live socket message updates / deletion
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', currentRoomName);

    const handleReceiveMessage = (incomingData: any) => {
      if (incomingData.roomId === currentRoomName) {
        const mappedMessage: Message = {
          _id: incomingData._id,
          roomId: incomingData.roomId,
          text: incomingData.text || '',
          username: incomingData.username || 'Trainer',
          createdAt: incomingData.createdAt || new Date().toISOString(),
        };

        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (msg) =>
              (msg._id && msg._id === mappedMessage._id) ||
              (msg.createdAt === mappedMessage.createdAt &&
                msg.text === mappedMessage.text &&
                msg.username === mappedMessage.username),
          );

          if (exists) return prevMessages;
          return [...prevMessages, mappedMessage];
        });
      }
    };

    // Real-time deletion handler across socket connection
    const handleMessageDeleted = (deletedData: {
      messageId: string;
      roomId: string;
    }) => {
      if (deletedData.roomId === currentRoomName) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== deletedData.messageId),
        );
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [currentRoomName, socket]);

  const handleSelectRoom = (roomName: string) => {
    setCurrentRoomName(roomName);
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!socket) return;

    const currentUsername = user?.username || 'Trainer';

    socket.emit('send_message', {
      roomId: currentRoomName,
      text: inputText,
      username: currentUsername,
    });

    setInputText('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete message from server');
      }

      // Optimistically remove from local state
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      // Emit socket event so other clients in the room remove it immediately
      if (socket) {
        socket.emit('delete_message', {
          messageId,
          roomId: currentRoomName,
        });
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <RoomHeader
        rooms={ROOM_CONFIGS}
        currentRoom={currentRoomName}
        onSelectRoom={handleSelectRoom}
        onLogout={onLogout}
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
              key={msg._id || msg.createdAt || index}
              message={msg}
              accentColorClass={dynamicBubbleColor}
              currentUserUsername={user?.username}
              onDeleteMessage={handleDeleteMessage}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </ChatRoomLayout>
    </div>
  );
};

export default RoomView;
