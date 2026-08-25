// src/pages/Login.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Music, Play, Heart, Sparkles } from 'lucide-react';
import dslogo from '../assets/dslogo.png';
import { AiOutlineGoogle } from 'react-icons/ai';

const Login = () => {
  const { login, loginAsGuest, loading } = useContext(AuthContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: Music, text: 'Stream millions of songs', color: 'from-green-400 to-emerald-500' },
    { icon: Heart, text: 'Create your favorites', color: 'from-red-400 to-pink-500' },
    { icon: Play, text: 'Unlimited playlists', color: 'from-purple-400 to-pink-500' }
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-48 h-48 bg-green-500/10 rounded-full blur-3xl animate-pulse sm:top-20 sm:left-10 sm:w-72 sm:h-72"></div>
        <div className="absolute bottom-10 right-5 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl animate-pulse sm:bottom-20 sm:right-10 sm:w-96 sm:h-96" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-400/5 rounded-full blur-3xl animate-pulse sm:w-[600px] sm:h-[600px]" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Music Notes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500/20 text-xl sm:text-3xl animate-float"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            ♪
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 sm:px-6 pt-6 pb-6">
        {/* Logo & Branding */}
        <div
          className={`text-center mb-6 sm:mb-8 transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
          }`}
        >
          <div className="relative inline-block mb-3 sm:mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <img
              src={dslogo}
              alt="Logo"
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl ring-4 ring-green-400/30 object-cover"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent animate-gradient">
              D S Musics
            </span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base mb-1 flex items-center justify-center gap-1.5">
            <Sparkles className="text-green-400 flex-shrink-0" size={16} />
            <span className="hidden xs:inline">Your Personal Music Universe</span>
            <span className="xs:hidden">Music Universe</span>
            <Sparkles className="text-green-400 flex-shrink-0" size={16} />
          </p>
          <p className="text-gray-400 text-xs">Stream, discover, and enjoy unlimited music</p>
        </div>

        {/* Features Cards */}
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl w-full px-4 sm:px-6 mb-6 sm:mb-10 transform transition-all duration-1000 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-emerald-400/50 transition-all duration-500 hover:scale-[1.03] sm:hover:scale-[1.02] shadow-sm hover:shadow-lg hover:shadow-emerald-500/20"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 rounded-2xl transition-all duration-500"></div>
                <div
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="text-white" size={20} />
                </div>
                <p className="relative text-white text-sm sm:text-base font-semibold leading-tight">{feature.text}</p>
              </div>
            );
          })}
        </div>

        {/* Login Options Container */}
        <div
          className={`flex flex-col items-center gap-3 transform transition-all duration-700 delay-300 w-full max-w-xs ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          {/* Instant Guest Access Button */}
          <button
            onClick={loginAsGuest}
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} className="animate-spin-slow" />
            <span>Instant Listen (Guest Access)</span>
          </button>

          {/* Google Sign In Button */}
          <button
            onClick={login}
            disabled={loading}
            className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <AiOutlineGoogle size={18} className="text-white flex-shrink-0" />
            <span>Sign in with Google</span>
          </button>

          <p className="text-gray-400 text-xs text-center mt-1">
            🔒 Secure & fast login options
          </p>
        </div>
      </div>

      {/* Footer moved inside flex container (no fixed position) */}
      <div className="relative z-10 py-2 text-center">
        <p className="text-gray-500 text-xs">
          Made by Sanket
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-12px) rotate(6deg);
            opacity: 0.5;
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;