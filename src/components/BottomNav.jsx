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
    { path: '/playlists', icon: ListMusic, label: 'Library' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40" style={{
      background: 'linear-gradient(to top, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.92) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(51,65,85,0.4)',
    }}>
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
              <div className="p-1.5 rounded-2xl transition-all duration-200 flex items-center justify-center">
                <Icon
                  size={22}
                  className="transition-all duration-200"
                  fill={isActive && label === 'Liked' ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    color: isActive ? '#1DB954' : '#94a3b8',
                  }}
                />
              </div>

              <span
                className="text-[10px] font-semibold mt-0.5 transition-all duration-200"
                style={{
                  color: isActive ? '#1DB954' : '#94a3b8',
                }}
              >
                {label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#1DB954' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Safe Area spacing for iOS / mobile gestures */}
      <div className="h-safe" style={{ backgroundColor: '#0f172a' }}></div>
    </nav>
  );
};

export default BottomNav;