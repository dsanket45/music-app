// src/components/Player.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { toggleLike, getLikedSongs } from "../utils/db";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ChevronDown, Heart, Maximize2
} from "lucide-react";
import { nativeAudioEngine } from "../utils/nativeAudioEngine";

const Player = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
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
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const progressBarRef = useRef(null);

  // Sync like state
  useEffect(() => {
    if (!currentSong) return;
    let mounted = true;
    const checkLiked = async () => {
      const liked = await getLikedSongs();
      if (mounted) {
        setIsLiked(liked.some(s => s.songId === currentSong.songId || s.id === currentSong.id));
      }
    };
    checkLiked();
    return () => { mounted = false; };
  }, [currentSong]);

  // Sync time
  useEffect(() => {
    if (!isDragging) {
      setLocalCurrentTime(currentTime);
    }
  }, [currentTime, isDragging]);

  if (!currentSong) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    const liked = await toggleLike(currentSong);
    setIsLiked(liked);
  };

  const handleScrubberClick = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * (duration || currentSong.durationSec || 210);
    setLocalCurrentTime(newTime);
    handleSeek(newTime);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(prevVolume || 80);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      handleVolumeChange(0);
      setIsMuted(true);
    }
  };

  const progressPercent = duration > 0 ? (localCurrentTime / duration) * 100 : 0;

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 SPOTIFY MOBILE FULL-SCREEN PLAYER MODAL                               */}
      {/* ========================================================================= */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#282828] via-[#121212] to-[#121212] flex flex-col justify-between p-6 animate-in slide-in-from-bottom duration-300">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-[#B3B3B3] pt-4">
            <button
              onClick={() => setExpanded(false)}
              className="p-2 hover:text-white transition-colors"
              aria-label="Close Full Player"
            >
              <ChevronDown size={28} />
            </button>
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B3B3B3]">
                Playing From Album
              </span>
              <p className="text-xs font-bold text-white truncate max-w-[200px]">
                {currentSong.album || 'Single'}
              </p>
            </div>
            <button onClick={handleLike} className="p-2" aria-label="Like Song">
              <Heart
                size={22}
                className={isLiked ? "text-[#1DB954] fill-[#1DB954]" : "text-[#B3B3B3]"}
              />
            </button>
          </div>

          {/* Large Square Artwork */}
          <div className="flex items-center justify-center my-auto px-4">
            <div className="w-full max-w-[340px] aspect-square rounded-xl overflow-hidden shadow-2xl shadow-black/80">
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Song Info & Controls */}
          <div className="space-y-6 pb-6">
            {/* Title & Artist */}
            <div className="flex items-center justify-between">
              <div className="truncate pr-4">
                <h2 className="text-2xl font-bold text-white truncate">{currentSong.title}</h2>
                <p className="text-base text-[#B3B3B3] truncate mt-1">{currentSong.artist}</p>
              </div>
              <button onClick={handleLike} className="p-2">
                <Heart
                  size={26}
                  className={isLiked ? "text-[#1DB954] fill-[#1DB954]" : "text-[#B3B3B3]"}
                />
              </button>
            </div>

            {/* Progress Scrubber */}
            <div className="space-y-2">
              <div
                ref={progressBarRef}
                onClick={handleScrubberClick}
                className="relative h-1.5 w-full bg-[#4D4D4D] rounded-full cursor-pointer group"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#B3B3B3] font-medium">
                <span>{formatTime(localCurrentTime)}</span>
                <span>{formatTime(duration || currentSong.durationSec || 210)}</span>
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`p-2 transition-colors ${shuffle ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}`}
              >
                <Shuffle size={20} />
              </button>

              <button
                onClick={prevSong}
                className="text-white hover:text-[#1DB954] transition-colors p-2"
              >
                <SkipBack size={32} fill="currentColor" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
              >
                {isPlaying ? (
                  <Pause size={28} fill="#000000" className="text-black" />
                ) : (
                  <Play size={28} fill="#000000" className="text-black ml-1" />
                )}
              </button>

              <button
                onClick={nextSong}
                className="text-white hover:text-[#1DB954] transition-colors p-2"
              >
                <SkipForward size={32} fill="currentColor" />
              </button>

              <button
                onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
                className={`p-2 transition-colors ${repeat !== "off" ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}`}
              >
                {repeat === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎵 SPOTIFY BOTTOM MINI PLAYER BAR                                        */}
      {/* ========================================================================= */}
      <div
        className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-[#181818] border-t border-[#282828] px-4 py-2.5 flex items-center justify-between shadow-2xl"
        onClick={() => setExpanded(true)}
      >
        {/* Left: Artwork + Title + Artist */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 md:flex-initial md:w-1/4">
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-12 h-12 rounded object-cover flex-shrink-0 shadow-md"
          />
          <div className="min-w-0 pr-2">
            <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
              {currentSong.title}
            </h4>
            <p className="text-xs text-[#B3B3B3] truncate hover:underline cursor-pointer">
              {currentSong.artist}
            </p>
          </div>
          <button
            onClick={handleLike}
            className="hidden sm:flex p-1.5 hover:scale-110 transition-transform"
            aria-label="Like"
          >
            <Heart
              size={18}
              className={isLiked ? "text-[#1DB954] fill-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}
            />
          </button>
        </div>

        {/* Center: Controls & Scrubber (Desktop) / Quick Play (Mobile) */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-2">
          {/* Main Buttons */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); setShuffle(!shuffle); }}
              className={`hidden sm:block transition-colors ${shuffle ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}`}
            >
              <Shuffle size={16} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevSong(); }}
              className="text-[#B3B3B3] hover:text-white transition-colors"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center shadow"
            >
              {isPlaying ? (
                <Pause size={16} fill="#000000" className="text-black" />
              ) : (
                <Play size={16} fill="#000000" className="text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); nextSong(); }}
              className="text-[#B3B3B3] hover:text-white transition-colors"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off");
              }}
              className={`hidden sm:block transition-colors ${repeat !== "off" ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}`}
            >
              {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          {/* Desktop Scrubber Progress Bar */}
          <div
            className="hidden md:flex items-center gap-2.5 w-full mt-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-[#B3B3B3] min-w-[35px] text-right font-medium">
              {formatTime(localCurrentTime)}
            </span>
            <div
              ref={progressBarRef}
              onClick={handleScrubberClick}
              className="relative h-1 flex-1 bg-[#4D4D4D] rounded-full cursor-pointer group"
            >
              <div
                className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-[#B3B3B3] min-w-[35px] font-medium">
              {formatTime(duration || currentSong.durationSec || 210)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Expand */}
        <div
          className="hidden md:flex items-center justify-end gap-3 w-1/4"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={toggleMute} className="text-[#B3B3B3] hover:text-white">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-24 h-1 bg-[#4D4D4D] accent-[#1DB954] rounded-lg cursor-pointer"
          />
          <button
            onClick={() => setExpanded(true)}
            className="text-[#B3B3B3] hover:text-white ml-2"
            aria-label="Expand"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Player;