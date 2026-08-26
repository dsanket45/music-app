// src/pages/SearchPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { searchYouTube } from "../utils/search.js";
import BottomNav from "../components/BottomNav.jsx";
import Player from "../components/Player.jsx";
import SongCard from "../components/SongCard.jsx";
import { Search, X, Loader2 } from "lucide-react";

const SearchPage = () => {
  const { setNewQueue } = useContext(PlayerContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { title: "Pop", color: "bg-pink-600", q: "top pop songs" },
    { title: "Bollywood", color: "bg-emerald-600", q: "latest bollywood hits" },
    { title: "Romantic", color: "bg-red-600", q: "best romantic songs" },
    { title: "Party & Dance", color: "bg-purple-600", q: "party dance songs" },
    { title: "Punjabi Hits", color: "bg-amber-600", q: "top punjabi songs" },
    { title: "Tamil / Telugu", color: "bg-blue-600", q: "south indian top hits" },
    { title: "Hip-Hop", color: "bg-orange-600", q: "hip hop hits" },
    { title: "Chill & Acoustic", color: "bg-teal-600", q: "chill acoustic songs" },
  ];

  const handleSearch = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await searchYouTube(searchQuery);
      setResults(data);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleCategoryClick = (catQuery) => {
    setQuery(catQuery);
    handleSearch(catQuery);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col pb-36 font-sans">
      {/* Top Header & Search Bar */}
      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md px-4 sm:px-6 py-4 space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Search
        </h1>

        {/* Spotify Search Bar */}
        <div className="relative w-full max-w-2xl">
          <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to listen to?"
            className="w-full h-12 pl-11 pr-10 rounded-full bg-white text-black text-sm sm:text-base font-medium placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white shadow-md"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 max-w-7xl mx-auto w-full pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#1DB954]" />
            <p className="text-sm text-[#B3B3B3] mt-3 font-medium">Searching songs...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Top Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((song) => (
                <SongCard key={song.songId || song.id} song={song} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategoryClick(cat.q)}
                  className={`relative ${cat.color} aspect-[1.3] rounded-lg p-3 sm:p-4 overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-md flex items-start justify-between`}
                >
                  <span className="text-base sm:text-lg font-black text-white leading-tight">
                    {cat.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Player />
      <BottomNav />
    </div>
  );
};

export default SearchPage;