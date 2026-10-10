import React, { useState } from 'react';

interface AuthPageProps {
    onAuthSuccess?: (user: { email: string }) => void;
    }

    export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate backend response delay while Eddie's PR is pending
        setTimeout(() => {
        setLoading(false);
        setIsTransitioning(true);

        // Give the smooth expansion effect time to complete before routing/notifying parent
        setTimeout(() => {
            if (onAuthSuccess) {
            onAuthSuccess({ email });
            } else {
            console.log('Auth success! Navigating to Venusaur Room...');
            }
        }, 1200);
        }, 1500);
    };

    return (
        <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
        {/* Smooth Expansion Light Flash Overlay */}
        {isTransitioning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 animate-pulse transition-opacity duration-1000 ease-in-out">
            <div className="text-center space-y-4">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white/20 animate-ping mx-auto"></div>
                <h2 className="text-2xl font-bold tracking-widest uppercase text-white font-mono drop-shadow-md">
                Entering The Venusaur Room...
                </h2>
            </div>
            </div>
        )}

        {/* Main VIP Entrance Card (Black & White Monochromatic) */}
        <div
            className={`w-full max-w-md border-2 border-white p-8 space-y-6 bg-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-700 ${isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        >
            {/* Mysterious Tagline Header */}
            <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-widest uppercase border-b border-white pb-3">
                {isLogin ? 'VIP Access' : 'Create Account'}
            </h1>
            <p className="text-gray-400 text-sm italic pt-1 font-mono">
                "create an account to enter..."
            </p>
            </div>

            {error && (
            <div className="border border-white bg-white text-black p-3 text-xs font-mono uppercase tracking-wider">
                Error: {error}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs uppercase tracking-widest mb-1 font-mono text-gray-300">
                Email
                </label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isTransitioning}
                className="w-full bg-black border border-white px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white font-mono placeholder-zinc-600"
                placeholder="user@vip.com"
                />
            </div>

            <div>
                <label className="block text-xs uppercase tracking-widest mb-1 font-mono text-gray-300">
                Password
                </label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isTransitioning}
                className="w-full bg-black border border-white px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white font-mono placeholder-zinc-600"
                placeholder="••••••••"
                />
            </div>

            {/* Interactive Pokéball Submit Button */}
            <div className="pt-2 flex flex-col items-center space-y-2">
                <button
                type="submit"
                disabled={loading || isTransitioning}
                className="group relative w-16 h-16 rounded-full border-2 border-white bg-black overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                title={
                    isLogin
                    ? 'Click Pokéball to Enter'
                    : 'Click Pokéball to Register'
                }
                >
                {/* Top Half (Monochromatic White) */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white border-b-2 border-black transition-colors group-hover:bg-zinc-200"></div>

                {/* Bottom Half (Monochromatic Black) */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-black"></div>

                {/* Center Ring & Button */}
                <div
                    className={`z-10 w-6 h-6 rounded-full border-2 border-black bg-white flex items-center justify-center transition-all ${loading ? 'animate-ping bg-cyan-300 shadow-[0_0_12px_#00f0ff]' : 'group-hover:border-cyan-400 group-hover:bg-cyan-100'}`}
                >
                    <div
                    className={`w-2 h-2 rounded-full ${loading ? 'bg-cyan-500' : 'bg-black'}`}
                    ></div>
                </div>
                </button>
                <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400">
                {loading
                    ? 'Authenticating...'
                    : isLogin
                    ? 'Click Pokéball to Enter'
                    : 'Click Pokéball to Register'}
                </span>
            </div>
            </form>

            {/* Toggle Login/Signup */}
            <div className="text-center pt-2 border-t border-zinc-800">
            <button
                type="button"
                disabled={loading || isTransitioning}
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-400 hover:text-white underline underline-offset-4 font-mono text-xs transition-colors"
            >
                {isLogin
                ? 'Need an account? Sign up'
                : 'Already have an account? Log in'}
            </button>
            </div>
        </div>
        </div>
    );
}
