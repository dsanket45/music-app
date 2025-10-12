// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { getMostPlayed, getRecentlyPlayed, getLikedSongs, getPreferences } from "../utils/db.js";
import SongCard from "../components/SongCard.jsx";
import Navbar from "../components/Navbar.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import { Play, TrendingUp, Clock, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { setNewQueue } = useContext(PlayerContext);
  const [mostPlayed, setMostPlayed] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Load theme & data
  useEffect(() => {
    const init = async () => {
      const prefs = await getPreferences();
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeDark = prefs.darkMode ?? systemPrefersDark;
      setDarkMode(activeDark);
      document.documentElement.classList.toggle('dark', activeDark);

      setMostPlayed(await getMostPlayed());
      setRecentlyPlayed(await getRecentlyPlayed());
      setLikedSongs(await getLikedSongs());
    };
    init();
  }, []);

  const handlePlayAll = (songs) => {
    if (songs.length > 0) setNewQueue(songs);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const Section = ({ title, description, icon: Icon, songs }) => (
    songs.length > 0 && (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <Icon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </div>
          <button
            onClick={() => handlePlayAll(songs)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-medium transition-all duration-300 shadow-md"
          >
            <Play size={16} fill="currentColor" />
            <span className="hidden sm:inline">Play All</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {songs.map(song => <SongCard key={song.songId} song={song} darkMode={darkMode} />)}
        </div>
      </section>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-300">
      <Navbar />

      <div className="px-6 lg:px-20 py-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="text-white" size={24} />
            </div>
            {getGreeting()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg ml-1">
            Welcome back, {user?.email?.split('@')[0] || 'Music Lover'}
          </p>
        </div>

        <Section 
          title="Most Played" 
          description="Your top tracks this week" 
          icon={TrendingUp} 
          songs={mostPlayed} 
        />
        <Section 
          title="Recently Played" 
          description="Jump back in" 
          icon={Clock} 
          songs={recentlyPlayed} 
        />
        <Section 
          title="Liked Songs" 
          description={`${likedSongs.length} songs`} 
          icon={() => <span className="text-red-500 text-xl">❤️</span>} 
          songs={likedSongs} 
        />

        {/* Empty state */}
        {mostPlayed.length === 0 && recentlyPlayed.length === 0 && likedSongs.length === 0 && (
          <div className="text-center py-20 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <Play className="text-white" size={64} fill="currentColor" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Start Your Musical Journey
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Search for your favorite tracks, create playlists, and discover new music
            </p>
            <button
              onClick={() => window.location.href = '/search'}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-md"
            >
              Browse Music
            </button>
          </div>
        )}
      </div>

      <BottomNav />
      <Player />
    </div>
  );
};

export default Dashboard;
