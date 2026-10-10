import { useState } from 'react';
import AuthPage from './pages/AuthPage';

function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  return (
    <main className="min-h-screen bg-black">
      {!user ? (
        <AuthPage onAuthSuccess={(userData) => setUser(userData)} />
      ) : (
        /* Temporary view simulating landing inside The Venusaur Room */
        <div className="min-h-screen bg-teal-500 flex flex-col items-center justify-center text-white p-6 space-y-4 font-mono">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-wider uppercase">
              The Venusaur Room
            </h1>
            <p className="text-sm bg-teal-600/60 px-4 py-2 rounded-full border border-teal-300/40">
              Authenticated as:{' '}
              <span className="font-bold underline">{user.email}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setUser(null)}
            className="mt-6 border border-white/50 px-4 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-teal-900 transition-colors"
          >
            Sign Out (Back to Entrance)
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
