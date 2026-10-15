import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthPage from './pages/AuthPage';
import { RoomView } from './components/RoomView';

function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // On first load, ask the server if the session cookie is still valid.
  // If it is, restore the user so a page refresh doesn't log them out.
  useEffect(() => {
    // useEffect can't be async itself, so define an async function and call it.
    async function checkSession() {
      try {
        const res = await fetch('/api/users/me');
        if (!res.ok) return;

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();
  }, []);

  // Open a Socket.io connection while a user is logged in.
  useEffect(() => {
    if (!user) return;

    // The browser sends the session cookie, so the server knows who is connecting.
    const newSocket = io({ withCredentials: true });

    // Store the socket once the server accepts the connection.
    // Setting state in a callback (not directly in the effect) avoids an extra render.
    newSocket.on('connect', () => {
      setSocket(newSocket);
    });

    // On logout or user change, close the connection and clear the socket.
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user]);

  // Log out on the server, then return to the login page.
  async function handleLogout() {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setUser(null);
    }
  }

  if (!sessionChecked) {
    return <main className="min-h-screen bg-black" />;
  }

  return (
    <main className="min-h-screen bg-black">
      {!user ? (
        <AuthPage onAuthSuccess={(userData) => setUser(userData)} />
      ) : (
        <RoomView user={user} socket={socket} onLogout={handleLogout} />
      )}
    </main>
  );
}

export default App;
