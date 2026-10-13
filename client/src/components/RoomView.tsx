import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import type { RoomTheme } from '../types/theme';
import { ChatBubble } from './ChatBubble';
import ChatRoomLayout from './ChatRoomLayout';
import { RoomHeader } from './RoomHeader';

// Complementary bubble color options per room theme
const COMPLEMENTARY_BUBBLE_STYLES: Record<
    string,
    { primary: string; secondary: string }
    > = {
    Venusaur: {
        primary: 'bg-rose-300 border-rose-400', // Primary Coral/Rose
        secondary: 'bg-emerald-200 border-emerald-300', // Alternate Soft Mint
    },
    Charizard: {
        primary: 'bg-sky-200 border-sky-300', // Primary Sky/Cyan
        secondary: 'bg-amber-100 border-amber-200', // Alternate Warm Cream
    },
    Pikachu: {
        primary: 'bg-yellow-300 border-yellow-400', // Primary Electric Gold
        secondary: 'bg-purple-200 border-purple-300', // Alternate Soft Lavender
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

    // Pre-seeded mock messages for each room
    const MOCK_MESSAGES: Record<string, Message[]> = {
    Venusaur: [
        {
        roomId: 'Venusaur',
        text: 'Welcome to The Venusaur Room!',
        username: 'Professor Oak',
        createdAt: new Date().toISOString(),
        },
        {
        roomId: 'Venusaur',
        text: 'Checking out the grass-type layout.',
        username: 'TestTrainer',
        createdAt: new Date().toISOString(),
        },
    ],
    Charizard: [
        {
        roomId: 'Charizard',
        text: 'Welcome to The Charizard Room!',
        username: 'Professor Oak',
        createdAt: new Date().toISOString(),
        },
        {
        roomId: 'Charizard',
        text: 'Flame columns look incredible here.',
        username: 'Red',
        createdAt: new Date().toISOString(),
        },
    ],
    Pikachu: [
        {
        roomId: 'Pikachu',
        text: 'Welcome to The Pikachu Room!',
        username: 'Professor Oak',
        createdAt: new Date().toISOString(),
        },
        {
        roomId: 'Pikachu',
        text: 'Electric yellow vibes are set up.',
        username: 'Ash',
        createdAt: new Date().toISOString(),
        },
    ],
    };

    export const RoomView: React.FC = () => {
    const [currentRoomName, setCurrentRoomName] = useState<string>('Venusaur');
    const [messages, setMessages] = useState<Message[]>(
        MOCK_MESSAGES['Venusaur'],
    );
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

    // Switch mock messages instantly when you click a room tab
    useEffect(() => {
        setMessages(MOCK_MESSAGES[currentRoomName] || []);
    }, [currentRoomName]);

    const handleSelectRoom = (roomName: string) => {
        setCurrentRoomName(roomName);
    };

    const handleSubmitMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessage: Message = {
        roomId: currentRoomName,
        text: inputText,
        username: 'TestTrainer',
        createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
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
            // Dynamic complementary color selection based on message index or sender
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
