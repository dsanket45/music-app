import React, { createContext, useState, useEffect } from "react";
import { youtubePlayer } from "../utils/youtubePlayer";
import { addRecentlyPlayed, addMostPlayed } from "../utils/db";
import { searchYouTube, getTrendingIndianMusic } from "../utils/search.js";

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
  const [playedGlobalIds, setPlayedGlobalIds] = useState(new Set());
  const [darkMode, setDarkMode] = useState(true);

  const currentSong = queue[currentIndex];

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Make context available globally for Media Session & Android Bridge
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

  // Sync state with youtubePlayer
  useEffect(() => {
    youtubePlayer.onStateChange((state) => {
      setIsPlaying(state === 1);
      if (state === 1) {
        setDuration(youtubePlayer.getDuration());
      }
    });

    youtubePlayer.onTimeUpdate((time) => {
      setCurrentTime(time);
      const dur = youtubePlayer.getDuration();
      if (dur > 0) setDuration(dur);
    });

    youtubePlayer.onEnded(() => {
      nextSong();
    });
  }, [currentIndex, queue, repeat, shuffle]);

  // Play song when currentSong changes
  useEffect(() => {
    if (!currentSong) return;

    console.log("🎯 Loading and playing full track:", currentSong.title);

    const playSong = async () => {
      try {
        await addRecentlyPlayed(currentSong);
        await addMostPlayed(currentSong);
        setPlayedGlobalIds(prev => new Set([...prev, currentSong.globalId]));

        await youtubePlayer.loadAndPlay(currentSong);
        youtubePlayer.setVolume(volume);
        setIsPlaying(true);
        setCurrentTime(0);
        setDuration(currentSong.durationSec || 210);
      } catch (err) {
        console.error("❌ Playback failed:", err);
      }
    };

    playSong();
  }, [currentSong]);

  const nextSong = async () => {
    if (!queue.length) return;

    if (repeat === "one" && currentSong) {
      youtubePlayer.seekTo(0);
      youtubePlayer.play();
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
    if (!queue.length) return;

    if (currentTime > 3) {
      youtubePlayer.seekTo(0);
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
    console.log("🆕 Queue set:", songs.length, "songs, start index:", startIndex);
    setQueue(songs);
    setCurrentIndex(startIndex);
    setIsPlaying(true);
  };

  const addToQueue = (songs) => {
    if (!songs || !songs.length) return;
    setQueue(prev => [...prev, ...songs]);
  };

  const togglePlayPause = () => {
    if (!currentSong) return;
    if (isPlaying) {
      youtubePlayer.pause();
      setIsPlaying(false);
    } else {
      youtubePlayer.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time) => {
    youtubePlayer.seekTo(time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    youtubePlayer.setVolume(vol);
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