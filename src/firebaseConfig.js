import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup as firebaseSignInWithPopup,
    signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
    createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendSignInLinkToEmail as firebaseSendSignInLinkToEmail,
    isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
    signInWithEmailLink as firebaseSignInWithEmailLink,
    updateProfile as firebaseUpdateProfile,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.includes("your_")
);

if (!hasFirebaseConfig) {
    console.warn("Firebase credentials missing or unconfigured. Operating in local sandbox mode.");
}

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const localAuth = {
    currentUser: null,
    onAuthStateChanged(callback) {
        queueMicrotask(() => callback(null));
        return () => {};
    }
};

export const auth = app ? getAuth(app) : localAuth;

const missingFirebaseError = () => new Error(
    "Firebase is not configured. Add the VITE_FIREBASE_* values from .env.example to enable authentication."
);

export const signInWithPopup = (...args) => (
    hasFirebaseConfig ? firebaseSignInWithPopup(...args) : Promise.reject(missingFirebaseError())
);
export const signInWithEmailAndPassword = (...args) => (
    hasFirebaseConfig ? firebaseSignInWithEmailAndPassword(...args) : Promise.reject(missingFirebaseError())
);
export const createUserWithEmailAndPassword = (...args) => (
    hasFirebaseConfig ? firebaseCreateUserWithEmailAndPassword(...args) : Promise.reject(missingFirebaseError())
);
export const signOut = (...args) => (
    hasFirebaseConfig ? firebaseSignOut(...args) : Promise.resolve()
);
export const sendSignInLinkToEmail = (...args) => (
    hasFirebaseConfig ? firebaseSendSignInLinkToEmail(...args) : Promise.reject(missingFirebaseError())
);
export const isSignInWithEmailLink = (...args) => (
    hasFirebaseConfig ? firebaseIsSignInWithEmailLink(...args) : false
);
export const signInWithEmailLink = (...args) => (
    hasFirebaseConfig ? firebaseSignInWithEmailLink(...args) : Promise.reject(missingFirebaseError())
);
export const updateProfile = (...args) => (
    hasFirebaseConfig ? firebaseUpdateProfile(...args) : Promise.reject(missingFirebaseError())
);
export const sendPasswordResetEmail = (...args) => (
    hasFirebaseConfig ? firebaseSendPasswordResetEmail(...args) : Promise.reject(missingFirebaseError())
);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();