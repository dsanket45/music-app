// src/pages/Login.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Music, Play, Heart, Sparkles, Chrome } from 'lucide-react';
import dslogo from '../assets/dslogo.png';

const Login = () => {
  const { login, loading } = useContext(AuthContext);
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Music Notes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500/20 text-4xl animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            ♪
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo & Branding */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ${
          mounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`}>
          {/* Logo */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <img 
              src={dslogo} 
              alt="Logo" 
              className="relative w-24 h-24 rounded-full shadow-2xl ring-4 ring-green-400/30"
            />
          </div>

          {/* Title */}
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent animate-gradient">
              SanketMusic
            </span>
          </h1>
          
          <p className="text-gray-300 text-xl mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-green-400" size={20} />
            Your Personal Music Universe
            <Sparkles className="text-green-400" size={20} />
          </p>
          <p className="text-gray-400 text-sm">Stream, discover, and enjoy unlimited music</p>
        </div>

        {/* Features Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl w-full transform transition-all duration-1000 delay-200 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 rounded-2xl transition-all duration-300"></div>
                <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="text-white" size={24} />
                </div>
                <p className="relative text-white font-medium">{feature.text}</p>
              </div>
            );
          })}
        </div>

        {/* Login Button */}
        <div className={`transform transition-all duration-1000 delay-400 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <button
            onClick={login}
            disabled={loading}
            className="group relative px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-2xl shadow-green-500/50 overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            
            {/* Button Content */}
            <div className="relative flex items-center gap-3">
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Chrome size={24} />
                  <span>Sign in with Google</span>
                  <Sparkles className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={20} />
                </>
              )}
            </div>
          </button>

          {/* Helper Text */}
          <p className="text-gray-400 text-sm text-center mt-6">
            🔒 Secure authentication with Google
          </p>
        </div>

        {/* Stats/Info */}
        {/* <div className={`mt-16 grid grid-cols-3 gap-8 max-w-2xl w-full transform transition-all duration-1000 delay-600 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          {[
            { value: '10M+', label: 'Songs' },
            { value: '∞', label: 'Playlists' },
            { value: '24/7', label: 'Streaming' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div> */}

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-gray-500 text-sm">
            Made with <span className="text-red-500 animate-pulse">❤️</span> and effort by Sanket
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
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
          animation: float linear infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;