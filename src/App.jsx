import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import LikedSongsPage from './pages/LikedSongsPage';
import SettingsPage from './pages/SettingsPage';
import PlaylistPage from './pages/PlaylistsPage';
import AboutMe from './pages/AboutMe';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import InstallPrompt from "./components/InstallPrompt";
import LottieLoader from './components/LottieLoader';


function App() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // ✅ Hooks always run, even during loading
  useEffect(() => {
    if (location.pathname === "/") {
      window.history.replaceState(null, "", user ? "/dashboard" : "/login");
    }
  }, [location.pathname, user]);

  // Enhanced service worker for background audio
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker for PWA and background sync
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered for background audio');

          // Listen for controller changes (updates)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker updated, reloading...');
            window.location.reload();
          });

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ New version available!');
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });

      // Handle service worker messages for background audio state
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'PLAYBACK_STATE') {
          console.log('🎵 Service Worker playback state:', event.data.state);
        }
      });
    }

    // Setup beforeunload to save playback state
    const handleBeforeUnload = () => {
      // This will be handled by PlayerContext
      console.log('💾 App closing, saving state...');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle online/offline status for background audio
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 App online - background audio ready');
    };

    const handleOffline = () => {
      console.log('📴 App offline - background audio may be affected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Conditional render for loading
  if (loading) {
    return <LottieLoader />;
  }

  return (
    <>
      <InstallPrompt />
      {updateAvailable && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-3 rounded-2xl shadow-lg z-50 flex items-center gap-3 max-w-[100vw] sm:max-w-md">
          <span>✨ New version available!</span>
          <button
            className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition"
            onClick={() => window.location.reload()}
          >
            Update
          </button>
        </div>
      )}

      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" replace />} />
        <Route path="/liked" element={user ? <LikedSongsPage /> : <Navigate to="/login" replace />} />
        <Route path="/playlists" element={user ? <PlaylistPage /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
        <Route path="/about" element={user ? <AboutMe /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

         <Route path="/about" element={user ?<AboutPage /> : <Navigate to="/login" replace />} />
        <Route path="/contact" element={user ? <ContactPage /> : <Navigate to="/login" replace />} />
        <Route path="/privacy" element={user ? <PrivacyPolicyPage /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;