// src/utils/youtubePlayer.js
class YouTubePlayerService {
  constructor() {
    this.player = null;
    this.apiReady = false;
    this.playerReady = false;
    this.currentVideoId = null;
    this.resolveReady = null;
    this.apiLoadPromise = null;
    this.onStateChangeCallback = null;
    this.isInitializing = false;
    this.currentSong = null;
    this.isPlayingState = false;

    // Listen for native media commands from Android foreground service
    window.nativeMediaCommand = (command) => {
      console.log('📱 Native media command received:', command);
      switch (command) {
        case 'play':
          this.playVideo();
          break;
        case 'pause':
          this.pauseVideo();
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
  }

  // Check if running inside native Android Capacitor app
  isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  // Check if AndroidBridge is available
  hasAndroidBridge() {
    return typeof window.AndroidBridge !== 'undefined';
  }

  loadYouTubeAPI() {
    if (this.apiLoadPromise) return this.apiLoadPromise;

    this.apiLoadPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        this.apiReady = true;
        resolve();
      } else {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
          this.apiReady = true;
          resolve();
        };
      }
    });

    return this.apiLoadPromise;
  }

  async initialize() {
    if (this.isInitializing) {
      await this.waitForPlayerReady();
      return;
    }

    this.isInitializing = true;
    await this.loadYouTubeAPI();
    
    if (this.playerReady) {
      this.isInitializing = false;
      return;
    }

    const container = document.getElementById("youtube-player-container");
    if (!container) {
      console.error("YouTube player container not found");
      this.isInitializing = false;
      return;
    }

    return new Promise((resolve, reject) => {
      this.player = new window.YT.Player("youtube-player-container", {
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.href,
          mute: 0,
        },
        events: {
          onReady: () => {
            console.log("✅ YouTube Player Ready");
            this.playerReady = true;
            this.isInitializing = false;
            
            // Initialize Media Session API (for web + extra controls)
            this.initMediaSession();
            
            if (this.resolveReady) {
              this.resolveReady();
              this.resolveReady = null;
            }
            resolve();
          },
          onStateChange: (event) => {
            console.log("🎛️ YouTube Player State:", event.data);

            if (event.data === 1) {
              this.isPlayingState = true;
              this.userInitiatedPause = false;
              this.notifyNativePlay();
            } else if (event.data === 2) {
              if (!this.userInitiatedPause) {
                console.log("⚡ Auto-resuming background playback...");
                setTimeout(() => {
                  if (this.player && typeof this.player.playVideo === 'function') {
                    this.player.playVideo();
                  }
                }, 50);
              } else {
                this.isPlayingState = false;
                this.notifyNativePause();
              }
            } else if (event.data === 0) {
              this.isPlayingState = false;
              if (window.playerContext && window.playerContext.nextSong) {
                window.playerContext.nextSong();
              }
            }

            if (this.onStateChangeCallback) {
              this.onStateChangeCallback(event.data);
            }

            // Update Media Session playback state
            this.updateMediaSessionPlaybackState(event.data);
          },
          onError: (error) => {
            console.error("❌ YouTube Player Error:", error);
            this.isInitializing = false;
            reject(error);
          },
        },
      });
    });
  }

  // ============================================
  // NATIVE ANDROID BRIDGE METHODS
  // ============================================

  notifyNativePlay() {
    if (this.hasAndroidBridge() && this.currentSong) {
      try {
        window.AndroidBridge.startService(
          this.currentSong.title || 'Unknown',
          this.currentSong.artist || 'Unknown Artist',
          this.currentSong.thumbnail || ''
        );
        console.log('📱 Native service: PLAY');
      } catch (e) {
        console.warn('AndroidBridge.startService error:', e);
      }
    }
  }

  notifyNativePause() {
    if (this.hasAndroidBridge()) {
      try {
        window.AndroidBridge.pauseService();
        console.log('📱 Native service: PAUSE');
      } catch (e) {
        console.warn('AndroidBridge.pauseService error:', e);
      }
    }
  }

  notifyNativeStop() {
    if (this.hasAndroidBridge()) {
      try {
        window.AndroidBridge.stopService();
        console.log('📱 Native service: STOP');
      } catch (e) {
        console.warn('AndroidBridge.stopService error:', e);
      }
    }
  }

  notifyNativeMetadata(song) {
    if (this.hasAndroidBridge() && song) {
      try {
        window.AndroidBridge.updateMetadata(
          song.title || 'Unknown',
          song.artist || 'Unknown Artist',
          song.thumbnail || ''
        );
        console.log('📱 Native metadata updated:', song.title);
      } catch (e) {
        console.warn('AndroidBridge.updateMetadata error:', e);
      }
    }
  }

  // ============================================
  // MEDIA SESSION API (Web + Fallback)
  // ============================================

  initMediaSession() {
    if ('mediaSession' in navigator) {
      console.log("🎵 Initializing Media Session API");
      
      navigator.mediaSession.setActionHandler('play', () => {
        this.playVideo();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pauseVideo();
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
        const duration = this.getDuration();
        this.seekTo(Math.min(duration, seekTime));
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.pauseVideo();
        this.notifyNativeStop();
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

      // Also update native Android notification metadata
      this.notifyNativeMetadata(song);
    }
  }

  updateMediaSessionPlaybackState(state) {
    if ('mediaSession' in navigator) {
      if (state === 1) {
        navigator.mediaSession.playbackState = 'playing';
      } else if (state === 2) {
        navigator.mediaSession.playbackState = 'paused';
      } else if (state === 0) {
        navigator.mediaSession.playbackState = 'none';
      }
    }
  }

  // ============================================
  // PLAYBACK CONTROLS
  // ============================================

  waitForPlayerReady() {
    if (this.playerReady) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  playVideo() {
    console.log("▶️ Play");
    this.userInitiatedPause = false;
    this.isPlayingState = true;
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  pauseVideo() {
    console.log("⏸️ Pause");
    this.userInitiatedPause = true;
    this.isPlayingState = false;
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  seekTo(seconds) {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  setVolume(volume) {
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(volume);
    }
  }

  getCurrentTime() {
    return this.player && typeof this.player.getCurrentTime === 'function'
      ? this.player.getCurrentTime()
      : 0;
  }

  getDuration() {
    return this.player && typeof this.player.getDuration === 'function'
      ? this.player.getDuration()
      : 0;
  }

  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  isReady() {
    return this.playerReady;
  }

  getCurrentVideoId() {
    return this.currentVideoId;
  }

  async ensureVideoLoaded(videoId) {
    if (!videoId) throw new Error("No videoId provided");
    
    await this.initialize();
    await this.waitForPlayerReady();

    // Only load if it's a different video
    if (this.currentVideoId !== videoId) {
      console.log("🆕 Loading new video:", videoId);
      this.currentVideoId = videoId;
      this.player.loadVideoById(videoId);
    } else {
      console.log("✅ Video already loaded:", videoId);
    }
  }
}

export const youtubePlayer = new YouTubePlayerService();