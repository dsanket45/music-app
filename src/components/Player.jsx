// src/components/Player.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { toggleLike, getLikedSongs, saveDownloadedSong } from "../utils/db";
import BannerAd from "./Ads/BannerAd";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ChevronUp, ChevronDown, Heart, Plus, 
  Mic2, ListMusic, Laptop2, ArrowDownToLine
} from "lucide-react";
import PlaylistModal from "./PlaylistModal";
import { youtubePlayer } from "../utils/youtubePlayer";
import InstallPrompt from "./InstallPrompt";

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
    queue,
    currentIndex,
    isLocalPlayback,
    localAudioUrl,
    setIsLocalPlayback
  } = useContext(PlayerContext);

  const [expanded, setExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isSongChanging, setIsSongChanging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [toast, setToast] = useState(null);

  const progressRef = useRef(null);
  const songChangeTimeout = useRef(null);
  const audioRef = useRef(null);

  // Detect if installed PWA
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();
    window.addEventListener('resize', checkInstalled);
    return () => window.removeEventListener('resize', checkInstalled);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!currentSong) return;
    let mounted = true;
    const checkLiked = async () => {
      const liked = await getLikedSongs();
      if (mounted) setIsLiked(liked.some(s => s.songId === currentSong.songId));
    };
    checkLiked();
    return () => (mounted = false);
  }, [currentSong]);

  // Handle local audio time
  useEffect(() => {
    if (isLocalPlayback && audioRef.current) {
      const update = () => setLocalCurrentTime(audioRef.current.currentTime);
      audioRef.current.addEventListener('timeupdate', update);
      return () => audioRef.current?.removeEventListener('timeupdate', update);
    }
  }, [isLocalPlayback]);

  // Handle YouTube time
  useEffect(() => {
    if (!isLocalPlayback) {
      const interval = setInterval(() => {
        if (youtubePlayer.isReady() && !isDragging) {
          const t = youtubePlayer.getCurrentTime();
          if (!isNaN(t)) setLocalCurrentTime(t);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLocalPlayback, isDragging]);

  // When song changes
  useEffect(() => {
    if (!currentSong) return;
    setIsSongChanging(true);
    setLocalCurrentTime(0);
    if (songChangeTimeout.current) clearTimeout(songChangeTimeout.current);
    const start = Date.now();
    const checkReady = () => {
      try {
        if (youtubePlayer.isReady() && youtubePlayer.getDuration() > 0) {
          setIsSongChanging(false);
        } else if (Date.now() - start > 6000) {
          setIsSongChanging(false);
        } else {
          songChangeTimeout.current = setTimeout(checkReady, 200);
        }
      } catch (e) {
        setIsSongChanging(false);
      }
    };
    checkReady();
    return () => {
      if (songChangeTimeout.current) clearTimeout(songChangeTimeout.current);
    };
  }, [currentSong]);

  if (!currentSong) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (isLocalPlayback && audioRef.current) {
      const newTime = percent * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
    } else if (youtubePlayer.isReady()) {
      const newTime = percent * youtubePlayer.getDuration();
      youtubePlayer.seekTo(newTime);
      setLocalCurrentTime(newTime);
      handleSeek(newTime);
    }
  };

  const handleProgressDrag = (e) => {
    if (!progressRef.current) return;
    setIsDragging(true);
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isLocalPlayback && audioRef.current) {
      const newTime = percent * audioRef.current.duration;
      setLocalCurrentTime(newTime);
    } else if (youtubePlayer.isReady()) {
      const newTime = percent * youtubePlayer.getDuration();
      setLocalCurrentTime(newTime);
    }
  };

  const endDrag = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isLocalPlayback && audioRef.current) {
      const newTime = percent * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    } else if (youtubePlayer.isReady()) {
      const newTime = percent * youtubePlayer.getDuration();
      youtubePlayer.seekTo(newTime);
      handleSeek(newTime);
    }
  };

  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    setLikeAnimation(true);
    const liked = await toggleLike(currentSong);
    setIsLiked(liked);
    setTimeout(() => setLikeAnimation(false), 600);
  };

  const handleNextClick = async (e) => {
    e.stopPropagation();
    setIsSongChanging(true);
    try {
      await nextSong();
    } catch (err) {
      console.error("Error on nextSong:", err);
      setIsSongChanging(false);
      showTemporaryToast("Unable to skip to next track");
    }
  };

  const handlePrevClick = async (e) => {
    e.stopPropagation();
    setIsSongChanging(true);
    try {
      await prevSong();
    } catch (err) {
      console.error("Error on prevSong:", err);
      setIsSongChanging(false);
      showTemporaryToast("Unable to go to previous track");
    }
  };

  const handlePlayPauseClick = (e) => {
    e.stopPropagation();
    if (isLocalPlayback && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      togglePlayPause();
    }
  };

  const getDuration = () => {
    if (isLocalPlayback && audioRef.current) {
      return audioRef.current.duration || 0;
    }
    return youtubePlayer.getDuration() || 0;
  };

  const progressPercent = getDuration() ? (localCurrentTime / getDuration()) * 100 : 0;

  function showTemporaryToast(message, ms = 2500) {
    setToast(message);
    setTimeout(() => setToast(null), ms);
  }

  async function streamDownloadToBlob(response, onProgress) {
    if (!response.body) {
      const blob = await response.blob();
      onProgress && onProgress(100);
      return blob;
    }
    const reader = response.body.getReader();
    const contentLength = +response.headers.get("Content-Length") || 0;
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength) {
        onProgress && onProgress(Math.round((received / contentLength) * 100));
      } else {
        onProgress && onProgress(Math.min(95, Math.round(received / 1000000)));
      }
    }
    const blob = new Blob(chunks, { type: response.headers.get("Content-Type") || "audio/mpeg" });
    onProgress && onProgress(100);
    return blob;
  }

  const handleDownload = async (e) => {
    if (e) e.stopPropagation();
    if (!currentSong || isDownloading) return;

    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
    if (!isAppInstalled) {
      setShowInstallPrompt(true);
      return;
    }

    // 🔴 CRITICAL: You need audioUrl for this to work
    if (!currentSong.audioUrl) {
      showTemporaryToast("Download not available for YouTube tracks");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    showTemporaryToast(`Downloading "${currentSong.title}"`);

    try {
      const response = await fetch(currentSong.audioUrl);
      if (!response.ok) throw new Error("Network error");

      const blob = await streamDownloadToBlob(response, setDownloadProgress);

      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `${sanitizeFileName(currentSong.title)}.mp3`,
          types: [{ description: "MP3 Audio", accept: { "audio/mpeg": [".mp3"] } }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        // ✅ Save handle for later
        await saveDownloadedSong(currentSong, fileHandle);
        showTemporaryToast("Saved! View in Offline Library.");
      } else {
        await fallbackAnchorDownload(blob, `${sanitizeFileName(currentSong.title)}.mp3`);
        showTemporaryToast("Downloaded via browser");
      }
    } catch (err) {
      console.error("Download failed:", err);
      if (err.name === 'AbortError') {
        showTemporaryToast("Download cancelled");
      } else {
        showTemporaryToast("Download failed");
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  async function fallbackAnchorDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function sanitizeFileName(name = "song") {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, 150);
  }

  // Hidden audio element for local playback
  const LocalAudioElement = () => (
    <audio
      ref={audioRef}
      src={localAudioUrl}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={nextSong}
      style={{ display: 'none' }}
    />
  );

  // Mobile Mini Player
  const MobileMiniPlayer = () => (
    <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 backdrop-blur-xl z-40 shadow-xl transition-all duration-300">
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseDown={handleProgressDrag}
        onMouseMove={isDragging ? handleProgressDrag : null}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="w-full h-1 bg-slate-200 dark:bg-slate-700 cursor-pointer group relative"
      >
        <div
          className="h-full bg-emerald-500 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
      <div className="px-3 py-2 flex items-center justify-between gap-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative group flex-shrink-0">
            <img
              src={currentSong.thumbnail}
              className="w-10 h-10 object-cover rounded-lg shadow-md border border-slate-200/60 dark:border-slate-700"
              alt={currentSong.title}
            />
            <div 
              className="absolute inset-0 bg-slate-900/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
              onClick={() => setExpanded(true)}
            >
              <ChevronUp size={14} />
            </div>
          </div>
          <div 
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            <p className="text-slate-900 dark:text-white text-xs font-semibold line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {currentSong.title}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
              {currentSong.artist}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button 
            onClick={handlePrevClick}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <SkipBack size={18} />
          </button>
          <button 
            onClick={handlePlayPauseClick}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 transition-all shadow-md flex-shrink-0"
          >
            {isPlaying ? 
              <Pause size={14} fill="currentColor" /> : 
              <Play size={14} fill="currentColor" className="ml-0.5" />
            }
          </button>
          <button 
            onClick={handleNextClick}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <SkipForward size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isSongChanging && (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );

  // Desktop Mini Player
  const DesktopMiniPlayer = () => (
    <div 
      className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 backdrop-blur-xl z-40 shadow-xl cursor-pointer text-slate-900 dark:text-white transition-all duration-300"
      onClick={() => setExpanded(true)}
    >
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseDown={handleProgressDrag}
        onMouseMove={isDragging ? handleProgressDrag : null}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="w-full h-1 bg-gray-700 cursor-pointer group relative"
      >
        <div
          className="h-full bg-green-500 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src={currentSong.thumbnail}
            className="w-14 h-14 object-cover rounded shadow-lg"
            alt={currentSong.title}
          />
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium line-clamp-1">
              {currentSong.title}
            </p>
            <p className="text-gray-400 text-sm line-clamp-1">
              {currentSong.artist}
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleLike(e); }}
            className={`p-2 rounded-full transition-all duration-300 ${
              isLiked ? 'text-green-500' : 'text-gray-400 hover:text-white'
            } ${likeAnimation ? 'scale-110' : 'scale-100'}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="flex flex-col items-center flex-1 max-w-md">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setShuffle(!shuffle); }}
              className={`p-1 rounded-full transition-colors ${shuffle ? "text-green-500" : "text-gray-400 hover:text-white"}`}
            >
              <Shuffle size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrevClick(e); }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handlePlayPauseClick(e); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNextClick(e); }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setRepeat(repeat === "all" ? "off" : repeat === "off" ? "one" : "all"); }}
              className={`p-1 rounded-full transition-colors ${repeat !== "off" ? "text-green-500" : "text-gray-400 hover:text-white"}`}
            >
              {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ListMusic size={18} />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Connect to device"
            onClick={(e) => e.stopPropagation()}
          >
            <Laptop2 size={18} />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleVolumeChange(volume === 0 ? 50 : 0); }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="w-20">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => { e.stopPropagation(); handleVolumeChange(parseInt(e.target.value)); }}
                className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-green-500"
              />
            </div>
            {/* Download button - only in installed PWA */}
            {isInstalled && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(e); }}
                  className={`p-2 rounded-full transition-colors ${isDownloading ? 'text-gray-400' : 'text-gray-400 hover:text-white'}`}
                  title="Download this song"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowDownToLine size={18} />
                  )}
                </button>
                {isDownloading && (
                  <div className="absolute -bottom-2 left-0 right-0 h-1 rounded overflow-hidden">
                    <div style={{ width: `${downloadProgress}%` }} className="h-full bg-green-500 transition-[width] duration-200" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Expanded Player
  const MobileExpandedPlayer = () => (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex flex-col overflow-hidden">
      <div 
        className="absolute inset-0 opacity-20 blur-3xl scale-150"
        style={{ backgroundImage: `url(${currentSong.thumbnail})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80"></div>
      <div className="relative z-10 flex flex-col h-full w-full">
        <div className="flex justify-between items-center p-6">
          <button 
            onClick={() => setExpanded(false)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <ChevronDown size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-white text-sm font-medium uppercase tracking-wider">Now Playing</h2>
            <p className="text-gray-400 text-xs">From your library</p>
          </div>
          <div className="flex items-center gap-2">
            {isInstalled && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(e); }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                disabled={isDownloading}
                title="Download this song"
              >
                {isDownloading ? <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <ArrowDownToLine size={18} />}
              </button>
            )}
            <button 
              onClick={() => setShowPlaylistModal(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <ListMusic size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-4">
          <div className="relative w-full max-w-sm aspect-square mb-8">
            <div className="w-full max-w-sm mb-6">
  <BannerAd />
</div>
            <div className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden">
              <img 
                src={currentSong.thumbnail} 
                alt={currentSong.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className={`absolute inset-0 bg-black/10 ${isPlaying ? 'animate-pulse-slow' : ''}`}></div>
            <div className={`absolute inset-0 rounded-3xl border-8 border-white/5 ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '20s' }}></div>
          </div>
          
          <div className="text-center w-full max-w-md mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <button 
                onClick={handleLike}
                className={`p-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                  isLiked ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'
                } ${likeAnimation ? 'scale-110' : 'scale-100'}`}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-white text-2xl font-bold mb-2 line-clamp-2 px-2">
                  {currentSong.title}
                </h1>
                <p className="text-gray-400 text-lg line-clamp-1">
                  {currentSong.artist}
                </p>
              </div>
              <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="w-full max-w-md px-4 mb-6">
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              onMouseDown={handleProgressDrag}
              onMouseMove={isDragging ? handleProgressDrag : null}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              className="w-full h-1 bg-gray-700 rounded-full cursor-pointer group relative mb-2"
            >
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-100 relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>{formatTime(localCurrentTime)}</span>
              <span>{formatTime(getDuration())}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 px-4 mb-8">
            <button 
              onClick={() => setShuffle(!shuffle)}
              className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                shuffle ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-white"
              }`}
            >
              <Shuffle size={18} />
            </button>
            <button 
              onClick={handlePrevClick}
              className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <SkipBack size={20} />
            </button>
            <button 
              onClick={handlePlayPauseClick}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 text-black shadow-2xl hover:scale-105 transition-transform flex-shrink-0"
            >
              {isPlaying ? 
                <Pause size={24} fill="currentColor" /> : 
                <Play size={24} fill="currentColor" />
              }
            </button>
            <button 
              onClick={handleNextClick}
              className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <SkipForward size={20} />
            </button>
            <button 
              onClick={() => setRepeat(repeat === "all" ? "off" : repeat === "off" ? "one" : "all")}
              className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                repeat !== "off" ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-white"
              }`}
            >
              {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          <div className="flex items-center justify-between w-full max-w-md px-4 pb-8 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                <Mic2 size={16} />
              </button>
              <button className="p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                <ListMusic size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Connect to device"
              >
                <Laptop2 size={16} />
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleVolumeChange(volume === 0 ? 50 : 0)}
                  className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <div className="w-24">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume} 
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer accent-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop Expanded Player
  const DesktopExpandedPlayer = () => (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex">
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="relative w-full max-w-lg aspect-square">
          <div className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden">
            <img 
              src={currentSong.thumbnail} 
              alt={currentSong.title} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className={`absolute inset-0 bg-black/10 ${isPlaying ? 'animate-pulse-slow' : ''}`}></div>
          <div className={`absolute inset-0 rounded-3xl border-12 border-white/5 ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '20s' }}></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between p-12 bg-gradient-to-l from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setExpanded(false)}
            className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <ChevronDown size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-white text-lg font-medium uppercase tracking-wider">Now Playing</h2>
            <p className="text-gray-400 text-sm">From your library</p>
          </div>
          <div className="flex items-center gap-3">
            {isInstalled && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(e); }}
                  className={`p-3 rounded-full transition-colors ${isDownloading ? 'text-gray-400' : 'text-gray-400 hover:text-white'}`}
                  title="Download this song"
                  disabled={isDownloading}
                >
                  {isDownloading ? <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <ArrowDownToLine size={20} />}
                </button>
                {isDownloading && (
                  <div className="absolute -bottom-3 left-0 right-0 h-1 rounded overflow-hidden">
                    <div style={{ width: `${downloadProgress}%` }} className="h-full bg-green-500 transition-[width] duration-200" />
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={() => setShowPlaylistModal(true)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <ListMusic size={20} />
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <button 
              onClick={handleLike}
              className={`p-3 rounded-full transition-all duration-300 ${
                isLiked ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'
              } ${likeAnimation ? 'scale-110' : 'scale-100'}`}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <div className="flex-1 min-w-0 max-w-2xl">
              <h1 className="text-white text-4xl font-bold mb-4 line-clamp-2">
                {currentSong.title}
              </h1>
              <p className="text-gray-400 text-2xl line-clamp-1">
                {currentSong.artist}
              </p>
            </div>
            <button className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="w-full max-w-2xl mx-auto mb-8">
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            onMouseDown={handleProgressDrag}
            onMouseMove={isDragging ? handleProgressDrag : null}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer group relative mb-3"
          >
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-100 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
          <div className="flex justify-between text-gray-400 text-base">
            <span>{formatTime(localCurrentTime)}</span>
            <span>{formatTime(getDuration())}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-8 mb-12">
          <button 
            onClick={() => setShuffle(!shuffle)}
            className={`p-4 rounded-full transition-colors ${
              shuffle ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-white"
            }`}
          >
            <Shuffle size={22} />
          </button>
          <button 
            onClick={handlePrevClick}
            className="p-4 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <SkipBack size={24} />
          </button>
          <button 
            onClick={handlePlayPauseClick}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 text-black shadow-2xl hover:scale-105 transition-transform"
          >
            {isPlaying ? 
              <Pause size={28} fill="currentColor" /> : 
              <Play size={28} fill="currentColor" />
            }
          </button>
          <button 
            onClick={handleNextClick}
            className="p-4 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <SkipForward size={24} />
          </button>
          <button 
            onClick={() => setRepeat(repeat === "all" ? "off" : repeat === "off" ? "one" : "all")}
            className={`p-4 rounded-full transition-colors ${
              repeat !== "off" ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-white"
            }`}
          >
            {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </button>
        </div>
      </div>
    </div>
  );

  const SongChangingOverlay = () => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-white text-sm">Loading the track…</div>
      </div>
    </div>
  );

  return (
    <>
      <div id="youtube-player-container" style={{ width: 0, height: 0 }}></div>
      {isLocalPlayback && <LocalAudioElement />}
      {!expanded && currentSong && (isMobile ? <MobileMiniPlayer /> : <DesktopMiniPlayer />)}
      {expanded && currentSong && (isMobile ? <MobileExpandedPlayer /> : <DesktopExpandedPlayer />)}
      {isSongChanging && <SongChangingOverlay />}
      {showPlaylistModal && <PlaylistModal song={currentSong} onClose={() => setShowPlaylistModal(false)} />}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-32 z-60 bg-black/80 text-white px-4 py-2 rounded-md shadow-lg">
          {toast}
        </div>
      )}
      {showInstallPrompt && <InstallPrompt />}
      <style jsx>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.3; } }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .border-12 { border-width: 12px; }
      `}</style>
    </>
  );
};

export default Player;