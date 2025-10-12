// src/pages/SearchPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { searchYouTube } from "../utils/search.js";
import Navbar from "../components/Navbar.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import PlaylistModal from "../components/PlaylistModal.jsx";
import { Search, Play, Loader2, MoreVertical, X, Heart } from "lucide-react";
import { toggleLike, getLikedSongs } from "../utils/db";

const SEARCH_HISTORY_KEY = "searchHistory";
const MAX_HISTORY = 30;

const SearchPage = () => {
  const { setNewQueue } = useContext(PlayerContext);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    loadLikedSongs();
    loadSearchHistory();
  }, []);

  const loadLikedSongs = async () => {
    const liked = await getLikedSongs();
    setLikedSongs(liked.map(s => s.songId));
  };

  const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    setSearchHistory(history);
  };

  const saveToSearchHistory = (song) => {
    const history = [...searchHistory];
    const existingIndex = history.findIndex(s => s.songId === song.songId);
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    history.unshift(song);
    if (history.length > MAX_HISTORY) history.pop();
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    setSearchHistory(history);
  };

  const removeFromHistory = (songId) => {
    const newHistory = searchHistory.filter(s => s.songId !== songId);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const songs = await searchYouTube(query);
    setResults(songs);
    setLoading(false);
  };

  const handlePlayAll = () => {
    if (results.length > 0) setNewQueue(results);
    results.forEach(song => saveToSearchHistory(song));
  };

  const handlePlaySong = (song) => {
    setNewQueue([song]);
    saveToSearchHistory(song);
  };

  const handleToggleLike = async (song) => {
    const liked = await toggleLike(song);
    if (liked) {
      setLikedSongs([...likedSongs, song.songId]);
    } else {
      setLikedSongs(likedSongs.filter(id => id !== song.songId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-32">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Search className="text-white" size={24} />
            </div>
            Search Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg ml-15">
            Find your favorite songs, artists, and albums
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, artists, or moods..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-green-500/40"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Search"}
            </button>
          </div>
        </form>

        {/* Search Results or History */}
        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((song) => (
              <div key={song.songId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 shadow hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => handlePlaySong(song)}>
                  <img src={song.thumbnail} alt={song.title} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium line-clamp-1">{song.title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleLike(song)} className={`p-2 rounded-full transition ${likedSongs.includes(song.songId) ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                    <Heart size={20} fill={likedSongs.includes(song.songId) ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => { setSelectedSong(song); setShowPlaylistModal(true); }} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            // Show search history if no results
            searchHistory.map((song) => (
              <div key={song.songId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 shadow hover:shadow-lg transition-all">
                <div className="flex items-center gap-3">
                  <img src={song.thumbnail} alt={song.title} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium line-clamp-1">{song.title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                  </div>
                </div>
                <button onClick={() => removeFromHistory(song.songId)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Playlist Modal */}
      {showPlaylistModal && selectedSong && (
        <PlaylistModal song={selectedSong} onClose={() => setShowPlaylistModal(false)} />
      )}

      <BottomNav />
      <Player />
    </div>
  );
};

export default SearchPage;
