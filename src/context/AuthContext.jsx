// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { auth, provider } from '../firebaseConfig';
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    try {
      // Try popup login first
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      console.warn('Popup login failed/blocked, trying redirect mode:', err);
      // Fallback to redirect mode if popup is blocked or unsupported on mobile/WebView
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/operation-not-supported-in-this-environment' ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error('Redirect login error:', redirectErr);
          alert(`Login Error: ${redirectErr.message || 'Please check Firebase authorized domains.'}`);
          return;
        }
      }
      
      if (err.code === 'auth/unauthorized-domain') {
        alert('Firebase Unauthorized Domain: Please add this domain/IP to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      } else {
        alert(`Login failed: ${err.message || 'Please try again.'}`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    // Check for redirect result when returning from redirect auth
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Error handling redirect result:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};