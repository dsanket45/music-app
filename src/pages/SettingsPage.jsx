// src/pages/SettingsPage.jsx
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Player from '../components/Player';
import {
  ArrowLeft, User, ShieldCheck, Zap, Headphones, Moon, Sparkles,
  Code2, LogOut, CheckCircle2, ChevronRight, Radio, Bell
} from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [audioQuality, setAudioQuality] = useState('320');
  const [backgroundAudio, setBackgroundAudio] = useState(true);
  const [lockScreenControls, setLockScreenControls] = useState(true);
  const [theme, setTheme] = useState('pitch_black');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const userEmail = user?.email || 'Guest Listener';
  const userName = user?.displayName || userEmail.split('@')[0] || 'Music Lover';

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col pb-36 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center gap-4 border-b border-[#242424]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-[#181818] hover:bg-[#282828] text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-white">Settings</h1>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full space-y-6">
        {/* 1. User Profile Card */}
        <section className="bg-[#181818] rounded-xl p-5 border border-[#282828] flex items-center gap-4 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center text-black font-black text-2xl shadow-md flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{userName}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1DB954]/20 border border-[#1DB954] text-[#1DB954] text-[10px] font-extrabold uppercase">
                PRO
              </span>
            </div>
            <p className="text-xs text-[#B3B3B3] truncate mt-0.5">{userEmail}</p>
            <p className="text-[11px] text-[#1DB954] font-medium mt-1 flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>Unlimited Free Streaming Active</span>
            </p>
          </div>
        </section>

        {/* 2. Audio & Streaming Quality */}
        <section className="bg-[#181818] rounded-xl p-5 border border-[#282828] space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#282828]">
            <Headphones size={20} className="text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">Audio Quality & Playback</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Streaming Quality</p>
                <p className="text-xs text-[#B3B3B3]">Direct Studio Master Sound</p>
              </div>
              <select
                value={audioQuality}
                onChange={(e) => {
                  setAudioQuality(e.target.value);
                  showToast("Audio quality set to " + (e.target.value === '320' ? '320kbps Very High' : '160kbps High'));
                }}
                className="bg-[#242424] text-white text-xs font-bold px-3 py-2 rounded-lg border border-[#333333] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
              >
                <option value="320">Very High (320 kbps)</option>
                <option value="160">High (160 kbps)</option>
                <option value="96">Normal (96 kbps)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#282828]">
              <div>
                <p className="text-sm font-semibold text-white">Background Audio</p>
                <p className="text-xs text-[#B3B3B3]">Keep music playing when screen is locked</p>
              </div>
              <input
                type="checkbox"
                checked={backgroundAudio}
                onChange={(e) => {
                  setBackgroundAudio(e.target.checked);
                  showToast("Background audio: " + (e.target.checked ? "Enabled" : "Disabled"));
                }}
                className="w-5 h-5 accent-[#1DB954] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#282828]">
              <div>
                <p className="text-sm font-semibold text-white">Lock Screen Controls</p>
                <p className="text-xs text-[#B3B3B3]">Show playback notification & media buttons</p>
              </div>
              <input
                type="checkbox"
                checked={lockScreenControls}
                onChange={(e) => {
                  setLockScreenControls(e.target.checked);
                  showToast("Lock screen controls: " + (e.target.checked ? "Enabled" : "Disabled"));
                }}
                className="w-5 h-5 accent-[#1DB954] rounded cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* 3. Theme & Appearance */}
        <section className="bg-[#181818] rounded-xl p-5 border border-[#282828] space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#282828]">
            <Moon size={20} className="text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">Theme & Appearance</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setTheme('pitch_black'); showToast("Theme: Spotify Pitch Black"); }}
              className={`p-3.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                theme === 'pitch_black'
                  ? 'bg-[#121212] border-[#1DB954] shadow-md shadow-[#1DB954]/20'
                  : 'bg-[#242424] border-[#333333] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-white">Pitch Black (OLED)</span>
                {theme === 'pitch_black' && <CheckCircle2 size={16} className="text-[#1DB954]" />}
              </div>
              <span className="text-[11px] text-[#B3B3B3]">Pure Spotify Black #121212</span>
            </button>

            <button
              onClick={() => { setTheme('slate_dark'); showToast("Theme: Dark Slate"); }}
              className={`p-3.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                theme === 'slate_dark'
                  ? 'bg-[#1e293b] border-[#1DB954] shadow-md shadow-[#1DB954]/20'
                  : 'bg-[#242424] border-[#333333] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-white">Dark Slate</span>
                {theme === 'slate_dark' && <CheckCircle2 size={16} className="text-[#1DB954]" />}
              </div>
              <span className="text-[11px] text-[#B3B3B3]">Smooth Slate Tone</span>
            </button>
          </div>
        </section>

        {/* 4. Developer & App Information */}
        <section className="bg-[#181818] rounded-xl p-5 border border-[#282828] space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#282828]">
            <Code2 size={20} className="text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">About & Developer</h3>
          </div>

          <div className="space-y-2 text-xs text-[#B3B3B3]">
            <div className="flex justify-between py-1 border-b border-[#242424]">
              <span>Developer</span>
              <span className="text-white font-bold">Sanket</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#242424]">
              <span>App Version</span>
              <span className="text-white font-bold">v1.1.0 (Spotify Edition)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#242424]">
              <span>Live Auto-Update</span>
              <span className="text-[#1DB954] font-bold">🟢 Active & Connected</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Streaming Engine</span>
              <span className="text-white font-bold">Direct Audio Studio Master (320kbps)</span>
            </div>
          </div>
        </section>

        {/* 5. Logout Action */}
        <button
          onClick={() => logout()}
          className="w-full py-4 rounded-xl bg-[#242424] hover:bg-red-950/40 border border-[#333333] hover:border-red-500/50 text-red-400 hover:text-red-300 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <LogOut size={18} />
          <span>Log Out of D Music</span>
        </button>
      </main>

      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1DB954] text-black font-bold text-xs px-4 py-2 rounded-full shadow-2xl z-50 animate-bounce">
          {toast}
        </div>
      )}

      <Player />
      <BottomNav />
    </div>
  );
};

export default SettingsPage;