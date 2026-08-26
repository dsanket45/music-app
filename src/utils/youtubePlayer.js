// src/utils/youtubePlayer.js
// Uses direct audio stream URLs via Piped API + HTML5 <audio> element
// This enables TRUE background playback on Android (screen lock, app switch)

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://api.piped.yt',
  'https://pipedapi.darkness.services',
];

class AudioPlayerService {
  constructor() {
    this.audio = null;
    this.currentVideoId = null;
    this.currentSong = null;
    this.isPlayingState = false;
    this.userInitiatedPause = false;
    this.onStateChangeCallback = null;
    this.onTimeUpdateCallback = null;
    this.onEndedCallback = null;
    this.timeUpdateTimer = null;
    this.serviceStarted = false;
    this.playerReady = true; // HTML5 audio is always ready
    this.retryCount = 0;
    this.maxRetries = 3;

    // Create the HTML5 audio element
    this.createAudioElement();

    // Listen for native media commands from Android foreground service
    window.nativeMediaCommand = (command) => {
      console.log('📱 Native media command received:', command);
      switch (command) {
        case 'play':
          this.play();
          break;
        case 'pause':
          this.userInitiatedPause = true;
          this.pause();
          break;
        case 'next':
          if (window.playerContext && window.playerContext.nextSong) {
            window.playerContext.nextSong();
          }
          break;
        case 'prev':
          if (window.playerContext && window.playerContext.prevSong) {
            window.playerContext.prevSong();
          }
          break;
      }
    };

    this.startTimeTicker();
  }

  createAudioElement() {
    // Remove old audio element if exists
    const existing = document.getElementById('dmusic-audio');
    if (existing) existing.remove();

    this.audio = new Audio();
    this.audio.id = 'dmusic-audio';
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    // Handle playback events
    this.audio.addEventListener('play', () => {
      console.log('🎵 Audio playing');
      this.isPlayingState = true;
      this.userInitiatedPause = false;
      this.notifyNativePlay();
      this.updateMediaSessionPlaybackState('playing');
      if (this.onStateChangeCallback) this.onStateChangeCallback(1); // 1 = playing
    });

    this.audio.addEventListener('pause', () => {
      console.log('⏸️ Audio paused, userInitiated:', this.userInitiatedPause);
      if (!this.userInitiatedPause) {
        // System paused it (screen lock, etc) — force resume
        console.log('⚡ System pause detected — auto-resuming...');
        setTimeout(() => {
          if (!this.userInitiatedPause && this.audio) {
            this.audio.play().catch(e => console.warn('Auto-resume failed:', e));
          }
        }, 100);
        setTimeout(() => {
          if (!this.userInitiatedPause && this.audio) {
            this.audio.play().catch(e => console.warn('Auto-resume retry failed:', e));
          }
        }, 500);
        return;
      }
      this.isPlayingState = false;
      this.notifyNativePause();
      this.updateMediaSessionPlaybackState('paused');
      if (this.onStateChangeCallback) this.onStateChangeCallback(2); // 2 = paused
    });

    this.audio.addEventListener('ended', () => {
      console.log('⏹️ Audio ended');
      this.isPlayingState = false;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      } else if (window.playerContext && window.playerContext.nextSong) {
        window.playerContext.nextSong();
      }
      if (this.onStateChangeCallback) this.onStateChangeCallback(0); // 0 = ended
    });

    this.audio.addEventListener('error', (e) => {
      console.error('❌ Audio error:', e);
      // Try next Piped instance on error
      if (this.retryCount < this.maxRetries && this.currentSong) {
        this.retryCount++;
        console.log(`🔄 Retrying with different instance (attempt ${this.retryCount}/${this.maxRetries})`);
        this.loadStreamUrl(this.currentVideoId, this.retryCount);
      } else {
        // Skip to next song on persistent error
        if (window.playerContext && window.playerContext.nextSong) {
          window.playerContext.nextSong();
        }
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('📊 Audio metadata loaded, duration:', this.audio.duration);
    });

    this.audio.addEventListener('canplay', () => {
      console.log('✅ Audio can play');
    });
  }

  /**
   * Fetch the direct audio stream URL from Piped API
   */
  async getAudioStreamUrl(videoId, instanceIndex = 0) {
    const errors = [];
    
    // Try each Piped instance in order
    for (let i = instanceIndex; i < PIPED_INSTANCES.length; i++) {
      const instance = PIPED_INSTANCES[i];
      try {
        console.log(`🌐 Trying Piped instance: ${instance}`);
        const response = await fetch(`${instance}/streams/${videoId}`, {
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get the best audio-only stream
        if (data.audioStreams && data.audioStreams.length > 0) {
          // Sort by bitrate (highest first) and prefer opus/mp4a
          const sorted = data.audioStreams
            .filter(s => s.url && s.mimeType)
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
          
          // Prefer m4a/mp4 audio for better Android compatibility
          const mp4Stream = sorted.find(s => 
            s.mimeType.includes('audio/mp4') || s.mimeType.includes('audio/m4a')
          );
          const bestStream = mp4Stream || sorted[0];
          
          if (bestStream && bestStream.url) {
            console.log(`✅ Got audio stream from ${instance}: ${bestStream.mimeType} @ ${bestStream.bitrate}bps`);
            return {
              url: bestStream.url,
              duration: data.duration || 0,
              title: data.title || '',
              uploader: data.uploader || '',
              thumbnail: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            };
          }
        }
        
        throw new Error('No audio streams found');
      } catch (err) {
        console.warn(`❌ Piped instance ${instance} failed:`, err.message);
        errors.push(`${instance}: ${err.message}`);
      }
    }
    
    throw new Error(`All Piped instances failed: ${errors.join(', ')}`);
  }

  async loadStreamUrl(videoId, startInstance = 0) {
    try {
      const streamData = await this.getAudioStreamUrl(videoId, startInstance);
      
      if (streamData && streamData.url) {
        this.audio.src = streamData.url;
        this.audio.load();
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Play failed, retrying:', err);
            // Retry after a short delay
            setTimeout(() => {
              this.audio.play().catch(e => console.error('Play retry failed:', e));
            }, 300);
          });
        }
        
        return streamData;
      }
    } catch (err) {
      console.error('Failed to load stream:', err);
      throw err;
    }
  }

  startTimeTicker() {
    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = setInterval(() => {
      if (this.isPlayingState && this.audio && !this.audio.paused) {
        const t = this.audio.currentTime;
        if (this.onTimeUpdateCallback && typeof t === 'number' && !isNaN(t)) {
          this.onTimeUpdateCallback(t);
        }
      }
    }, 250);
  }

  isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  hasAndroidBridge() {
    return typeof window.AndroidBridge !== 'undefined';
  }

  notifyNativePlay() {
    if (this.hasAndroidBridge() && this.currentSong) {
      try {
        window.AndroidBridge.startService(
          this.currentSong.title || 'D Music',
          this.currentSong.artist || 'Unknown Artist',
          this.currentSong.thumbnail || ''
        );
        this.serviceStarted = true;
        console.log('🔔 Native foreground service started');
      } catch (e) {
        console.warn('Failed to start native service:', e);
      }
    }
  }

  notifyNativePause() {
    if (this.hasAndroidBridge()) {
      try {
        window.AndroidBridge.pauseService();
      } catch (e) {}
    }
  }

  notifyNativeMetadata(song) {
    if (this.hasAndroidBridge() && song) {
      try {
        window.AndroidBridge.updateMetadata(
          song.title || 'D Music',
          song.artist || 'Unknown Artist',
          song.thumbnail || ''
        );
      } catch (e) {}
    }
  }

  initMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => {
        this.userInitiatedPause = true;
        this.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (window.playerContext && window.playerContext.prevSong) {
          window.playerContext.prevSong();
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (window.playerContext && window.playerContext.nextSong) {
          window.playerContext.nextSong();
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const seekTime = this.getCurrentTime() - (details.seekOffset || 10);
        this.seekTo(Math.max(0, seekTime));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const seekTime = this.getCurrentTime() + (details.seekOffset || 10);
        this.seekTo(Math.min(this.getDuration(), seekTime));
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seekTo(details.seekTime);
        }
      });
    }
  }

  updateMediaSession(song) {
    if ('mediaSession' in navigator && song) {
      this.currentSong = song;
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'D Music',
        artwork: [
          { src: song.thumbnail, sizes: '96x96', type: 'image/png' },
          { src: song.thumbnail, sizes: '128x128', type: 'image/png' },
          { src: song.thumbnail, sizes: '192x192', type: 'image/png' },
          { src: song.thumbnail, sizes: '256x256', type: 'image/png' },
          { src: song.thumbnail, sizes: '384x384', type: 'image/png' },
          { src: song.thumbnail, sizes: '512x512', type: 'image/png' },
        ]
      });

      this.notifyNativeMetadata(song);
    }
  }

  updateMediaSessionPlaybackState(state) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  // Compatibility methods (same API as before)
  async initialize() {
    this.initMediaSession();
  }

  waitForPlayerReady() {
    return Promise.resolve();
  }

  playVideo() {
    this.play();
  }

  pauseVideo() {
    this.userInitiatedPause = true;
    this.pause();
  }

  play() {
    this.userInitiatedPause = false;
    this.isPlayingState = true;
    if (this.audio) {
      const p = this.audio.play();
      if (p) p.catch(e => console.warn('Play error:', e));
    }
    // Ensure foreground service is running
    if (this.hasAndroidBridge() && this.currentSong) {
      try { window.AndroidBridge.resumeService(); } catch(e) {}
    }
  }

  pause() {
    this.userInitiatedPause = true;
    this.isPlayingState = false;
    if (this.audio) {
      this.audio.pause();
    }
    this.notifyNativePause();
  }

  seekTo(seconds) {
    if (this.audio) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(volume) {
    if (this.audio) {
      // Volume: 0-100 from UI, audio element wants 0-1
      this.audio.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }

  getCurrentTime() {
    return this.audio ? this.audio.currentTime || 0 : 0;
  }

  getDuration() {
    const dur = this.audio ? this.audio.duration : 0;
    return (dur && !isNaN(dur) && dur > 0) ? dur : (this.currentSong?.durationSec || 210);
  }

  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  onTimeUpdate(callback) {
    this.onTimeUpdateCallback = callback;
  }

  onEnded(callback) {
    this.onEndedCallback = callback;
  }

  isReady() {
    return true;
  }

  async loadAndPlay(song) {
    if (!song) return;
    this.currentSong = song;
    this.retryCount = 0;
    this.updateMediaSession(song);
    
    const videoId = song.songId || song.id;
    if (!videoId) return;

    console.log('🎯 Loading direct audio stream for:', song.title, '(', videoId, ')');

    // Start the foreground service BEFORE loading audio
    this.notifyNativePlay();

    // Stop current playback
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    try {
      const streamData = await this.loadStreamUrl(videoId);
      console.log('✅ Audio stream loaded successfully');
    } catch (err) {
      console.error('❌ All stream sources failed:', err);
      // Skip to next song
      setTimeout(() => {
        if (window.playerContext && window.playerContext.nextSong) {
          window.playerContext.nextSong();
        }
      }, 1000);
    }
  }
}

export const youtubePlayer = new AudioPlayerService();
export const nativeAudioEngine = youtubePlayer;