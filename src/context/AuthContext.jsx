// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { auth, provider } from '../firebaseConfig';
import { Browser } from '@capacitor/browser';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously
} from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ensure local persistence is set so state is not lost across redirects
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Could not set browserLocalPersistence:', err);
    });
  }, []);

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      if (result?.user) {
        setUser(result.user);
      }
    } catch (err) {
      console.warn('Guest login fallback active:', err);
      setUser({
        uid: 'guest_' + Date.now(),
        displayName: 'Guest Listener',
        email: 'guest@dsmusics.app',
        isAnonymous: true
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setLoading(true);
    const isCapacitorNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        setUser(result.user);
      }
    } catch (err) {
      console.warn('Popup login error or closed:', err);

      // In Native Android APK, never redirect to external browser. Instead, log in seamlessly as Guest!
      if (isCapacitorNative) {
        console.log('Native Android APK active: using instant guest authentication inside app.');
        await loginAsGuest();
        return;
      }

      if (err.code === 'auth/unauthorized-domain') {
        alert('Firebase Unauthorized Domain: Please add "dsmusics.netlify.app" and "localhost" to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
        setLoading(false);
        return;
      }

      // Fallback to redirect on web if popup is blocked
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error('Redirect auth error:', redirectErr);
          alert('Google Sign-In failed. Please try again.');
        }
      } else if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Sign in error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    let isMounted = true;

    // Check for redirect result when returning from redirect auth
    getRedirectResult(auth)
      .then((result) => {
        if (isMounted && result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        // Silently handle missing initial state error from storage partitioning
        if (error.code === 'auth/missing-initial-state') {
          console.warn('Redirect state lost due to browser storage partitioning. User can tap Sign in again.');
        } else if (error.code === 'auth/unauthorized-domain') {
          alert('Firebase Unauthorized Domain: Please add your domain (dsmusics.netlify.app) in Firebase Console -> Authentication -> Settings -> Authorized Domains.');
        } else {
          console.error('Error handling redirect result:', error);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginAsGuest, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};