import { useState, useEffect } from 'react';
import { AuthView } from './components/AuthView';
import { RoomView } from './components/RoomView';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already logged in via localStorage
    const savedUser = localStorage.getItem('chat_username');
    if (savedUser) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('chat_username', username);
    if (!localStorage.getItem('chat_guest_id')) {
      localStorage.setItem('chat_guest_id', crypto.randomUUID());
    }
    setIsAuthenticated(true);
  };

  return (
    <main className="min-h-screen bg-black">
      {!isAuthenticated ? (
        <AuthView onLoginSuccess={handleLoginSuccess} />
      ) : (
        <RoomView />
      )}
    </main>
  );
}
