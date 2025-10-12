// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { savePreferences, getPreferences } from '../utils/db.js';
import { PlayerContext } from '../context/PlayerContext';
import Navbar from '../components/Navbar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Player from '../components/Player.jsx';
import { ArrowLeft, Moon, Sun, Check, Globe, Heart, Sparkles, Music, Zap } from 'lucide-react';

const languagesList = [
  { name: "English", emoji: "🇬🇧" },
  { name: "Hindi", emoji: "🇮🇳" },
  { name: "Bengali", emoji: "🇧🇩" },
  { name: "Telugu", emoji: "🎭" },
  { name: "Marathi", emoji: "🎪" },
  { name: "Tamil", emoji: "🎬" },
  { name: "Gujarati", emoji: "🪔" },
  { name: "Urdu", emoji: "📖" },
  { name: "Kannada", emoji: "🎨" },
  { name: "Odia", emoji: "🏛️" },
  { name: "Malayalam", emoji: "🌴" },
  { name: "Punjabi", emoji: "🥁" },
  { name: "Assamese", emoji: "🦚" },
  { name: "Maithili", emoji: "📜" },
  { name: "Santali", emoji: "🌾" },
  { name: "Kashmiri", emoji: "🏔️" },
  { name: "Nepali", emoji: "🏔️" },
  { name: "Sindhi", emoji: "🎵" },
  { name: "Dogri", emoji: "⛰️" },
  { name: "Manipuri", emoji: "💃" }
];

const moodsList = [
  { name: "Happy", emoji: "😊", color: "from-yellow-400 to-orange-400" },
  { name: "Chill", emoji: "😌", color: "from-blue-400 to-cyan-400" },
  { name: "Energetic", emoji: "⚡", color: "from-red-400 to-pink-400" },
  { name: "Romantic", emoji: "💕", color: "from-pink-400 to-rose-400" },
  { name: "Sad", emoji: "😢", color: "from-gray-400 to-slate-400" },
  { name: "Motivational", emoji: "💪", color: "from-orange-400 to-red-400" },
  { name: "Workout", emoji: "🏋️", color: "from-green-400 to-emerald-400" },
  { name: "Party", emoji: "🎉", color: "from-purple-400 to-pink-400" },
  { name: "Focus", emoji: "🎯", color: "from-indigo-400 to-blue-400" },
  { name: "Relax", emoji: "🧘", color: "from-teal-400 to-cyan-400" }
];

const SettingsPage = () => {
  const { darkMode: contextDarkMode, setDarkMode: setContextDarkMode } = useContext(PlayerContext);
  const [localDarkMode, setLocalDarkMode] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [moods, setMoods] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await getPreferences();
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeDark = prefs.darkMode ?? systemPrefersDark;
      
      setLocalDarkMode(activeDark);
      setContextDarkMode(activeDark);
      document.documentElement.classList.toggle('dark', activeDark);
      
      setLanguages(prefs.languages || []);
      setMoods(prefs.moods || []);
    };
    loadPrefs();
  }, [setContextDarkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !localDarkMode;
    setLocalDarkMode(newDarkMode);
    setContextDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await savePreferences({ darkMode: localDarkMode, languages, moods });
    
    setTimeout(() => {
      setIsSaving(false);
      showToast("Preferences saved successfully!");
    }, 800);
  };

  const handleLanguageChange = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleMoodChange = (mood) => {
    if (moods.includes(mood)) {
      setMoods(moods.filter(m => m !== mood));
    } else {
      setMoods([...moods, mood]);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 ${
      localDarkMode 
        ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'
    }`}>
      <Navbar />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-xl transition-all duration-300 ${
              localDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="text-white" size={32} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                localDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Settings
              </h1>
              <p className={`text-lg ${
                localDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Customize your experience
              </p>
            </div>
          </div>
        </div>

        {/* Theme Toggle Card */}
        <div className={`mb-6 overflow-hidden rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${
          localDarkMode
            ? 'bg-gray-800/80 border border-gray-700'
            : 'bg-white/80 border border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                localDarkMode 
                  ? 'bg-indigo-500/20 text-indigo-400' 
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                {localDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  localDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Appearance
                </h2>
                <p className={`text-sm ${
                  localDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Choose your theme
                </p>
              </div>
            </div>

            <button
              onClick={toggleDarkMode}
              className={`relative w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 overflow-hidden group ${
                localDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  localDarkMode
                    ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50'
                    : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                }`}>
                  {localDarkMode ? (
                    <Moon className="text-white" size={24} />
                  ) : (
                    <Sun className="text-white" size={24} />
                  )}
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${
                    localDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {localDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className={`text-sm ${
                    localDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {localDarkMode ? 'Easy on the eyes' : 'Bright and clear'}
                  </p>
                </div>
              </div>

              <div className={`w-16 h-8 rounded-full transition-all duration-300 relative ${
                localDarkMode ? 'bg-indigo-500' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                  localDarkMode ? 'translate-x-9' : 'translate-x-1'
                }`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* Languages Card */}
        <div className={`mb-6 overflow-hidden rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${
          localDarkMode
            ? 'bg-gray-800/80 border border-gray-700'
            : 'bg-white/80 border border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="text-white" size={20} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  localDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Preferred Languages
                </h2>
                <p className={`text-sm ${
                  localDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {languages.length > 0 ? `${languages.length} selected` : 'Select your languages'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 custom-scrollbar">
              {languagesList.map((lang, index) => {
                const isSelected = languages.includes(lang.name);
                return (
                  <button
                    key={lang.name}
                    onClick={() => handleLanguageChange(lang.name)}
                    className={`group relative p-4 rounded-2xl transition-all duration-300 ${
                      isSelected
                        ? localDarkMode
                          ? 'bg-green-500/20 border-2 border-green-500 shadow-lg shadow-green-500/20'
                          : 'bg-green-50 border-2 border-green-500 shadow-lg shadow-green-500/20'
                        : localDarkMode
                          ? 'bg-gray-700/50 border-2 border-gray-600 hover:border-gray-500'
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{lang.emoji}</span>
                        <span className={`font-medium ${
                          isSelected
                            ? localDarkMode ? 'text-green-400' : 'text-green-600'
                            : localDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {lang.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="text-white" size={14} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Moods Card */}
        <div className={`mb-6 overflow-hidden rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${
          localDarkMode
            ? 'bg-gray-800/80 border border-gray-700'
            : 'bg-white/80 border border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="text-white" size={20} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  localDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Preferred Moods
                </h2>
                <p className={`text-sm ${
                  localDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {moods.length > 0 ? `${moods.length} selected` : 'What\'s your vibe?'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {moodsList.map((mood, index) => {
                const isSelected = moods.includes(mood.name);
                return (
                  <button
                    key={mood.name}
                    onClick={() => handleMoodChange(mood.name)}
                    className={`group relative p-5 rounded-2xl transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? 'scale-105 shadow-xl'
                        : localDarkMode
                          ? 'bg-gray-700/50 hover:bg-gray-700'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={{
                      animationDelay: `${index * 40}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-20`}></div>
                    )}
                    
                    <div className="relative flex flex-col items-center gap-2">
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className={`font-semibold text-sm ${
                        isSelected
                          ? localDarkMode ? 'text-white' : 'text-gray-900'
                          : localDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {mood.name}
                      </span>
                      {isSelected && (
                        <div className={`w-6 h-6 bg-gradient-to-br ${mood.color} rounded-full flex items-center justify-center absolute -top-1 -right-1 shadow-lg`}>
                          <Check className="text-white" size={14} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-green-500/40 flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          {isSaving ? (
            <>
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={24} />
              <span>Save Preferences</span>
              <Zap className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={20} />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-slideUp ${
          localDarkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="text-white" size={20} />
          </div>
          <span className={`font-semibold ${
            localDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {toastMessage}
          </span>
        </div>
      )}

      <BottomNav />
      <Player />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          0% { 
            opacity: 0; 
            transform: translate(-50%, 30px); 
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, 0); 
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${localDarkMode ? '#1f2937' : '#f3f4f6'};
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${localDarkMode ? '#4b5563' : '#d1d5db'};
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${localDarkMode ? '#6b7280' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;