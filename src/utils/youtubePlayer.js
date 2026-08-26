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
          autoplay: 0, // Changed to 1 to auto-play
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
           // 👇 ADD THESE TWO (from YouTube's own embed API config)
  widget_referrer: window.location.href,
  // Optional but helpful:
  mute: 0,
        },
        events: {
          onReady: () => {
            console.log("✅ YouTube Player Ready");
            this.playerReady = true;
            this.isInitializing = false;
            
            // Initialize Media Session API
            this.initMediaSession();
            
            if (this.resolveReady) {
              this.resolveReady();
              this.resolveReady = null;
            }
            resolve();
          },
          onStateChange: (event) => {
            console.log("🎛️ YouTube Player State Change:", event.data);

            // Auto-resume background playback if YouTube iframe API paused while app is hidden
            if (event.data === 2 && document.hidden && this.isPlayingState) {
              console.log("⚡ App in background - Auto-resuming background playback...");
              setTimeout(() => {
                if (this.player && typeof this.player.playVideo === 'function') {
                  this.player.playVideo();
                }
              }, 150);
            }

            if (event.data === 1) {
              this.isPlayingState = true;
            } else if (event.data === 2 && !document.hidden) {
              this.isPlayingState = false;
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

  // Initialize silent background audio loop to keep Android MediaSession alive
  initSilentAudio() {
    if (!this.silentAudio) {
      try {
        this.silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.01;
      } catch (e) {
        console.error("Silent audio init failed:", e);
      }
    }
  }

  // Initialize Media Session API for background playback & lockscreen controls
  initMediaSession() {
    if ('mediaSession' in navigator) {
      console.log("🎵 Initializing Media Session API");
      this.initSilentAudio();
      
      navigator.mediaSession.setActionHandler('play', () => {
        console.log("🎵 Media Session: Play");
        this.playVideo();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log("🎵 Media Session: Pause");
        this.pauseVideo();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log("🎵 Media Session: Previous Track");
        if (window.playerContext && window.playerContext.prevSong) {
          window.playerContext.prevSong();
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log("🎵 Media Session: Next Track");
        if (window.playerContext && window.playerContext.nextSong) {
          window.playerContext.nextSong();
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        console.log("🎵 Media Session: Seek Backward");
        const seekTime = this.getCurrentTime() - (details.seekOffset || 10);
        this.seekTo(Math.max(0, seekTime));
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        console.log("🎵 Media Session: Seek Forward");
        const seekTime = this.getCurrentTime() + (details.seekOffset || 10);
        const duration = this.getDuration();
        this.seekTo(Math.min(duration, seekTime));
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        console.log("🎵 Media Session: Stop");
        this.pauseVideo();
      });
    }
  }

  // Update Media Session metadata
  updateMediaSession(song) {
    if ('mediaSession' in navigator && song) {
      console.log("🎵 Updating Media Session for:", song.title);
      this.currentSong = song;
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'Unknown Album',
        artwork: [
          { src: song.thumbnail, sizes: '96x96', type: 'image/png' },
          { src: song.thumbnail, sizes: '128x128', type: 'image/png' },
          { src: song.thumbnail, sizes: '192x192', type: 'image/png' },
          { src: song.thumbnail, sizes: '256x256', type: 'image/png' },
          { src: song.thumbnail, sizes: '384x384', type: 'image/png' },
          { src: song.thumbnail, sizes: '512x512', type: 'image/png' },
        ]
      });
    }
  }

  // Update Media Session playback state
  updateMediaSessionPlaybackState(state) {
    if ('mediaSession' in navigator) {
      if (state === 1) { // Playing
        navigator.mediaSession.playbackState = 'playing';
      } else if (state === 2) { // Paused
        navigator.mediaSession.playbackState = 'paused';
      } else if (state === 0) { // Ended
        navigator.mediaSession.playbackState = 'none';
      }
    }
  }

  waitForPlayerReady() {
    if (this.playerReady) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

 // REPLACE your current playVideo with this:
playVideo() {
  console.log("▶️ Resuming playback (no reload)");
  if (this.silentAudio) {
    this.silentAudio.play().catch(() => {});
  }
  if (this.player && typeof this.player.playVideo === 'function') {
    this.player.playVideo();
  }
}

  pauseVideo() {
    console.log("⏸️ Pausing video");
    if (this.silentAudio) {
      this.silentAudio.pause();
    }
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

  // Get current video ID for debugging
  getCurrentVideoId() {
    return this.currentVideoId;
  }

  // In youtubePlayer.js — ADD THIS METHOD
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