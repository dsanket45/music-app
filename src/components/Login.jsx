// src/components/Login.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Music, Play, Heart, Sparkles, Disc, Radio, Zap, ShieldCheck } from 'lucide-react';
import dslogo from '../assets/dslogo.png';
import { AiOutlineGoogle } from 'react-icons/ai';

const Login = () => {
  const { login, loginAsGuest, loading } = useContext(AuthContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: Radio, text: 'Background Audio & Lockscreen Controls', color: 'from-[#1DB954] to-emerald-600' },
    { icon: Music, text: 'Millions of Songs & High Quality Stream', color: 'from-emerald-500 to-teal-600' },
    { icon: Heart, text: 'Custom Playlists & Liked Favorites', color: 'from-teal-500 to-cyan-600' }
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0f1d] flex flex-col justify-between text-white font-sans selection:bg-[#1DB954] selection:text-black">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#1DB954]/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-emerald-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute -bottom-24 left-1/3 w-[450px] h-[450px] bg-teal-500/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Top Bar / Badge */}
      <div className="relative z-10 pt-6 px-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/50 shadow-[0_0_20px_rgba(29,185,84,0.3)] backdrop-blur-xl animate-bounce-short">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] animate-ping"></span>
          <span className="text-xs font-extrabold tracking-wider text-[#1DB954] uppercase">
            🟢 SPOTIFY EDITION • LIVE AUTO-UPDATE
          </span>
        </div>
      </div>

      {/* Center Hero & Login Box */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 sm:px-6 py-6 max-w-md mx-auto w-full">
        {/* Animated Vinyl Logo Visual */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#1DB954] to-emerald-400 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900 border-2 border-[#1DB954] p-1.5 shadow-2xl flex items-center justify-center">
            <img
              src={dslogo}
              alt="D S Musics"
              className="w-full h-full rounded-full object-cover animate-spin-slow"
            />
            <div className="absolute w-6 h-6 rounded-full bg-[#0a0f1d] border border-[#1DB954]/60 flex items-center justify-center shadow-inner">
              <div className="w-2 h-2 rounded-full bg-[#1DB954]"></div>
            </div>
          </div>
        </div>

        {/* App Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-1">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              D S Musics
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Zap size={14} className="text-[#1DB954]" />
            <span>Next-Gen Spotify Music Experience</span>
            <Zap size={14} className="text-[#1DB954]" />
          </p>
        </div>

        {/* Feature Highlights Card */}
        <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl mb-6 shadow-xl space-y-2.5">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                  <Icon size={14} />
                </div>
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>

        {/* Login Action Buttons */}
        <div className="w-full space-y-3">
          {/* Instant Guest Button */}
          <button
            onClick={loginAsGuest}
            disabled={loading}
            className="w-full py-4 px-6 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-sm sm:text-base rounded-full transition-all duration-300 shadow-[0_0_25px_rgba(29,185,84,0.4)] hover:shadow-[0_0_35px_rgba(29,185,84,0.6)] active:scale-95 flex items-center justify-center gap-2.5"
          >
            <Sparkles size={18} className="animate-spin-slow" />
            <span>Instant Listen (Guest Access)</span>
          </button>

          {/* Google Sign In Button */}
          <button
            onClick={login}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-500 text-white font-bold text-sm rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 shadow-lg"
          >
            <AiOutlineGoogle size={20} className="text-white" />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-slate-500 text-[11px]">
          <ShieldCheck size={14} className="text-[#1DB954]" />
          <span>Continuous Background Playback Enabled</span>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-3 text-center text-slate-600 text-xs">
        <span>Crafted by Sanket • D Music App</span>
      </div>

      <style jsx>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;