// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { getMostPlayed, getRecentlyPlayed, getLikedSongs } from "../utils/db.js";
import { getTrendingIndianMusic, forceRefreshTrending } from "../utils/search.js";
import Navbar from "../components/Navbar.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import { Play, TrendingUp, Clock, Heart, Music2, Sparkles, RefreshCw, Smartphone, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BannerAd from "../components/Ads/BannerAd.jsx";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { setNewQueue, currentTrack } = useContext(PlayerContext);
  const navigate = useNavigate();
  const [mostPlayed, setMostPlayed] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingTrending, setRefreshingTrending] = useState(false);

  // Generate session quote
  const [sessionQuote] = useState(() => {
    const quotes = [
      "Let the music speak",
      "Feel the rhythm",
      "Sound of soul",
      "Music is life",
      "Beat goes on",
      "Harmony within"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  // Time-based greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const fullGreeting = `${timeGreeting}`;

  const getUserName = () => {
    const email = user?.email || '';
    const name = email.split('@')[0];
    return name.replace(/[0-9]/g, '').charAt(0).toUpperCase() + name.replace(/[0-9]/g, '').slice(1) || 'Music Lover';
  };

  const loadTrendingSongs = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        forceRefreshTrending();
        setRefreshingTrending(true);
      }

      const now = Date.now();
      const cacheKey = 'trending_songs_cache_v2';
      let trending = [];

      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (now - timestamp < 12 * 60 * 60 * 1000) {
            trending = data;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      }

      if (trending.length === 0) {
        trending = await getTrendingIndianMusic();
        localStorage.setItem(cacheKey, JSON.stringify({
          data: trending,
          timestamp: now
        }));
      }

      setTrendingSongs(trending.slice(0, 12));
      return trending;
    } catch (error) {
      console.error('Error loading trending songs:', error);
      const fallback = [
        {
          songId: "J---aiyznGQ",
          title: "Kesariya - Brahmastra",
          artist: "Arijit Singh",
          thumbnail: "https://i.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg",
          duration: "4:28",
          durationSec: 268,
          isOfficial: true,
          language: "hindi"
        },
        {
          songId: "VNs_cCtdbPc",
          title: "Apna Bana Le",
          artist: "Arijit Singh",
          thumbnail: "https://i.ytimg.com/vi/VNs_cCtdbPc/mqdefault.jpg",
          duration: "4:21",
          durationSec: 261,
          isOfficial: true,
          language: "hindi"
        }
      ];
      setTrendingSongs(fallback);
      return fallback;
    } finally {
      setRefreshingTrending(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [most, recent, liked] = await Promise.all([
          getMostPlayed(),
          getRecentlyPlayed(),
          getLikedSongs()
        ]);
        setMostPlayed(most);
        setRecentlyPlayed(recent);
        setLikedSongs(liked);
        await loadTrendingSongs();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handlePlayAll = (songs) => {
    if (songs.length > 0) setNewQueue(songs, 0, true);
  };

  const handleRefreshTrending = async () => {
    await loadTrendingSongs(true);
  };

  const handleDownloadApk = () => {
    const apkUrl = `https://raw.githubusercontent.com/dsanket45/music-app/main/releases/dmusic.apk?v=${Date.now()}`;
    const link = document.createElement("a");
    link.href = apkUrl;
    link.setAttribute("download", "D-Music-App.apk");
    link.setAttribute("target", "_self");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Horizontal Section Component ---
  const HorizontalSection = ({ title, description, icon: Icon, songs, color = "from-emerald-500 to-teal-500", showRefresh = false, onRefresh }) => (
    songs.length > 0 && (
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-md text-white`}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshingTrending}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full font-semibold transition-all duration-200 text-xs border border-slate-200/80 dark:border-slate-700"
              >
                <RefreshCw size={12} className={refreshingTrending ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <button
              onClick={() => handlePlayAll(songs)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full font-bold transition-all duration-200 shadow-md shadow-emerald-500/20 text-xs"
            >
              <Play size={12} fill="currentColor" />
              <span>Play All</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-3.5 px-4 sm:px-6 min-w-max">
            {songs.map(song => (
              <div
                key={song.songId}
                onClick={() => setNewQueue([song], 0, true)}
                className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 flex-shrink-0"
              >
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800 relative border border-slate-200/60 dark:border-slate-700">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 text-white">
                        <Play size={18} className="ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 w-32 sm:w-36">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">{song.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  );

  // --- Grid Section Component ---
  const GridSection = ({ title, description, icon: Icon, songs, color = "from-teal-500 to-emerald-600" }) => (
    songs.length > 0 && (
      <section className="mb-8 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-md text-white`}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{description}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {songs.map(song => (
            <div
              key={song.songId}
              onClick={() => setNewQueue([song], 0, true)}
              className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md"
            >
              <div className="aspect-square rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 relative border border-slate-100 dark:border-slate-700">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 text-white">
                      <Play size={16} className="ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">{song.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 ${currentTrack ? 'pb-32' : 'pb-24'}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-600/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md mb-2">
                  <Sparkles size={12} />
                  <span>{sessionQuote}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {fullGreeting}, {getUserName()}! 👋
                </h1>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1 font-medium max-w-xl">
                  Discover trending songs, enjoy non-stop music, and download our native app for background playback!
                </p>
              </div>

              <button
                onClick={handleDownloadApk}
                className="self-start sm:self-center bg-white hover:bg-slate-100 text-emerald-800 font-extrabold px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm active:scale-95 whitespace-nowrap"
              >
                <Smartphone size={18} className="text-emerald-600" />
                <span>Download Native APK</span>
                <Download size={14} className="text-emerald-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-6">
          <HorizontalSection 
            title="Trending Now" 
            description="Top hit tracks right now" 
            icon={TrendingUp}
            songs={trendingSongs} 
            color="from-purple-500 to-indigo-500" 
            showRefresh={true}
            onRefresh={handleRefreshTrending}
          />

          <div className="px-4 sm:px-6 mb-6">
            <BannerAd />
          </div>
          
          <HorizontalSection 
            title="Recently Played" 
            description="Songs you played recently" 
            icon={Clock}
            songs={recentlyPlayed} 
            color="from-sky-500 to-blue-600" 
          />

          <div className="px-4 sm:px-6 mb-6">
            <BannerAd />
          </div>
          
          <GridSection 
            title="Most Played" 
            description="Your all-time most played tracks" 
            icon={TrendingUp}
            songs={mostPlayed} 
            color="from-emerald-500 to-teal-600" 
          />

          <div className="px-4 sm:px-6 mb-6">
            <BannerAd />
          </div>
          
          <GridSection 
            title="Liked Songs" 
            description={`${likedSongs.length} songs saved in your library`} 
            icon={Heart}
            songs={likedSongs} 
            color="from-pink-500 to-rose-500" 
          />
        </div>

        {/* Empty State */}
        {mostPlayed.length === 0 && recentlyPlayed.length === 0 && likedSongs.length === 0 && trendingSongs.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Music2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Start Your Music Collection</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Search for your favorite tracks and discovery new songs to build your library!
            </p>
            <button
              onClick={() => navigate('/search')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-md text-sm"
            >
              Explore Songs
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