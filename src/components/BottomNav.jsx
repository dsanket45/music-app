// src/components/BottomNav.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, ListMusic } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/liked', icon: Heart, label: 'Liked' },
    { path: '/playlists', icon: ListMusic, label: 'Playlists' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-40 border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex flex-col items-center justify-center gap-1 flex-1 group transition-all duration-300 py-2"
              title={label}
            >
              {/* Icon Container */}
              <div
                className={`relative p-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/40 scale-105'
                    : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                }`}
              >
                {/* Active Glow Effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-md opacity-50"></div>
                )}
                
                <Icon
                  size={24}
                  className={`relative z-10 transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}
                  fill={isActive && label === 'Liked' ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-green-500 dark:text-green-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                }`}
              >
                {label}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute bottom-0 w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Safe Area for iOS */}
      <div className="h-safe bg-white dark:bg-gray-900"></div>
    </nav>
  );
};

export default BottomNav;