// src/pages/LikedSongsPage.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { getLikedSongs, toggleLike, getPlaylists, addSongToPlaylist, getPreferences } from "../utils/db";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Player from "../components/Player";
import PlaylistModal from "../components/PlaylistModal";
import BannerAd from "../components/Ads/BannerAd";
import { Heart, Play, MoreVertical, PlusCircle, Trash2 } from 'lucide-react';

const LikedSongsPage = () => {
  const { setNewQueue } = useContext(PlayerContext);
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const prefs = await getPreferences();
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeDark = prefs.darkMode ?? systemPrefersDark;
      setDarkMode(activeDark);
      document.documentElement.classList.toggle('dark', activeDark);

      const songs = await getLikedSongs();
      setLikedSongs(songs);

      const pls = await getPlaylists();
      setPlaylists(pls);

      setLoading(false);
    };
    loadData();
  }, []);

  // Close menu if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setCurrentSong(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlayAll = () => {
    if (likedSongs.length > 0) setNewQueue(likedSongs);
  };

  const handleToggleLike = async (songId) => {
    await toggleLike({ songId });
    const songs = await getLikedSongs();
    setLikedSongs(songs);
    setCurrentSong(null);
  };

  const handleAddToPlaylist = async (playlistId, song) => {
    await addSongToPlaylist(playlistId, song);
    setCurrentSong(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-32 transition-colors duration-300`}>
      <Navbar />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Heart className="text-white" size={24} fill="currentColor" />
            </div>
            Liked Songs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg ml-15">
            {likedSongs.length} songs you love
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your liked songs...</p>
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/50">
              <Heart className="text-white" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Liked Songs Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Start building your collection by liking songs you love
            </p>
            <button
              onClick={() => window.location.href = '/search'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/40"
            >
              Discover Music
            </button>
             <div className="mb-8">
      <BannerAd />
    </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Collection</h2>
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/40"
              >
                <Play size={18} fill="currentColor" />
                <span className="hidden sm:inline">Play All</span>
              </button>
            </div>
             <div className="mb-8">
      <BannerAd />
    </div>

            {/* Vertical List of Songs */}
            <div className="flex flex-col gap-4">
              {likedSongs.map((song) => (
                <div key={song.songId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow hover:shadow-lg transition-all relative group min-w-0">
                  <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => setNewQueue([song])}>
                    <img src={song.thumbnail} alt={song.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{song.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm truncate hover:overflow-visible hover:whitespace-normal hover:text-clip transition-all duration-200">
                        {song.description}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 relative" ref={menuRef}>
                    <button onClick={() => setCurrentSong(currentSong?.songId === song.songId ? null : song)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <MoreVertical size={20} />
                    </button>

                    {currentSong?.songId === song.songId && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-slide-down">
                        <button
                          onClick={() => handleToggleLike(song.songId)}
                          className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          Remove from Liked
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        {playlists.map((pl) => (
                          <button
                            key={pl.id}
                            onClick={() => handleAddToPlaylist(pl.id, song)}
                            className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                          >
                            <PlusCircle className="w-4 h-4 text-green-500" />
                            Add to {pl.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedSong && showPlaylistModal && (
        <PlaylistModal song={selectedSong} onClose={() => setShowPlaylistModal(false)} />
      )}

      <BottomNav />
      <Player />
    </div>
  );
};

export default LikedSongsPage;
