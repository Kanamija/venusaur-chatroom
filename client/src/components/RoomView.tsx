import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../types/chat';
import type { RoomTheme } from '../types/theme';
import { getCurrentUser, setGuestUser } from '../utils/user';
import { ChatBubble } from './ChatBubble';
import { ChatRoomLayout } from './ChatRoomLayout';
import { RoomHeader } from './RoomHeader';

// Define the 3 rooms from your architectural plan
const ROOM_CONFIGS: RoomTheme[] = [
    {
        name: 'Venusaur',
        bgGradient: 'from-emerald-950 via-teal-950 to-black',
        accentColor:
        'border-emerald-500 text-emerald-100 bg-emerald-900/30 border-emerald-500/30',
        spriteUrl: '/sprites/venusaur.png',
        isAvailable: true,
    },
    {
        name: 'Charizard',
        bgGradient: 'from-amber-950 via-orange-950 to-black',
        accentColor:
        'border-amber-500 text-amber-100 bg-amber-900/30 border-amber-500/30',
        spriteUrl: '/sprites/charizard.png',
        isAvailable: false,
    },
    {
        name: 'Pikachu',
        bgGradient: 'from-purple-950 via-indigo-950 to-black',
        accentColor:
        'border-yellow-400 text-yellow-100 bg-yellow-900/30 border-yellow-400/30',
        spriteUrl: '/sprites/pikachu.png',
        isAvailable: false,
    },
    ];

    // Initialize socket connection
    const socket: Socket = io();

    export const RoomView: React.FC = () => {
    const [currentRoomName, setCurrentRoomName] = useState<string>('Venusaur');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [showUsernameModal, setShowUsernameModal] = useState<boolean>(false);
    const [promptUsername, setPromptUsername] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeTheme =
        ROOM_CONFIGS.find((r) => r.name === currentRoomName) || ROOM_CONFIGS[0];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle room switching & socket listeners
    useEffect(() => {
        socket.emit('join_room', { roomId: currentRoomName });

        // Mock history load until GET /rooms/:id/messages is ready
        const mockHistory: Message[] = [
        {
            roomId: currentRoomName,
            text: `Welcome to The ${currentRoomName} Room!`,
            username: 'Professor Oak',
            createdAt: new Date(Date.now() - 300000).toISOString(),
        },
        ];
        setMessages(mockHistory);

        const handleReceiveMessage = (msg: Message) => {
        if (msg.roomId === currentRoomName) {
            setMessages((prev) => [...prev, msg]);
        }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
        socket.off('receive_message', handleReceiveMessage);
        };
    }, [currentRoomName]);

    const handleSelectRoom = (roomName: string) => {
        setCurrentRoomName(roomName);
    };

    const handleSubmitMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const user = getCurrentUser();

        if (!user) {
        setShowUsernameModal(true);
        return;
        }

        dispatchSend(user.username, user.guestId);
    };

    const dispatchSend = (username: string, guestId: string) => {
        const payload = {
        roomId: currentRoomName,
        text: inputText,
        username,
        guestId,
        };

        socket.emit('send_message', payload);
        setInputText('');
    };

    const handleSaveUsername = (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptUsername.trim()) return;

        const newUser = setGuestUser(promptUsername.trim());
        setShowUsernameModal(false);
        dispatchSend(newUser.username, newUser.guestId);
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
            {messages.map((msg, index) => (
            <ChatBubble
                key={index}
                message={msg}
                accentColorClass={activeTheme.accentColor}
            />
            ))}
            <div ref={messagesEndRef} />
        </ChatRoomLayout>

        {showUsernameModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form
                onSubmit={handleSaveUsername}
                className="bg-gray-900 border-2 border-emerald-500 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
            >
                <h3 className="text-lg font-bold font-mono text-emerald-400">
                Enter a Trainer Name
                </h3>
                <p className="text-xs text-gray-300 font-mono">
                You need a username before broadcasting messages to the room. This
                will be saved for future visits.
                </p>
                <input
                type="text"
                required
                value={promptUsername}
                onChange={(e) => setPromptUsername(e.target.value)}
                placeholder="e.g. Misty, Red..."
                className="w-full bg-black border border-emerald-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                />
                <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-sm transition-colors font-mono"
                >
                Confirm & Send
                </button>
            </form>
            </div>
        )}
        </div>
    );
};
