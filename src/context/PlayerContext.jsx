import React, { createContext, useState, useEffect, useRef } from "react";
import { youtubePlayer } from "../utils/youtubePlayer";
import { addRecentlyPlayed, addMostPlayed } from "../utils/db";
// Add this import
// import { backgroundAudioService } from "../utils/BackgroundAudioService";
import { 
  searchYouTube, 
  getTrendingIndianMusic,
  getRelatedVideos,
  getFreshTrending 
} from "../utils/search.js";

// Create and export the context
const PlayerContext = createContext();

const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYouTubeMode, setIsYouTubeMode] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [playedGlobalIds, setPlayedGlobalIds] = useState(new Set());
  const [currentLanguage, setCurrentLanguage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [isLocalPlayback, setIsLocalPlayback] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState(null);

  const currentSong = queue[currentIndex];
  const rafRef = useRef(null);
  const initializedRef = useRef(false);

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDarkMode(systemPrefersDark);
        document.documentElement.classList.toggle('dark', systemPrefersDark);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Initialize background audio service


  // Make context available globally for Media Session API
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
  }, [currentSong]);

  // Setup service worker for background playback
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('✅ Service Worker registered'))
        .catch(err => console.log('❌ Service Worker registration failed:', err));
    }
  }, []);

  // Background audio support - keep playing when app is backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('📱 App visibility changed - hidden:', document.hidden);
      // Keep playback active for native background audio support
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle page unload - prepare for background playback
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isPlaying && currentSong) {
        console.log('💾 Saving playback state for background...');
        localStorage.setItem('backgroundPlayback', JSON.stringify({
          song: currentSong,
          currentTime: youtubePlayer.getCurrentTime(),
          isPlaying: true,
          volume: volume
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying, currentSong, volume]);

  // Resume playback if app was playing in background
  useEffect(() => {
    const resumeBackgroundPlayback = async () => {
      const backgroundPlayback = localStorage.getItem('backgroundPlayback');
      if (backgroundPlayback) {
        try {
          const { song, currentTime, isPlaying: wasPlaying, volume: savedVolume } = JSON.parse(backgroundPlayback);
          if (wasPlaying && song) {
            console.log('🔄 Resuming background playback...');
            
            if (savedVolume) {
              setVolume(savedVolume);
              youtubePlayer.setVolume(savedVolume);
            }
            
            setQueue([song]);
            setCurrentIndex(0);
            setIsYouTubeMode(true);
            
            setTimeout(() => {
              if (currentTime > 0) {
                youtubePlayer.seekTo(currentTime);
              }
              setIsPlaying(true);
            }, 1000);
          }
        } catch (error) {
          console.error('❌ Error resuming background playback:', error);
        } finally {
          localStorage.removeItem('backgroundPlayback');
        }
      }
    };

    setTimeout(resumeBackgroundPlayback, 500);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("🎵 Player State Update:", {
      currentSong: currentSong?.title,
      currentIndex,
      queueLength: queue.length,
      isPlaying,
      isYouTubeMode,
      currentLanguage,
      playedGlobalIds: Array.from(playedGlobalIds).slice(0, 5)
    });
  }, [currentSong, currentIndex, queue, isPlaying, isYouTubeMode, currentLanguage, playedGlobalIds]);

  // Initialize YouTube player once
  useEffect(() => {
    if (!initializedRef.current) {
      console.log("🚀 Initializing YouTube Player");
      youtubePlayer.initialize();
      initializedRef.current = true;
    }
  }, []);

  // Smooth time updates
  const updateTime = () => {
    if (youtubePlayer.isReady()) {
      setCurrentTime(youtubePlayer.getCurrentTime());
      setDuration(youtubePlayer.getDuration());
    }
    rafRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Play current song
  // Inside PlayerProvider component in src/context/PlayerContext.jsx

// ... (other state and effects above)

// 🎵 Play current song when it changes
useEffect(() => {
  if (!currentSong) {
    console.log("❌ No current song to play");
    return;
  }

  console.log("🎯 Playing song:", currentSong.title, "Language:", currentSong.language, "GlobalID:", currentSong.globalId);

  const playSong = async () => {
    try {
      // Track in DB
      await addRecentlyPlayed(currentSong);
      await addMostPlayed(currentSong);

      // Update played history
      setPlayedGlobalIds(prev => new Set([...prev, currentSong.globalId]));

      // Set language context
      if (currentSong.language) {
        setCurrentLanguage(currentSong.language);
      }

      // Update media session metadata
      youtubePlayer.updateMediaSession(currentSong);

      // ✅ Load video ONLY if it's a new song (won't reload if same)
      await youtubePlayer.ensureVideoLoaded(currentSong.songId);

      // Apply volume
      youtubePlayer.setVolume(volume);
      setCurrentVideoId(currentSong.songId);

      // ✅ Start playback (does NOT reload video)
      youtubePlayer.playVideo();
      setIsPlaying(true);

      console.log("✅ Song playback started successfully");
    } catch (err) {
      console.error("❌ Playback failed:", err);
      setIsPlaying(false);
    }
  };

  playSong();
}, [currentSong, volume]); // Re-run only when song or volume changes



// 🎛️ Toggle Play/Pause — NO video reload


  const resetPlayedGlobalIds = () => {
    console.log("🧹 Resetting played global IDs");
    setPlayedGlobalIds(new Set());
  };

  const getNextRecommendedSong = async () => {
    if (!currentSong) {
      console.log("❌ No current song for recommendations");
      return await getFallbackRecommendation();
    }

    try {
      console.log("🔍 Getting recommendations for:", currentSong.title, "Language:", currentLanguage);
      
      let nextSong = await getYouTubeNativeRecommendation();
      if (nextSong) return nextSong;

      nextSong = await getMoodLockedRecommendation(currentSong);
      if (nextSong) return nextSong;

      nextSong = await getArtistRecommendation(currentSong);
      if (nextSong) return nextSong;

      nextSong = await getTrendingRecommendation();
      if (nextSong) return nextSong;

      nextSong = await getSameLanguageRecommendation();
      if (nextSong) return nextSong;

      return await getFallbackRecommendation();

    } catch (error) {
      console.error("❌ Recommendation error:", error);
      return await getFallbackRecommendation();
    }
  };

  const getYouTubeNativeRecommendation = async () => {
    if (!currentSong) return null;
    
    try {
      console.log("🔗 Getting YouTube's native related videos for:", currentSong.title);
      let recommendations = await getRelatedVideos(currentSong.songId);
      
      recommendations = recommendations.filter(song => 
        song.language === currentLanguage &&
        !playedGlobalIds.has(song.globalId)
      );

      if (recommendations.length > 0) {
        console.log("✅ YouTube native recommendation:", recommendations[0].title);
        return recommendations[0];
      }

      console.log("📅 Trying fresh songs (last 30 days) in", currentLanguage);
      const fresh = await getFreshTrending(currentLanguage);
      const freshNew = fresh.find(song => !playedGlobalIds.has(song.globalId));
      if (freshNew) {
        console.log("✅ Fresh trending song:", freshNew.title);
        return freshNew;
      }

      return null;
    } catch (error) {
      console.error("❌ Native recommendation failed:", error);
      return null;
    }
  };

  const getMoodLockedRecommendation = async (currentSong) => {
    const mood = detectMood(currentSong.title, currentSong.artist);
    const lang = currentSong.language || 'hindi';

    const templates = {
      'energetic': [
        `${lang} action songs`,
        `${lang} mass entry songs`,
        `${lang} title track bgm`,
        `${lang} high energy fight songs`
      ],
      'party': [
        `${lang} party dance songs`,
        `${lang} bhangra wedding songs`,
        `${lang} festive celebration songs`
      ],
      'romantic': [
        `${lang} romantic love songs`,
        `${lang} emotional melody`,
        `${lang} sad love songs`
      ]
    };

    const queries = templates[mood] || templates['romantic'];
    
    for (const query of queries) {
      console.log("🎵 Mood-locked search:", query);
      const results = await searchYouTube(query, {
        enforceLanguage: true,
        minDuration: 120,
        prioritizeOfficial: true,
        maxResults: 15
      });
      const newSong = findNewSong(results);
      if (newSong) {
        console.log("✅ Found mood-consistent song:", newSong.title);
        return newSong;
      }
    }
    return null;
  };

  const detectMood = (title, artist = '') => {
    const text = (title + ' ' + artist).toLowerCase();
    const energeticKeywords = ['action', 'fight', 'battle', 'mass', 'entry', 'hero', 'villain', 'war', 'punch', 'title', 'theme', 'bgm', 'dhoom', 'dhamaka'];
    const partyKeywords = ['party', 'dance', 'club', 'bhangra', 'disco', 'celebration', 'festive', 'wedding', 'dhol', 'kuthu'];
    const romanticKeywords = ['romantic', 'love', 'heart', 'pyaar', 'prem', 'melody', 'slow', 'soulful', 'emotional', 'heartbreak'];

    if (energeticKeywords.some(kw => text.includes(kw))) return 'energetic';
    if (partyKeywords.some(kw => text.includes(kw))) return 'party';
    if (romanticKeywords.some(kw => text.includes(kw))) return 'romantic';
    if (text.includes('title') || text.includes('theme') || text.includes('bgm')) return 'energetic';
    return 'romantic';
  };

  const getArtistRecommendation = async (currentSong) => {
    const lang = currentSong.language || 'hindi';
    const queries = [
      `${currentSong.artist} ${lang} songs`,
      `${currentSong.artist} hit songs ${lang}`,
      `${currentSong.artist} new songs 2025`
    ];

    for (let query of queries) {
      console.log("🎤 Artist search:", query);
      const results = await searchYouTube(query, {
        enforceLanguage: true,
        minDuration: 120,
        prioritizeOfficial: true
      });
      const newSong = findNewSong(results);
      if (newSong) {
        console.log("✅ Found artist song:", newSong.title);
        return newSong;
      }
    }
    return null;
  };

  const getTrendingRecommendation = async () => {
    if (!currentLanguage) return null;
    console.log("🔥 Getting trending", currentLanguage, "music");
    const trending = await getTrendingIndianMusic();
    const filtered = trending.filter(song => song.language === currentLanguage);
    const newSong = findNewSong(filtered.length > 0 ? filtered : trending);
    return newSong;
  };

  const getSameLanguageRecommendation = async () => {
    if (!currentLanguage) return null;
    const queries = {
      'hindi': ['latest bollywood songs', 'hindi hit songs'],
      'tamil': ['latest tamil songs', 'tamil hit songs'],
      'telugu': ['latest telugu songs', 'telugu hit songs'],
      'kannada': ['latest kannada songs', 'kannada hit songs'],
      'malayalam': ['latest malayalam songs', 'malayalam hit songs']
    }[currentLanguage] || ['latest indian songs'];

    for (let query of queries) {
      console.log("🌐 Same language search:", query);
      const results = await searchYouTube(query, {
        enforceLanguage: true,
        minDuration: 120,
        prioritizeOfficial: true
      });
      const newSong = findNewSong(results);
      if (newSong) return newSong;
    }
    return null;
  };

  const getFallbackRecommendation = async () => {
    console.log("🔄 Fallback recommendation");
    if (currentLanguage) {
      const fresh = await getFreshTrending(currentLanguage);
      const freshNew = fresh.find(song => !playedGlobalIds.has(song.globalId));
      if (freshNew) return freshNew;
    }
    const results = await searchYouTube("latest indian songs", {
      minDuration: 120,
      prioritizeOfficial: true
    });
    return findNewSong(results) || (results.length > 0 ? results[0] : null);
  };

  const findNewSong = (songs) => {
    if (!songs || songs.length === 0) return null;
    
    for (let song of songs) {
      if (!playedGlobalIds.has(song.globalId)) {
        return song;
      }
    }
    
    if (playedGlobalIds.size > 30) {
      console.log("🧹 Clearing played history after 30 songs");
      setPlayedGlobalIds(new Set());
      return songs[0];
    }
    
    return null;
  };

  const nextSong = async () => {
    console.log("⏭️ Next song requested - YouTube Mode:", isYouTubeMode);

    if (isYouTubeMode) {
      const nextSong = await getNextRecommendedSong();
      
      if (nextSong) {
        console.log("✅ Playing recommended:", nextSong.title, "GlobalID:", nextSong.globalId);
        setQueue([nextSong]);
        setCurrentIndex(0);
        setIsPlaying(true);
      } else {
        console.log("⏹️ No new songs. Stopping auto-play.");
        setIsPlaying(false);
      }
    } else {
      if (!queue.length) {
        console.log("❌ Queue is empty - switching to YouTube mode");
        setIsYouTubeMode(true);
        nextSong();
        return;
      }

      let nextIndex;

      if (repeat === "one") {
        nextIndex = currentIndex;
      } else if (shuffle) {
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
            console.log("⏹️ End of queue - switching to YouTube mode");
            setIsYouTubeMode(true);
            nextSong();
            return;
          }
        }
      }

      if (nextIndex >= 0 && nextIndex < queue.length) {
        console.log("✅ Moving to next song in queue, index:", nextIndex);
        setCurrentIndex(nextIndex);
      } else {
        console.error("❌ Invalid next index:", nextIndex);
        setIsPlaying(false);
      }
    }
  };

  const prevSong = async () => {
    console.log("⏮️ Previous song requested - YouTube Mode:", isYouTubeMode);

    if (isYouTubeMode) {
      console.log("🎵 Getting alternative YouTube recommendation...");
      
      if (currentSong && currentLanguage) {
        const alternativeQueries = {
          'hindi': ['hindi romantic songs', 'bollywood dance songs', 'old hindi songs'],
          'tamil': ['tamil love songs', 'tamil dance songs', 'old tamil songs'],
          'telugu': ['telugu love songs', 'telugu party songs', 'old telugu songs'],
          'kannada': ['kannada romantic songs', 'kannada folk songs', 'old kannada songs'],
          'malayalam': ['malayalam romantic songs', 'malayalam classic songs', 'old malayalam songs']
        };

        const queries = alternativeQueries[currentLanguage] || ['indian songs'];
        
        for (let query of queries) {
          console.log("🔄 Alternative search:", query);
          const results = await searchYouTube(query, {
            enforceLanguage: true,
            minDuration: 120,
            prioritizeOfficial: true
          });
          const prevSong = findNewSong(results);
          
          if (prevSong) {
            console.log("✅ Playing alternative song:", prevSong.title);
            setQueue([prevSong]);
            setCurrentIndex(0);
            setIsPlaying(true);
            return;
          }
        }
      }
      
      nextSong();
    } else {
      if (!queue.length) return;

      let prevIndex;

      if (shuffle) {
        if (queue.length === 1) {
          prevIndex = 0;
        } else {
          do {
            prevIndex = Math.floor(Math.random() * queue.length);
          } while (prevIndex === currentIndex && queue.length > 1);
        }
      } else {
        prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = repeat === "all" ? queue.length - 1 : 0;
        }
      }

      console.log("Moving to previous index:", prevIndex);
      setCurrentIndex(prevIndex);
    }
  };

  const setNewQueue = (songs, startIndex = 0, enableYouTubeMode = true) => {
    console.log("🆕 Setting new queue with YouTube mode:", enableYouTubeMode);
    setQueue(songs);
    setCurrentIndex(startIndex);
    setIsYouTubeMode(enableYouTubeMode);
    setIsPlaying(true);
    
    if (enableYouTubeMode) {
      setPlayedGlobalIds(new Set());
      if (songs.length > 0 && songs[0].language) {
        setCurrentLanguage(songs[0].language);
      }
    }
  };

  const addToQueue = (songs) => {
    console.log("➕ Adding to queue:", songs.length, "songs");
    setQueue((prev) => [...prev, ...songs]);
  };

const togglePlayPause = () => {
  console.log("⏯️ Toggle play/pause, current state:", isPlaying);
  if (!currentSong) {
    console.log("❌ No song to play/pause");
    return;
  }
  if (isPlaying) {
    console.log("⏸️ Pausing video");
    youtubePlayer.pauseVideo();
    setIsPlaying(false);
  } else {
    console.log("▶️ Resuming video playback");
    youtubePlayer.playVideo();
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

  // Auto next on song end
  useEffect(() => {
    const handleStateChange = (state) => {
      console.log("📺 YouTube Player State:", state);
      
      if (state === 0) {
        console.log("🎬 Video ended, moving to next song");
        nextSong();
      } else if (state === 1) {
        console.log("▶️ Video is playing");
        setIsPlaying(true);
      } else if (state === 2) {
        console.log("⏸️ Video is paused");
        setIsPlaying(false);
      }
    };

    youtubePlayer.onStateChange(handleStateChange);

    return () => {
      youtubePlayer.onStateChange(null);
    };
  }, [queue, repeat, shuffle, currentIndex, isYouTubeMode, currentVideoId, playedGlobalIds, currentLanguage]);

  const contextValue = {
    currentSong,
    isPlaying,
    queue,
    currentIndex,
    shuffle,
    repeat,
    volume,
    currentTime,
    duration,
    isYouTubeMode,
    playedGlobalIds,
    darkMode,
    setDarkMode,
    setShuffle,
    setRepeat,
    nextSong,
    prevSong,
    setNewQueue,
    addToQueue,
    togglePlayPause,
    handleSeek,
    handleVolumeChange,
    resetPlayedGlobalIds,
     isLocalPlayback,
  localAudioUrl,
  setIsLocalPlayback: (isLocal, url = null) => {
    setIsLocalPlayback(isLocal);
    setLocalAudioUrl(url);
  }
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

export { PlayerContext, PlayerProvider };