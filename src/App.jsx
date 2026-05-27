import React, { useState, useEffect } from "react";
import './App.css';
import {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
  sendPasswordResetEmail
} from './firebaseConfig';

// ==========================================
// Friendly Error Message Helper
// ==========================================
const getFriendlyErrorMessage = (error) => {
  const code = error.code || error.message || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password. Please try again.";
  }
  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please sign in instead.";
  }
  if (code.includes("weak-password")) {
    return "Password should be at least 6 characters long.";
  }
  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("too-many-requests")) {
    return "This account has been temporarily disabled due to too many failed login attempts.";
  }
  return error.message ? error.message.replace("Firebase: ", "") : String(error);
};

// ==========================================
// 1. MAIN APP COMPONENT (Manages Auth State)
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState("");

  useEffect(() => {
    // Check if the link is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // If email not found in local storage, ask the user to input it
        email = window.prompt('Please provide your email for confirmation:');
      }
      if (email) {
        setLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            // Clean up the URL query parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setInitialError(getFriendlyErrorMessage(err));
            setLoading(false);
          });
      }
    }

    // Listens for login/logout state changes from Firebase
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', background: '#1c1c1e' }}>
        <h2>Loading Vorynx...</h2>
      </div>
    );
  }

  return (
    <div>
      {user ? <Dashboard user={user} setUser={setUser} /> : <AuthPanel initialError={initialError} />}
    </div>
  );
}

// ==========================================
// 2. DASHBOARD COMPONENT (Shown when logged in)
// ==========================================
function Dashboard({ user, setUser }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px', color: '#fff' }}>
      <h1>Welcome to Vorynx, {user.displayName || user.email}!</h1>
      <p>You have successfully authenticated via Firebase.</p>
      <button
        onClick={() => signOut(auth)}
        style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', backgroundColor: '#ff4b2b', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
      >
        Log Out
      </button>
    </div>
  );
}

// ==========================================
// 3. AUTH PANEL COMPONENT (Sliding Login/Register UI)
// ==========================================
function AuthPanel({ initialError }) {
  const [isActive, setIsActive] = useState(false); // Controls sliding layout animation
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  // Handler: Email/Password Login
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    if (!signInPassword) {
      setError("Password is required for standard sign in.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Email Link Sign In (Passwordless)
  const handleSendEmailLink = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    if (!signInEmail) {
      setError("Please enter your email in the email field first.");
      return;
    }
    try {
      const actionCodeSettings = {
        // Redirect back to this app's origin and path
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, signInEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', signInEmail);
      setInfoMessage("Sign-in link sent to your email! Please check your inbox.");
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Forgot Password (Reset email)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    if (!signInEmail) {
      setError("Please enter your email in the email field first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, signInEmail);
      setInfoMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Email/Password Registration
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      if (signUpName) {
        await updateProfile(userCredential.user, { displayName: signUpName });
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Google OAuth
  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: GitHub OAuth
  const handleGithubLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className={`container ${isActive ? 'active' : ''}`} id="container">

      {/* --- SIGN UP FORM --- */}
      <div className="form-container sign-up">
        <form onSubmit={handleSignUp}>
          <h1>Create Account</h1>
          <div className="social-icons">
            <a href="#" className="icon" onClick={handleGoogleLogin}><i className="fa-brands fa-google-plus-g"></i></a>
            <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#" className="icon" onClick={handleGithubLogin}><i className="fa-brands fa-github"></i></a>
            <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-linkedin-in"></i></a>
          </div>
          <span>or use your email for registration</span>
          {isActive && error && <p style={{ color: 'red', fontSize: '13px', margin: '5px 0' }}>{error}</p>}
          {isActive && infoMessage && <p style={{ color: 'green', fontSize: '13px', margin: '5px 0' }}>{infoMessage}</p>}
          <input type="text" placeholder="Name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} />
          <input type="email" placeholder="Email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />
          <button type="submit">Sign Up</button>
        </form>
      </div>

      {/* --- SIGN IN FORM --- */}
      <div className="form-container sign-in">
        <form onSubmit={handleSignIn}>
          <h1>Sign In</h1>
          <div className="social-icons">
            <a href="#" className="icon" onClick={handleGoogleLogin}><i className="fa-brands fa-google-plus-g"></i></a>
            <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#" className="icon" onClick={handleGithubLogin}><i className="fa-brands fa-github"></i></a>
            <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-linkedin-in"></i></a>
          </div>
          <span>or use your email password</span>
          {!isActive && error && <p style={{ color: 'red', fontSize: '13px', margin: '5px 0' }}>{error}</p>}
          {!isActive && infoMessage && <p style={{ color: '#2ecc71', fontSize: '13px', margin: '5px 0', fontWeight: 'bold' }}>{infoMessage}</p>}
          <input type="email" placeholder="Email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', margin: '10px 0' }}>
            <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            <a href="#" onClick={handleSendEmailLink} style={{ color: '#512da8', fontWeight: '600' }}>Passwordless Link</a>
          </div>

          <button type="submit">Sign In</button>
        </form>
      </div>

      {/* --- SLIDING TOGGLE PANELS --- */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of site features</p>
            <button className="hidden" id="login" onClick={() => { setIsActive(false); setError(""); setInfoMessage(""); }}>Sign In</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Hello, Friend!</h1>
            <p>Register with your personal details to use all of site features</p>
            <button className="hidden" id="register" onClick={() => { setIsActive(true); setError(""); setInfoMessage(""); }}>Sign Up</button>
          </div>
        </div>
      </div>

    </div>
  );
}