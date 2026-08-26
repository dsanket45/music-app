// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { getTrendingIndianMusic, searchYouTube } from "../utils/search.js";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import SongCard from "../components/SongCard.jsx";
import { Heart, Sparkles, Play, Flame, Music, Radio, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { setNewQueue } = useContext(PlayerContext);
  const navigate = useNavigate();

  const [trendingSongs, setTrendingSongs] = useState([]);
  const [romanticSongs, setRomanticSongs] = useState([]);
  const [partySongs, setPartySongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time-based greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const fetchMusic = async () => {
      setIsLoading(true);
      try {
        const [trending, romantic, party] = await Promise.all([
          getTrendingIndianMusic(),
          searchYouTube("Arijit Singh romantic hits"),
          searchYouTube("party dance songs")
        ]);

        setTrendingSongs(trending.slice(0, 10));
        setRomanticSongs(romantic.slice(0, 10));
        setPartySongs(party.slice(0, 10));
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMusic();
  }, []);

  // Quick Play Tiles (Spotify 6-grid)
  const quickTiles = [
    {
      title: "Liked Songs",
      icon: Heart,
      gradient: "from-indigo-600 to-blue-400",
      action: () => navigate('/liked')
    },
    {
      title: "Trending Hits",
      icon: Flame,
      gradient: "from-emerald-600 to-[#1DB954]",
      action: () => trendingSongs[0] && setNewQueue(trendingSongs, 0)
    },
    {
      title: "Romantic Melodies",
      icon: Music,
      gradient: "from-pink-600 to-rose-400",
      action: () => romanticSongs[0] && setNewQueue(romanticSongs, 0)
    },
    {
      title: "Party Mix",
      icon: Radio,
      gradient: "from-purple-600 to-violet-400",
      action: () => partySongs[0] && setNewQueue(partySongs, 0)
    },
    {
      title: "Top English Hits",
      icon: Sparkles,
      gradient: "from-amber-600 to-yellow-400",
      action: async () => {
        const eng = await searchYouTube("Top global hits");
        setNewQueue(eng, 0);
      }
    },
    {
      title: "Daily Mix",
      icon: Music,
      gradient: "from-teal-600 to-emerald-400",
      action: () => trendingSongs[1] && setNewQueue(trendingSongs, 1)
    }
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col pb-36 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {timeGreeting}
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className="p-2 rounded-full bg-[#181818] hover:bg-[#282828] text-[#B3B3B3] hover:text-white transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 px-4 sm:px-6 space-y-8 max-w-7xl mx-auto w-full pt-2">
        {/* Quick-Access 6-Tile Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickTiles.map((tile, idx) => {
            const Icon = tile.icon;
            return (
              <div
                key={idx}
                onClick={tile.action}
                className="group relative flex items-center bg-[#181818] hover:bg-[#282828] rounded-md overflow-hidden transition-all duration-200 cursor-pointer shadow-md pr-3"
              >
                <div className={`w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br ${tile.gradient} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white pl-3.5 line-clamp-2 flex-1">
                  {tile.title}
                </span>

                {/* Floating Play Icon */}
                <div className="w-8 h-8 rounded-full bg-[#1DB954] shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 ml-2 flex-shrink-0">
                  <Play size={14} fill="#000000" className="text-black ml-0.5" />
                </div>
              </div>
            );
          })}
        </section>

        {/* Section 1: Trending Hits */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Trending Hits
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingSongs.map((song) => (
              <SongCard key={song.songId || song.id} song={song} />
            ))}
          </div>
        </section>

        {/* Section 2: Romantic Melodies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Romantic Melodies
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {romanticSongs.map((song) => (
              <SongCard key={song.songId || song.id} song={song} />
            ))}
          </div>
        </section>

        {/* Section 3: Party & Dance Hits */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Party & Dance Hits
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {partySongs.map((song) => (
              <SongCard key={song.songId || song.id} song={song} />
            ))}
          </div>
        </section>
      </main>

      {/* Spotify Bottom Mini Player */}
      <Player />

      {/* Spotify Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;