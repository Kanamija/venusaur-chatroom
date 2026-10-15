import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthPage from './pages/AuthPage';
import { RoomView } from './components/RoomView';

function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user) {
      // Initialize socket connection upon successful authentication
      // const newSocket = io();
      const newSocket = io({
        withCredentials: true,
      });
      
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-black">
      {!user ? (
        <AuthPage onAuthSuccess={(userData) => setUser(userData)} />
      ) : (
        <RoomView user={user} socket={socket} />
      )}
    </main>
  );
}

export default App;
