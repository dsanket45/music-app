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
import { Sparkles, RefreshCw } from 'lucide-react';


function App() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // ✅ Hooks always run, even during loading
  useEffect(() => {
    if (location.pathname === "/") {
      window.history.replaceState(null, "", user ? "/dashboard" : "/login");
    }
  }, [location.pathname, user]);

  // Enhanced service worker & auto update checking
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered');
          setSwRegistration(registration);

          // Force update check when app opens
          registration.update().catch(() => {});

          // Auto-reload on controller change (when new SW takes over)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 App updated, refreshing...');
            window.location.reload();
          });

          // Check if there is already a waiting worker
          if (registration.waiting) {
            setUpdateAvailable(true);
          }

          // Check for future updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✨ New update ready!');
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(error => {
          console.log('❌ Service Worker registration error:', error);
        });

      // Also re-check for updates whenever user returns/refreshes focus on the app
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => reg.update().catch(() => {}));
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const handleApplyUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload(true);
  };

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
      
      {/* Modern App Update Prompt Modal */}
      {updateAvailable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 text-white animate-bounce-short">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
              New Update Available! 🎉
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              A fresh update for <strong>D S Musics</strong> is ready! Tap below to apply the latest features and improvements immediately.
            </p>

            <button
              onClick={handleApplyUpdate}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Update App Now
            </button>
          </div>
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

        <Route path="/contact" element={user ? <ContactPage /> : <Navigate to="/login" replace />} />
        <Route path="/privacy" element={user ? <PrivacyPolicyPage /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;