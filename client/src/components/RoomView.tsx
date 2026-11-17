import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import type { RoomTheme } from '../types/theme';
import { ChatBubble } from './ChatBubble';
import { ChatRoomLayout } from './ChatRoomLayout';
import { RoomHeader } from './RoomHeader';
import { PremiumLockOverlay } from './PremiumLockOverlay';

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
  Mewtwo: {
    primary: 'bg-fuchsia-200 border-fuchsia-300',
    secondary: 'bg-violet-100 border-violet-200',
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
  {
    name: 'Mewtwo',
    bgGradient: 'from-violet-950 via-purple-900 to-slate-950',
    accentColor: 'bg-fuchsia-200 border-fuchsia-300',
    spriteUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    isAvailable: true,
    bgImageUrl: '/rooms/mewtwo-cave.jpg',
    effect: 'psychic',
    isPremium: true,
    premiumPriceLabel: 'CA$3',
  },
];

const PREMIUM_ROOM_NAMES = ROOM_CONFIGS.filter((r) => r.isPremium).map(
  (r) => r.name,
);

type Notice = {
  kind: 'success' | 'info' | 'error';
  text: string;
  sticky?: boolean;
} | null;

// Ask the server whether the logged-in user has unlocked a premium room.
async function fetchRoomAccess(roomName: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/rooms/${roomName}/access`, {
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.hasAccess === true;
  } catch {
    return false;
  }
}

// Read ?checkout=success|cancelled&room=... once, when returning from Stripe.
function readCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  return { status: params.get('checkout'), room: params.get('room') };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Premium access per room: true = unlocked, false = locked, missing = still checking.
  const [premiumAccess, setPremiumAccess] = useState<Record<string, boolean>>(
    {},
  );
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  // Captured once on first render so React StrictMode's double effects don't lose it.
  const [checkoutReturn] = useState(readCheckoutReturn);

  const activeTheme =
    ROOM_CONFIGS.find((r) => r.name === currentRoomName) || ROOM_CONFIGS[0];
  const accessKnown = activeTheme.name in premiumAccess;
  const isLocked =
    !!activeTheme.isPremium && premiumAccess[activeTheme.name] !== true;
  const lockedRooms = PREMIUM_ROOM_NAMES.filter(
    (name) => premiumAccess[name] === false,
  );

  // Check premium access on load, and handle the return trip from Stripe Checkout.
  useEffect(() => {
    let cancelled = false;
    const { status, room } = checkoutReturn;
    if (status) window.history.replaceState(null, '', window.location.pathname);

    async function loadAccess() {
      const results = await Promise.all(
        PREMIUM_ROOM_NAMES.map(
          async (name) => [name, await fetchRoomAccess(name)] as const,
        ),
      );
      if (cancelled) return;
      setPremiumAccess(Object.fromEntries(results));

      if (status === 'cancelled') {
        setNotice({ kind: 'info', text: 'Checkout cancelled. You were not charged.' });
        return;
      }
      if (status !== 'success' || !room || !PREMIUM_ROOM_NAMES.includes(room)) {
        return;
      }

      // Stripe's webhook can land a moment after the redirect, so poll briefly.
      setCurrentRoomName(room);
      setNotice({ kind: 'info', text: 'Payment received. Unlocking…', sticky: true });
      for (let attempt = 0; attempt < 8; attempt++) {
        if (await fetchRoomAccess(room)) {
          if (cancelled) return;
          setPremiumAccess((prev) => ({ ...prev, [room]: true }));
          setNotice({ kind: 'success', text: `The ${room} Room is unlocked ✨` });
          return;
        }
        await wait(1500);
        if (cancelled) return;
      }
      setNotice({
        kind: 'error',
        text: 'Payment received, but the unlock is still processing. Refresh in a moment.',
        sticky: true,
      });
    }

    loadAccess();
    return () => {
      cancelled = true;
    };
  }, [checkoutReturn]);

  // Auto-dismiss non-sticky notices.
  useEffect(() => {
    if (!notice || notice.sticky) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // If the user comes back from Stripe with the browser's Back button, re-enable Unlock.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsRedirecting(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

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
    if (isLocked) return; // Premium room not unlocked yet: nothing to load

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
  }, [currentRoomName, isLocked]);

  // 2. Handle room joining and live socket message updates / deletion
  useEffect(() => {
    if (!socket) return;

    // The server refuses premium rooms until they're unlocked, so don't ask yet.
    if (!isLocked) socket.emit('join_room', currentRoomName);

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
  }, [currentRoomName, socket, isLocked]);

  const handleSelectRoom = (roomName: string) => {
    setCurrentRoomName(roomName);
    setUnlockError(null);
  };

  // Start Stripe Checkout for the current premium room.
  const handleUnlock = async () => {
    setUnlockError(null);
    setIsRedirecting(true);
    try {
      const res = await fetch(`/api/rooms/${currentRoomName}/checkout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Already unlocked (e.g. paid in another tab).
      if (res.status === 409) {
        setPremiumAccess((prev) => ({ ...prev, [currentRoomName]: true }));
        setIsRedirecting(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.message || `Checkout failed (${res.status})`);
      }
      window.location.assign(data.url);
    } catch (err) {
      console.error('Error starting checkout:', err);
      setUnlockError('Could not open checkout. Please try again.');
      setIsRedirecting(false);
    }
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!socket) return;
    if (isLocked) return;

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
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to delete message from server');
      }

      // Optimistically remove from local state
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      // ❌ REMOVE: socket.emit('delete_message', ...) is no longer needed here!
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen h-dvh bg-black">
      <RoomHeader
        rooms={ROOM_CONFIGS}
        currentRoom={currentRoomName}
        onSelectRoom={handleSelectRoom}
        onLogout={onLogout}
        lockedRooms={lockedRooms}
      />

      {notice && (
        <div
          role="status"
          className={`fixed top-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 font-mono text-sm shadow-lg backdrop-blur-md ${
            notice.kind === 'success'
              ? 'border-fuchsia-300/50 bg-fuchsia-950/80 text-fuchsia-100'
              : notice.kind === 'error'
                ? 'border-rose-300/50 bg-rose-950/80 text-rose-100'
                : 'border-white/20 bg-black/80 text-gray-100'
          }`}
        >
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <ChatRoomLayout
        theme={activeTheme}
        inputText={inputText}
        onInputChange={setInputText}
        onSubmitMessage={handleSubmitMessage}
        isLocked={isLocked}
        lockedContent={
          <PremiumLockOverlay
            roomName={activeTheme.name}
            priceLabel={activeTheme.premiumPriceLabel}
            isChecking={!accessKnown}
            isRedirecting={isRedirecting}
            error={unlockError}
            onUnlock={handleUnlock}
          />
        }
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
