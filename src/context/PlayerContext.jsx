// src/context/PlayerContext.jsx
import React, { createContext, useState, useEffect, useRef } from "react";
import { youtubePlayer } from "../utils/youtubePlayer";
import { addRecentlyPlayed, addMostPlayed } from "../utils/db";

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

  const currentSong = queue[currentIndex];
  const rafRef = useRef(null);
  const initializedRef = useRef(false);

  // Initialize YouTube player once
  useEffect(() => {
    if (!initializedRef.current) {
      youtubePlayer.initialize();
      initializedRef.current = true;
    }
  }, []);

  // Smooth time updates
  const updateTime = () => {
    if (youtubePlayer.playerReady) {
      setCurrentTime(youtubePlayer.getCurrentTime() || 0);
      setDuration(youtubePlayer.getDuration() || 0);
    }
    rafRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Play current song
  useEffect(() => {
    if (!currentSong) return;

    const playSong = async () => {
      try {
        addRecentlyPlayed(currentSong);
        addMostPlayed(currentSong);

        await youtubePlayer.playVideo(currentSong.songId);
        youtubePlayer.setVolume(volume);
        setIsPlaying(true);

        // Auto next when song ends
        if (youtubePlayer.player) {
          youtubePlayer.player.addEventListener("onStateChange", (event) => {
            if (event.data === 0) handleNext();
          });
        }
      } catch (err) {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      }
    };

    playSong();
  }, [currentSong]);

  const handleNext = () => {
    if (!queue.length) return;

    if (repeat === "one") {
      youtubePlayer.playVideo(currentSong.songId);
    } else if (shuffle) {
      setCurrentIndex(Math.floor(Math.random() * queue.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % queue.length);
    }
  };

  const handlePrev = () => {
    if (!queue.length) return;
    setCurrentIndex((prev) => (prev - 1 + queue.length) % queue.length);
  };

  const setNewQueue = (songs, startIndex = 0) => {
    setQueue(songs);
    setCurrentIndex(startIndex);
  };

  const addToQueue = (songs) => setQueue((prev) => [...prev, ...songs]);

  const togglePlayPause = async () => {
    if (!currentSong) return;
    if (isPlaying) {
      youtubePlayer.pauseVideo();
      setIsPlaying(false);
    } else {
      await youtubePlayer.playVideo(currentSong.songId);
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
        currentSong,
        isPlaying,
        queue,
        currentIndex,
        shuffle,
        repeat,
        volume,
        currentTime,
        duration,
        setShuffle,
        setRepeat,
        nextSong: handleNext,
        prevSong: handlePrev,
        setNewQueue,
        addToQueue,
        togglePlayPause,
        handleSeek,
        handleVolumeChange,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
