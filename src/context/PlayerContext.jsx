import React, { createContext, useState, useEffect, useRef } from "react";
import { nativeAudioEngine } from "../utils/nativeAudioEngine";
import { addRecentlyPlayed, addMostPlayed } from "../utils/db";
import { 
  searchYouTube, 
  getTrendingIndianMusic,
  getRelatedVideos,
  getFreshTrending 
} from "../utils/search.js";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYouTubeMode, setIsYouTubeMode] = useState(false);
  const [playedGlobalIds, setPlayedGlobalIds] = useState(new Set());
  const [currentLanguage, setCurrentLanguage] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const currentSong = queue[currentIndex];
  const rafRef = useRef(null);

  // Load dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Make context available globally for Media Session API and Native Bridge
  useEffect(() => {
    window.playerContext = {
      nextSong: () => nextSong(),
      prevSong: () => prevSong(),
      togglePlayPause: () => togglePlayPause(),
      currentSong: currentSong
    };
    
    return () => {
      delete window.playerContext;
    };
  }, [currentSong, currentIndex, queue, isPlaying]);

  // Sync state with native audio engine
  useEffect(() => {
    nativeAudioEngine.onStateChange((state) => {
      setIsPlaying(state === 1);
    });

    nativeAudioEngine.onTimeUpdate((time) => {
      setCurrentTime(time);
      setDuration(nativeAudioEngine.getDuration());
    });

    nativeAudioEngine.onEnded(() => {
      nextSong();
    });
  }, [currentIndex, queue, repeat, shuffle]);

  // Smooth time update animation loop
  useEffect(() => {
    const update = () => {
      setCurrentTime(nativeAudioEngine.getCurrentTime());
      setDuration(nativeAudioEngine.getDuration());
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // 🎵 Play current song when it changes
  useEffect(() => {
    if (!currentSong) return;

    console.log("🎯 Playing direct audio stream:", currentSong.title, currentSong.artist);

    const playSong = async () => {
      try {
        await addRecentlyPlayed(currentSong);
        await addMostPlayed(currentSong);
        setPlayedGlobalIds(prev => new Set([...prev, currentSong.globalId]));

        if (currentSong.language) {
          setCurrentLanguage(currentSong.language);
        }

        await nativeAudioEngine.loadAndPlay(currentSong);
        nativeAudioEngine.setVolume(volume);
        setIsPlaying(true);
      } catch (err) {
        console.error("❌ Playback failed:", err);
        setIsPlaying(false);
      }
    };

    playSong();
  }, [currentSong]);

  const nextSong = async () => {
    console.log("⏭️ Next song requested");
    if (!queue.length) return;

    if (repeat === "one" && currentSong) {
      nativeAudioEngine.seekTo(0);
      nativeAudioEngine.play();
      setIsPlaying(true);
      return;
    }

    let nextIndex;
    if (shuffle) {
      if (queue.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentIndex && queue.length > 1);
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          nextIndex = 0;
        } else {
          // Auto fetch recommendation to keep infinite music playing
          try {
            const recommendations = await searchYouTube(currentSong?.title || "popular hits");
            const newSongs = recommendations.filter(s => s.songId !== currentSong?.songId);
            if (newSongs.length > 0) {
              setQueue(prev => [...prev, ...newSongs]);
              setCurrentIndex(currentIndex + 1);
              return;
            }
          } catch (e) {}
          nextIndex = 0;
        }
      }
    }

    if (nextIndex >= 0 && nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const prevSong = () => {
    console.log("⏮️ Previous song requested");
    if (!queue.length) return;

    // If played more than 3 seconds, restart current song
    if (currentTime > 3) {
      nativeAudioEngine.seekTo(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = repeat === "all" ? queue.length - 1 : 0;
    }
    setCurrentIndex(prevIndex);
  };

  const setNewQueue = (songs, startIndex = 0) => {
    if (!songs || !songs.length) return;
    console.log("🆕 Setting new queue:", songs.length, "songs, start index:", startIndex);
    setQueue(songs);
    setCurrentIndex(startIndex);
    setIsPlaying(true);
    setPlayedGlobalIds(new Set());
  };

  const addToQueue = (songs) => {
    if (!songs || !songs.length) return;
    setQueue(prev => [...prev, ...songs]);
  };

  const togglePlayPause = () => {
    if (!currentSong) return;
    if (isPlaying) {
      nativeAudioEngine.pause();
      setIsPlaying(false);
    } else {
      nativeAudioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time) => {
    nativeAudioEngine.seekTo(time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    nativeAudioEngine.setVolume(vol);
  };

  return (
    <PlayerContext.Provider
      value={{
        queue,
        currentIndex,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        shuffle,
        repeat,
        volume,
        darkMode,
        setShuffle,
        setRepeat,
        togglePlayPause,
        nextSong,
        prevSong,
        setNewQueue,
        addToQueue,
        handleSeek,
        handleVolumeChange,
        setVolume,
        isLocalPlayback: false,
        localAudioUrl: null,
        setIsLocalPlayback: () => {}
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};