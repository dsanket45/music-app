// src/components/Navbar.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PlayerContext } from '../context/PlayerContext';
import { User, Settings, LogOut, Heart, List, Info, Music, Sparkles, Download, Smartphone } from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/db';
import dslogo from '../assets/dslogo.png';
import AboutMe from '../pages/AboutMe';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode: contextDarkMode, setDarkMode: setContextDarkMode } = useContext(PlayerContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeDarkMode, setActiveDarkMode] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load theme from preferences
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const prefs = await getPreferences();
        const activeDark = prefs?.darkMode ?? false; // Default to light mode UI
        setActiveDarkMode(activeDark);
        if (setContextDarkMode) {
          setContextDarkMode(activeDark);
        }
        document.documentElement.classList.toggle('dark', activeDark);
      } catch (error) {
        console.error('Error loading theme:', error);
        setActiveDarkMode(false);
        document.documentElement.classList.toggle('dark', false);
      }
    };
    loadTheme();
  }, [setContextDarkMode]);

  // Auto-save theme when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await savePreferences({ darkMode: activeDarkMode });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    saveTheme();
  }, [activeDarkMode]);

  const firstNameInitial = user?.email?.split('@')[0]?.charAt(0).toUpperCase() || 'U';
  const userName = user?.email?.split('@')[0] || 'User';

  const handleCloseDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDrawerOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleNavigate = (path) => {
    handleCloseDrawer();
    setTimeout(() => navigate(path), 350);
  };

  const handleDownloadApk = () => {
    const apkUrl = `https://raw.githubusercontent.com/dsanket45/music-app/main/releases/dmusic.apk?v=${Date.now()}`;
    const link = document.createElement("a");
    link.href = apkUrl;
    link.setAttribute("download", "D-Music-App.apk");
    link.setAttribute("target", "_self");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems = [
    {
      icon: Music,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'from-emerald-500 to-teal-500',
      hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
      iconColor: 'text-emerald-500'
    },
    {
      icon: Heart,
      label: 'Liked Songs',
      path: '/liked',
      color: 'from-pink-500 to-rose-500',
      hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
      iconColor: 'text-pink-500'
    },
    {
      icon: List,
      label: 'Your Playlists',
      path: '/playlists',
      color: 'from-indigo-500 to-purple-500',
      hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
      iconColor: 'text-indigo-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      color: 'from-sky-500 to-blue-500',
      hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
      iconColor: 'text-sky-500'
    },
  ];

  const staticPages = [
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Privacy Policy', path: '/privacy' }
  ];

  const isOnStaticPage = ['/about', '/contact', '/privacy'].includes(location.pathname);

  return (
    <>
      {/* Light Glassmorphic Navbar */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3 sm:px-6">
          {/* Left Logo + Title */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setAboutOpen(true)}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <img
                src={dslogo}
                alt="Logo"
                className="relative w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full shadow-md ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1
              className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent cursor-pointer hover:opacity-90 transition-opacity duration-300"
              onClick={() => navigate('/dashboard')}
            >
              D Music
            </h1>
          </div>

          {/* Right Action Buttons: Download APK & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) && (
              <button
                onClick={handleDownloadApk}
                title="Download Native Android App for background music"
                className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 font-semibold text-xs sm:text-sm border border-emerald-200 dark:border-emerald-700/50 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Install App</span>
                <Download className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}

            {user && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="group relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xs sm:text-sm">{firstNameInitial}</span>
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {userName}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Profile Drawer Overlay */}
      {drawerOpen && (
        <div
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleCloseDrawer}
        >
          <div
            className={`fixed right-0 top-0 h-full w-80 sm:w-96 shadow-2xl transform transition-all duration-300 ease-out bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseDrawer}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col h-full p-6">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Profile & Options
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your account & app preferences
                </p>
              </div>

              {/* Back to dashboard button if on static page */}
              {isOnStaticPage && (
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    handleCloseDrawer();
                  }}
                  className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  ← Back to Dashboard
                </button>
              )}

              {/* User Info Card */}
              <div className="relative overflow-hidden rounded-3xl p-5 mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 border border-emerald-100 dark:border-slate-700 shadow-sm">
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 ring-4 ring-white dark:ring-slate-700">
                    <span className="text-white text-3xl font-bold">{firstNameInitial}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">
                    {userName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User size={12} />
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Native App Banner Download Action in Drawer */}
              <div className="mb-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Native Android App (APK)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Download & install for non-stop background audio with screen locked!
                </p>
                <button
                  onClick={handleDownloadApk}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Android APK
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left`}
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-md text-white`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {item.label}
                      </div>
                    </button>
                  );
                })}

                {/* Static Pages */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  {staticPages.map((page) => (
                    <button
                      key={page.path}
                      onClick={() => handleNavigate(page.path)}
                      className="w-full text-left px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  handleCloseDrawer();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200/80 dark:border-red-900/50 transition-all mt-4 text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Me Modal */}
      {aboutOpen && <AboutMe onClose={() => setAboutOpen(false)} />}
    </>
  );
};

export default Navbar;