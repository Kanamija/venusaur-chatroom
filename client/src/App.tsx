import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import { RoomView } from './components/RoomView';

function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);

  return (
    <main className="min-h-screen bg-black">
      {!user ? (
        <AuthPage onAuthSuccess={(userData) => setUser(userData)} />
      ) : (
        <RoomView user={user} />
      )}
    </main>
  );
}

export default App;
