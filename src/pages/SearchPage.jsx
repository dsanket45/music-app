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
    { title: "Bollywood Hits", color: "bg-emerald-700", q: "bollywood hits" },
    { title: "Romantic Melodies", color: "bg-rose-700", q: "romantic love songs" },
    { title: "Party & Dance", color: "bg-purple-700", q: "party dance" },
    { title: "Telugu / Tamil", color: "bg-blue-700", q: "telugu tamil top songs" },
    { title: "Punjabi Beats", color: "bg-amber-700", q: "punjabi top hits" },
    { title: "Arijit Singh", color: "bg-teal-700", q: "Arijit Singh" },
    { title: "Global Top 50", color: "bg-indigo-700", q: "top global hits" },
    { title: "Chill & Acoustic", color: "bg-cyan-800", q: "chill acoustic" },
  ];

  // Auto search on debounced query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchYouTube(query);
        setResults(data);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleCategoryClick = (catQuery) => {
    setQuery(catQuery);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col pb-36 font-sans">
      {/* Search Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md px-4 sm:px-6 py-4 space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Search
        </h1>

        {/* High-Contrast Search Input */}
        <div className="relative w-full max-w-2xl">
          <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B3B3B3]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full h-12 pl-11 pr-10 rounded-full bg-[#242424] text-white text-sm sm:text-base font-medium placeholder-[#B3B3B3] focus:outline-none focus:ring-2 focus:ring-white border border-[#333333] transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 max-w-7xl mx-auto w-full pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#1DB954]" />
            <p className="text-sm text-[#B3B3B3] mt-3 font-medium">Searching music...</p>
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
                  className={`relative ${cat.color} aspect-[1.3] rounded-lg p-4 overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-md flex items-start justify-between`}
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