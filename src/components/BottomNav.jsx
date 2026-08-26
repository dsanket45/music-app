// src/components/BottomNav.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Library } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/liked', icon: Library, label: 'Your Library' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212] border-t border-[#282828] transition-all"
      style={{
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-6">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-colors group"
            >
              <Icon
                size={24}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-[#B3B3B3] group-hover:text-white'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[11px] font-bold mt-1 transition-colors ${
                  isActive ? 'text-white' : 'text-[#B3B3B3] group-hover:text-white'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;