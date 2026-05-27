// src/Login.jsx
import React, { useState } from 'react';
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
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
            <h2>Login to Vorynx</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Sign In with Email</button>
            </form>

            <hr />

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={handleGoogleLogin} style={{ backgroundColor: '#4285F4', color: 'white' }}>
                    Sign In with Google
                </button>
                <button onClick={handleGithubLogin} style={{ backgroundColor: '#333', color: 'white' }}>
                    Sign In with GitHub
                </button>
            </div>
        </div>
    );
}