import React, { useState } from 'react';

interface AuthViewProps {
    onLoginSuccess: (username: string) => void;
    }

    export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
        setError(
            "ERROR: FAILED TO EXECUTE 'JSON' ON 'RESPONSE': UNEXPECTED END OF JSON INPUT",
        );
        return;
        }

        const derivedUsername = email.split('@')[0];
        onLoginSuccess(derivedUsername);
    };

    return (
        <div
        style={{
            minHeight: '100vh',
            backgroundColor: 'black',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
        }}
        >
        <div
            style={{
            border: '2px solid white',
            padding: '40px',
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'black',
            boxSizing: 'border-box',
            }}
        >
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1
                style={{
                fontSize: '24px',
                fontWeight: 'bold',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                margin: '0 0 20px 0',
                }}
            >
                {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
            </h1>
            <div
                style={{
                borderBottom: '1px solid white',
                width: '100%',
                marginBottom: '20px',
                }}
            ></div>
            <p
                style={{
                fontSize: '14px',
                fontStyle: 'italic',
                color: '#ccc',
                margin: 0,
                }}
            >
                &quot;create an account to enter...&quot;
            </p>
            </div>

            {error && (
            <div
                style={{
                backgroundColor: 'white',
                color: 'black',
                padding: '15px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '25px',
                lineHeight: '1.4',
                }}
            >
                {error}
            </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
                <label
                style={{
                    display: 'block',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginBottom: '10px',
                }}
                >
                Email
                </label>
                <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tester@email.com"
                style={{
                    width: '100%',
                    backgroundColor: 'black',
                    border: '1px solid white',
                    padding: '12px',
                    fontSize: '14px',
                    color: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
                />
            </div>

            <div style={{ marginBottom: '30px' }}>
                <label
                style={{
                    display: 'block',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginBottom: '10px',
                }}
                >
                Password
                </label>
                <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                style={{
                    width: '100%',
                    backgroundColor: 'black',
                    border: '1px solid white',
                    padding: '12px',
                    fontSize: '14px',
                    color: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
                />
            </div>

            {/* Split-Color Pokéball Button */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <button
                type="submit"
                style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: '2px solid white',
                    backgroundColor: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(255,255,255,0.4)',
                    margin: '0 auto 12px auto',
                }}
                title="Click Pokéball to Register"
                >
                {/* Bottom half black */}
                <div
                    style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    backgroundColor: 'black',
                    }}
                ></div>
                {/* Center dividing line */}
                <div
                    style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'white',
                    transform: 'translateY(-50%)',
                    }}
                ></div>
                {/* Center button assembly */}
                <div
                    style={{
                    position: 'relative',
                    zIndex: 10,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid white',
                    backgroundColor: 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    }}
                >
                    <div
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                    }}
                    ></div>
                </div>
                </button>
                <p
                style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    color: 'white',
                    margin: 0,
                }}
                >
                Click Pokéball to {isLogin ? 'Log In' : 'Register'}
                </p>
            </div>
            </form>

            {/* Toggle link */}
            <div
            style={{
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.3)',
                paddingTop: '25px',
            }}
            >
            <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                textDecoration: 'underline',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                }}
            >
                {isLogin
                ? "Don't have an account? Create account"
                : 'Already have an account? Log in'}
            </button>
            </div>
        </div>
        </div>
    );
};
