// src/components/Navbar.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PlayerContext } from '../context/PlayerContext';
import { User, Settings, LogOut, Heart, List, Info, Music, Sparkles } from 'lucide-react';
import { getPreferences } from '../utils/db';
import dslogo from '../assets/dslogo.png';
import AboutMe from '../pages/AboutMe';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode: contextDarkMode, setDarkMode: setContextDarkMode } = useContext(PlayerContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeDarkMode, setActiveDarkMode] = useState(false);
  const navigate = useNavigate();

  // Load theme from preferences - this ensures Navbar follows settings
  useEffect(() => {
    const loadTheme = async () => {
      const prefs = await getPreferences();
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeDark = prefs.darkMode ?? systemPrefersDark;
      setActiveDarkMode(activeDark);
      setContextDarkMode(activeDark);
      document.documentElement.classList.toggle('dark', activeDark);
    };
    loadTheme();
  }, [setContextDarkMode]);

  // Also listen for context changes
  useEffect(() => {
    setActiveDarkMode(contextDarkMode);
  }, [contextDarkMode]);

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

  const menuItems = [
    {
      icon: Music,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'from-green-500 to-emerald-500',
      hoverBg: 'hover:bg-green-50 dark:hover:bg-green-500/10',
      iconColor: 'text-green-500'
    },
    {
      icon: Heart,
      label: 'Liked Songs',
      path: '/liked',
      color: 'from-red-500 to-pink-500',
      hoverBg: 'hover:bg-red-50 dark:hover:bg-red-500/10',
      iconColor: 'text-red-500'
    },
    {
      icon: List,
      label: 'Your Playlists',
      path: '/playlists',
      color: 'from-purple-500 to-pink-500',
      hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
      iconColor: 'text-purple-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      color: 'from-blue-500 to-cyan-500',
      hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    {
      icon: Info,
      label: 'About Me',
      action: () => {
        handleCloseDrawer();
        setTimeout(() => setAboutOpen(true), 350);
      },
      color: 'from-orange-500 to-yellow-500',
      hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
      iconColor: 'text-orange-500'
    }
  ];

  return (
    <>
      {/* Navbar - Always Dark Mode for main bar, but drawer follows theme */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl shadow-2xl bg-gray-900/95 border-b border-gray-700 transition-all duration-500">
        <div className="flex justify-between items-center max-w-7xl mx-auto p-4">
          {/* Left Logo + Title */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setAboutOpen(true)}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <img
                src={dslogo}
                alt="Logo"
                className="relative w-11 h-11 object-contain rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300 ring-2 ring-green-400/20 group-hover:ring-green-400/60"
              />
            </div>
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]"
              onClick={() => navigate('/dashboard')}
            >
              SanketMusic
            </h1>
          </div>

          {/* Right Profile Button */}
          {user && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="group relative flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 overflow-hidden bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500"
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Avatar with ripple effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-0 group-hover:opacity-75"></div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-shadow duration-300">
                  <span className="text-white font-bold text-sm">{firstNameInitial}</span>
                </div>
              </div>
              
              <span className="hidden sm:block text-sm font-medium transition-colors duration-300 text-white group-hover:text-green-400">
                {userName}
              </span>
              
              <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-green-400" />
            </button>
          )}
        </div>
      </nav>

      {/* Profile Drawer Overlay - Follows Settings Theme */}
      {drawerOpen && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleCloseDrawer}
        >
          <div
            className={`fixed right-0 top-0 h-full w-80 sm:w-96 shadow-2xl transform transition-all duration-300 ease-out ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            } ${
              activeDarkMode 
                ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-l border-gray-700' 
                : 'bg-gradient-to-b from-white via-gray-50 to-white border-l border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseDrawer}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                activeDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col h-full p-6">
              {/* Header */}
              <div className="mb-8">
                <h2 className={`text-2xl font-bold mb-1 ${
                  activeDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Profile
                </h2>
                <p className={`text-sm ${
                  activeDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Manage your account
                </p>
              </div>

              {/* User Info Card */}
              <div className={`relative overflow-hidden rounded-3xl p-6 mb-8 ${
                activeDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600' 
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
              }`}>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/20 to-emerald-400/20 rounded-full blur-2xl"></div>
                
                <div className="relative flex flex-col items-center">
                  {/* Avatar with glow */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-50"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                      <span className="text-white text-4xl font-bold">{firstNameInitial}</span>
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-1 ${
                    activeDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {userName}
                  </h3>
                  <p className={`text-sm flex items-center gap-1 ${
                    activeDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <User size={14} />
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => item.action ? item.action() : handleNavigate(item.path)}
                      className={`group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                        activeDarkMode ? item.hoverBg.replace('hover:bg-', 'hover:bg-').replace('-50', '-500/10') : item.hoverBg
                      } ${
                        activeDarkMode
                          ? 'hover:shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: !isClosing ? 'slideInRight 0.3s ease-out forwards' : 'none'
                      }}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="text-white" size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className={`font-semibold ${
                          activeDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                      <svg 
                        className={`w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300 ${
                          activeDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  handleCloseDrawer();
                }}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 mt-6 ${
                  activeDarkMode
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Me Modal */}
      {aboutOpen && <AboutMe onClose={() => setAboutOpen(false)} />}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;