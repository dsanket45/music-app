import React, { useState, useContext, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { searchYouTube } from "../utils/search.js";
import Navbar from "../components/Navbar.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import PlaylistModal from "../components/PlaylistModal.jsx";
import BannerAd from "../components/Ads/BannerAd.jsx";
import { Search, Play, Loader2, MoreVertical, X, Heart, WifiOff, AlertCircle, Music } from "lucide-react";
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
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

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

  const removeFromHistory = (songId, e) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(s => s.songId !== songId);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setUsingFallback(false);
    
    try {
      const songs = await searchYouTube(query, {
        enforceLanguage: true,
        minDuration: 120,
        prioritizeOfficial: true,
        maxResults: 12
      });
      
      setResults(songs);
      
      // Check if we're using fallback results (all songs are from local database)
      if (songs.length > 0) {
        setUsingFallback(true);
      }
      
    } catch (error) {
      console.error("Search failed:", error);
      setError("Search service is temporarily unavailable. Using offline music library.");
      setUsingFallback(true);
      
      // Even if search fails, try to get local results
      try {
        const localResults = await searchYouTube(query, {
          enforceLanguage: true,
          minDuration: 120,
          prioritizeOfficial: true,
          maxResults: 12
        });
        setResults(localResults);
      } catch (fallbackError) {
        setResults([]);
      }
    }
    setLoading(false);
  };

  const handlePlaySong = (song) => {
    setNewQueue([song], 0, true);
    saveToSearchHistory(song);
  };

  const handleToggleLike = async (song, e) => {
    e.stopPropagation();
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

      <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Search className="text-white" size={20} />
            </div>
            Search Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg ml-12">
            Find your favorite songs, artists, and albums
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="relative">
            <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 pr-3 shadow-xl">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
                placeholder="Search songs, artists, or moods..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none py-2 pl-4 min-w-0"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={loading ? "Searching..." : "Search"}
                title={loading ? "Searching..." : "Search"}
              >
                {loading ? (
                  <Loader2 className="animate-spin text-green-500" size={20} />
                ) : (
                  <Search size={20} />
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Fallback Mode Indicator */}
        {usingFallback && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
            <Music className="text-blue-500 flex-shrink-0" size={20} />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">Offline Mode</p>
              <p className="text-blue-600 dark:text-blue-300 text-sm">
                Showing songs from local library. Full search will be available later.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !usingFallback && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">Service Notice</p>
              <p className="text-yellow-600 dark:text-yellow-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Network Warning */}
        {navigator.onLine === false && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-3">
            <WifiOff className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">You're offline</p>
              <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                Using offline music library. Connect to internet for full features.
              </p>
            </div>
          </div>
        )}

        {/* Search Results or History */}
        <div className="space-y-3">
          {results.length > 0 ? (
            // Search Results
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {usingFallback ? "Available Songs" : `Search Results (${results.length})`}
                </h3>
                {usingFallback && (
                  <div className="text-sm text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                    Offline Library
                  </div>
                )}
              </div>
              
              {results.map((song, index) => (
                <div
                  key={song.songId}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 shadow hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handlePlaySong(song)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-200 flex items-center justify-center">
                        <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} fill="currentColor" />
                      </div>
                      {song.isOfficial && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium line-clamp-1">{song.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{song.duration}</span>
                        {song.isOfficial && (
                          <span className="text-xs text-green-500 bg-green-50 dark:bg-green-900/30 px-1 rounded">
                            Official
                          </span>
                        )}
                        {song.language && (
                          <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded capitalize">
                            {song.language}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleLike(song, e)}
                      className={`p-2 rounded-full transition-all ${
                        likedSongs.includes(song.songId)
                          ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                          : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      }`}
                      aria-label={likedSongs.includes(song.songId) ? "Remove from favorites" : "Add to favorites"}
                      title={likedSongs.includes(song.songId) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        size={18}
                        fill={likedSongs.includes(song.songId) ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSong(song);
                        setShowPlaylistModal(true);
                      }}
                      className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Add to playlist"
                      title="Add to playlist"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : searchHistory.length > 0 && !loading ? (
            // Search History (when no results)
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recently Played
              </h3>
               <div className="mb-8">
      <BannerAd />
    </div>
              {searchHistory.map((song) => (
                <div
                  key={song.songId}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 shadow hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handlePlaySong(song)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-200 flex items-center justify-center">
                        <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium line-clamp-1">{song.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">Previously played</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => removeFromHistory(song.songId, e)}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-1 group-hover:opacity-100"
                    aria-label="Remove from history"
                    title="Remove from history"
                  >
                    <X size={18} />
                  </button>
                  
                </div>
              ))}
            </>
          ) : !loading && !error ? (
            // Empty state
            <div className="text-center py-12">
              <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">Search for songs to get started</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                We'll show you high-quality, full-length songs from official channels
              </p>
               <div className="mb-8">
      <BannerAd />
    </div>
            </div>
            
          ) : null}
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