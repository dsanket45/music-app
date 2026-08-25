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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg z-40 border-t border-slate-200/80 dark:border-slate-800 transition-all duration-300">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 group"
            >
              <div
                className={`p-1.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 scale-105'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}
              >
                <Icon
                  size={22}
                  className="transition-transform duration-200"
                  fill={isActive && label === 'Liked' ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              <span
                className={`text-[11px] font-semibold mt-0.5 transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe Area spacing for iOS / mobile gestures */}
      <div className="h-safe bg-white dark:bg-slate-900"></div>
    </nav>
  );
};

export default BottomNav;