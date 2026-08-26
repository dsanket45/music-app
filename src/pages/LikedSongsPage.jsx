// src/pages/LikedSongsPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { getLikedSongs } from "../utils/db.js";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import SongCard from "../components/SongCard.jsx";
import { Heart, Play, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LikedSongsPage = () => {
  const { setNewQueue } = useContext(PlayerContext);
  const navigate = useNavigate();
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLiked = async () => {
      try {
        const songs = await getLikedSongs();
        setLikedSongs(songs);
      } catch (e) {
        console.error("Error loading liked songs:", e);
      } finally {
        setLoading(false);
      }
    };
    loadLiked();
  }, []);

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      setNewQueue(likedSongs, 0);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col pb-36 font-sans">
      {/* Spotify Liked Songs Hero Header */}
      <div className="relative bg-gradient-to-b from-indigo-900 via-[#181818] to-[#121212] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 shadow-xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-md bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-400 flex items-center justify-center shadow-2xl flex-shrink-0">
          <Heart size={64} fill="white" className="text-white drop-shadow-lg" />
        </div>

        <div className="flex flex-col text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-[#B3B3B3]">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-1 mb-2">
            Liked Songs
          </h1>
          <p className="text-sm text-[#B3B3B3] font-medium">
            {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
      </div>

      {/* Main Action Bar & Songs List */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        {likedSongs.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ED760] hover:scale-105 transition-all flex items-center justify-center shadow-xl"
              aria-label="Play Liked Songs"
            >
              <Play size={24} fill="#000000" className="text-black ml-1" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-[#B3B3B3]">Loading your library...</div>
        ) : likedSongs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {likedSongs.map((song) => (
              <SongCard key={song.songId || song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#282828] flex items-center justify-center text-[#B3B3B3]">
              <Music size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">Songs you like will appear here</h3>
            <p className="text-xs text-[#B3B3B3] max-w-xs">
              Save songs by tapping the heart icon while exploring or playing songs.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
            >
              Find Songs
            </button>
          </div>
        )}
      </main>

      <Player />
      <BottomNav />
    </div>
  );
};

export default LikedSongsPage;
