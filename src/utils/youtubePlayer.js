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
    this.onTimeUpdateCallback = null;
    this.onEndedCallback = null;
    this.isInitializing = false;
    this.currentSong = null;
    this.isPlayingState = false;
    this.userInitiatedPause = false;
    this.timeUpdateTimer = null;
    this.audioContext = null;
    this.bgResumeTimer = null;
    this.serviceStarted = false;

    // Listen for native media commands from Android foreground service
    window.nativeMediaCommand = (command) => {
      console.log('📱 Native media command received:', command);
      switch (command) {
        case 'play':
          this.playVideo();
          break;
        case 'pause':
          this.userInitiatedPause = true;
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

    this.startTimeTicker();
    this.setupBackgroundGuard();
  }

  /**
   * Create an inaudible AudioContext oscillator that keeps the audio pipeline alive.
   * This prevents Android from fully suspending audio when the WebView loses focus.
   */
  startAudioKeepAlive() {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          // Create a silent oscillator — keeps the audio thread alive
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          gain.gain.value = 0.00001; // completely inaudible
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start();
          // Expose globally so native code can resume it
          window._audioCtx = this.audioContext;
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (e) {
      console.warn("AudioContext keepalive init:", e);
    }
  }

  /**
   * Background guard: periodically check if playback was interrupted
   * by Android system and force-resume it.
   */
  setupBackgroundGuard() {
    // Check every 2 seconds if we should be playing but aren't
    this.bgResumeTimer = setInterval(() => {
      if (this.isPlayingState && !this.userInitiatedPause && this.player) {
        try {
          const state = this.player.getPlayerState ? this.player.getPlayerState() : -1;
          // YouTube states: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
          if (state === 2) { // Paused but should be playing
            console.log('🔄 Background guard: resuming paused playback');
            this.player.playVideo();
          }
          // Also resume AudioContext if suspended
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
        } catch (e) {}
      }
    }, 2000);
  }

  startTimeTicker() {
    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = setInterval(() => {
      if (this.isPlayingState && this.player && typeof this.player.getCurrentTime === 'function') {
        try {
          const t = this.player.getCurrentTime();
          if (this.onTimeUpdateCallback && typeof t === 'number' && !isNaN(t)) {
            this.onTimeUpdateCallback(t);
          }
        } catch (e) {}
      }
    }, 250);
  }

  isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

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
          autoplay: 1,
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
            this.initMediaSession();
            
            if (this.resolveReady) {
              this.resolveReady();
              this.resolveReady = null;
            }
            resolve();
          },
          onStateChange: (event) => {
            console.log("🎛️ YouTube Player State:", event.data);

            if (event.data === 1) { // PLAYING
              this.isPlayingState = true;
              this.userInitiatedPause = false;
              this.startAudioKeepAlive();
              this.notifyNativePlay();
              this.updateMediaSessionPlaybackState("playing");
            } else if (event.data === 2) { // PAUSED
              if (!this.userInitiatedPause) {
                // System-initiated pause (background/lock screen) — force resume
                console.log("⚡ System paused playback — auto-resuming...");
                setTimeout(() => {
                  if (this.player && typeof this.player.playVideo === 'function' && !this.userInitiatedPause) {
                    this.player.playVideo();
                  }
                }, 100);
                // Also try again after a longer delay in case the first attempt fails
                setTimeout(() => {
                  if (this.player && typeof this.player.playVideo === 'function' && !this.userInitiatedPause) {
                    this.player.playVideo();
                  }
                }, 500);
                setTimeout(() => {
                  if (this.player && typeof this.player.playVideo === 'function' && !this.userInitiatedPause) {
                    this.player.playVideo();
                  }
                }, 1500);
              } else {
                this.isPlayingState = false;
                this.notifyNativePause();
                this.updateMediaSessionPlaybackState("paused");
              }
            } else if (event.data === 0) { // ENDED
              this.isPlayingState = false;
              if (this.onEndedCallback) {
                this.onEndedCallback();
              } else if (window.playerContext && window.playerContext.nextSong) {
                window.playerContext.nextSong();
              }
            }

            if (this.onStateChangeCallback) {
              this.onStateChangeCallback(event.data);
            }
          },
          onError: (error) => {
            console.error("❌ YouTube Player Error:", error);
            this.isInitializing = false;
            if (window.playerContext && window.playerContext.nextSong) {
              window.playerContext.nextSong();
            }
          },
        },
      });
    });
  }

  /**
   * Start the native Android foreground service when playback begins.
   * This is what keeps the app process alive in the background.
   */
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
      navigator.mediaSession.setActionHandler('play', () => this.playVideo());
      navigator.mediaSession.setActionHandler('pause', () => {
        this.userInitiatedPause = true;
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

  waitForPlayerReady() {
    if (this.playerReady) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  playVideo() {
    this.userInitiatedPause = false;
    this.isPlayingState = true;
    this.startAudioKeepAlive();
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
    // Ensure foreground service is running
    if (!this.serviceStarted && this.hasAndroidBridge() && this.currentSong) {
      this.notifyNativePlay();
    } else if (this.hasAndroidBridge()) {
      try { window.AndroidBridge.resumeService(); } catch(e) {}
    }
  }

  pauseVideo() {
    this.userInitiatedPause = true;
    this.isPlayingState = false;
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
    this.notifyNativePause();
  }

  play() {
    this.playVideo();
  }

  pause() {
    this.pauseVideo();
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
    const dur = this.player && typeof this.player.getDuration === 'function' ? this.player.getDuration() : 0;
    return dur > 0 ? dur : (this.currentSong?.durationSec || 210);
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
    return this.playerReady;
  }

  async loadAndPlay(song) {
    if (!song) return;
    this.currentSong = song;
    this.updateMediaSession(song);
    this.startAudioKeepAlive();
    
    const videoId = song.songId || song.id;
    if (!videoId) return;

    // Start the foreground service BEFORE loading the video
    // This ensures Android keeps our process alive during loading
    this.notifyNativePlay();

    await this.initialize();
    await this.waitForPlayerReady();

    if (this.currentVideoId !== videoId) {
      this.currentVideoId = videoId;
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: 0
      });
      this.playVideo();
    } else {
      this.playVideo();
    }
  }
}

export const youtubePlayer = new YouTubePlayerService();
export const nativeAudioEngine = youtubePlayer;