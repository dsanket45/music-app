// src/components/Player.jsx
import React, { useContext, useRef, useState, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { toggleLike, getLikedSongs } from "../utils/db";
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, ChevronUp, ChevronDown, Heart, Plus 
} from 'lucide-react';
import PlaylistModal from "./PlaylistModal";
import { youtubePlayer } from "../utils/youtubePlayer";

const Player = () => {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    nextSong,
    prevSong,
    shuffle,
    repeat,
    setShuffle,
    setRepeat,
    volume,
    handleSeek,
    handleVolumeChange,
  } = useContext(PlayerContext);

  const [expanded, setExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const progressRef = useRef(null);

  // Load and play current song
  useEffect(() => {
    if (!currentSong) return;

    const checkLiked = async () => {
      const liked = await getLikedSongs();
      setIsLiked(liked.some(s => s.songId === currentSong.songId));
    };
    checkLiked();

    const loadVideo = async () => {
      try {
        await youtubePlayer.playVideo(currentSong.videoId);
      } catch (err) {
        console.error("Error loading YouTube video:", err.message);
      }
    };
    loadVideo();

    youtubePlayer.onStateChange((state) => {
      if (state === 0) nextSong(); // Video ended
    });
  }, [currentSong]);

  // Play / pause control
  useEffect(() => {
    if (!youtubePlayer.isReady()) return;

    if (isPlaying) youtubePlayer.player.playVideo();
    else youtubePlayer.player.pauseVideo();
  }, [isPlaying]);

  // Volume control
  useEffect(() => {
    youtubePlayer.setVolume(volume);
  }, [volume]);

  // Update progress every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (youtubePlayer.isReady()) {
        setLocalCurrentTime(youtubePlayer.getCurrentTime());
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!currentSong) return null;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !youtubePlayer.isReady()) return;
    const rect = progressRef.current.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * youtubePlayer.getDuration();
    youtubePlayer.seekTo(newTime);
    handleSeek(newTime);
  };

  const handleLike = async () => {
    setLikeAnimation(true);
    const liked = await toggleLike(currentSong);
    setIsLiked(liked);
    setTimeout(() => setLikeAnimation(false), 600);
  };

  return (
    <>
      <div id="youtube-player-container" style={{ width: 0, height: 0 }}></div>

      {/* Mini Player */}
      {!expanded && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-30">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer group"
          >
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-200 relative"
              style={{
                width: `${youtubePlayer.getDuration() ? (localCurrentTime / youtubePlayer.getDuration()) * 100 : 0}%`,
              }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>

          <div className="p-3 flex items-center justify-between gap-3">
            {/* Song Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(true)}>
              <div className="relative group">
                <img
                  src={currentSong.thumbnail}
                  className="w-14 h-14 object-cover rounded-xl shadow-lg"
                  alt={currentSong.title}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-200 flex items-center justify-center">
                  <ChevronUp className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-900 dark:text-white text-sm font-medium line-clamp-1 hover:text-green-500 dark:hover:text-green-400 transition-colors">
                  {currentSong.title}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-1">
                  {currentSong.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); prevSong(); }} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/40">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextSong(); }} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            {/* Volume & Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={handleLike} className={`transition-all duration-300 p-2 rounded-full ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'} ${likeAnimation ? 'scale-125' : 'scale-100'}`}>
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => setShowPlaylistModal(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <Plus size={20} />
              </button>
              <button onClick={() => setShowVolume(!showVolume)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {showVolume && (
                <input type="range" min="0" max="100" value={volume} onChange={(e) => handleVolumeChange(parseInt(e.target.value))} className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer accent-green-500" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Player */}
      {expanded && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 backdrop-blur-xl bg-white/50 dark:bg-gray-900/50">
            <button onClick={() => setExpanded(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ChevronDown size={28} />
            </button>
            <h2 className="text-gray-900 dark:text-white text-sm font-medium uppercase tracking-wider">Now Playing</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleLike} className={`transition-all duration-300 p-2 rounded-full ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'} ${likeAnimation ? 'scale-125' : 'scale-100'}`}>
                <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => setShowPlaylistModal(true)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <Plus size={24} />
              </button>
            </div>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center px-8 py-8">
            <div className="relative max-w-md w-full aspect-square">
              <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover rounded-3xl shadow-2xl" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
          </div>

          {/* Song Info */}
          <div className="text-center px-8 mb-6">
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold mb-2 line-clamp-2">{currentSong.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">{currentSong.artist}</p>
          </div>

          {/* Progress */}
          <div className="px-8 mb-2">
            <div ref={progressRef} onClick={handleProgressClick} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group relative">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-200 relative" style={{ width: `${youtubePlayer.getDuration() ? (localCurrentTime / youtubePlayer.getDuration()) * 100 : 0}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs mt-2">
              <span>{formatTime(localCurrentTime)}</span>
              <span>{formatTime(youtubePlayer.getDuration())}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 px-8 mb-6">
            <button onClick={() => setShuffle(!shuffle)} className={`transition-all duration-200 p-3 rounded-full ${shuffle ? "text-green-500 bg-green-50 dark:bg-green-500/10" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              <Shuffle size={22} />
            </button>
            <button onClick={prevSong} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button onClick={togglePlayPause} className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-200 hover:scale-105 shadow-2xl shadow-green-500/40">
              {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextSong} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <SkipForward size={32} fill="currentColor" />
            </button>
            <button onClick={() => setRepeat(repeat === "all" ? "off" : repeat === "off" ? "one" : "all")} className={`transition-all duration-200 p-3 rounded-full ${repeat !== "off" ? "text-green-500 bg-green-50 dark:bg-green-500/10" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center gap-3 px-8 pb-8">
            <button onClick={() => handleVolumeChange(volume === 0 ? 50 : 0)}>
              {volume === 0 ? <VolumeX className="text-gray-600 dark:text-gray-400" size={20} /> : <Volume2 className="text-gray-600 dark:text-gray-400" size={20} />}
            </button>
            <input type="range" min="0" max="100" value={volume} onChange={(e) => handleVolumeChange(parseInt(e.target.value))} className="flex-1 max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer accent-green-500" />
            <span className="text-gray-600 dark:text-gray-400 text-sm w-10 text-right">{volume}</span>
          </div>
        </div>
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && <PlaylistModal song={currentSong} onClose={() => setShowPlaylistModal(false)} />}
    </>
  );
};

export default Player;
