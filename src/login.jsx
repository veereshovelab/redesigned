// src/Login.jsx
import { useState } from 'react';
import {
    auth,
    googleProvider,
    githubProvider,
    signInWithPopup,
    signInWithEmailAndPassword
} from './firebaseConfig';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // 1. Email/Password Sign In
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in user:", userCredential.user);
        } catch (err) {
            setError(err.message);
        }
    };

    // 2. Google Sign In
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Google User:", result.user);
        } catch (err) {
            setError(err.message);
        }
    };

    // 3. GitHub Sign In
    const handleGithubLogin = async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            console.log("GitHub User:", result.user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="page-view-enter" style={{ maxWidth: '420px', margin: '3rem auto', padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span className="auth-logo-v" style={{ display: 'inline-block', fontSize: '1.5rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', marginBottom: '0.5rem' }}>V</span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Login to Vorynx</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Access your crowdfunding dashboard & pledges</p>
            </div>

            {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label className="auth-input-label">Email Address</label>
                    <input
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="auth-input-label">Password</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                    Sign In with Email
                </button>
            </form>

            <div className="auth-divider">
                <span></span>
                <span>or continue with</span>
                <span></span>
            </div>

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button type="button" onClick={handleGoogleLogin} className="btn-secondary" style={{ width: '100%', gap: '0.6rem' }}>
                    <i className="fa-brands fa-google text-blue"></i> Sign In with Google
                </button>
                <button type="button" onClick={handleGithubLogin} className="btn-secondary" style={{ width: '100%', gap: '0.6rem' }}>
                    <i className="fa-brands fa-github"></i> Sign In with GitHub
                </button>
            </div>
        </div>
    );
}