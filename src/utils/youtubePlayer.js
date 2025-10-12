// src/utils/youtubePlayer.js
class YouTubePlayerService {
  constructor() {
    this.player = null;
    this.apiReady = false;
    this.playerReady = false;
    this.currentVideoId = null;
    this.pendingVideoId = null;
    this.resolveReady = null;
    this.apiLoadPromise = null;
    this.onStateChangeCallback = null;
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
    await this.loadYouTubeAPI();
    if (this.playerReady) return;

    const container = document.getElementById("youtube-player-container");
    if (!container) {
      console.error("YouTube player container not found");
      return;
    }

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
      },
      events: {
        onReady: () => {
          this.playerReady = true;
          if (this.resolveReady) {
            this.resolveReady();
            this.resolveReady = null;
          }
          if (this.pendingVideoId) {
            this.loadAndPlay(this.pendingVideoId);
            this.pendingVideoId = null;
          }
        },
        onStateChange: (event) => {
          if (this.onStateChangeCallback) {
            this.onStateChangeCallback(event.data);
          }
        },
        onError: (error) => {
          console.warn("YouTube Player Error:", error);
        },
      },
    });

    await this.waitForPlayerReady();
  }

  waitForPlayerReady() {
    if (this.playerReady) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  async playVideo(videoId) {
    if (!videoId) throw new Error("No videoId provided");
    await this.initialize();
    await this.waitForPlayerReady();

    this.loadAndPlay(videoId);
    this.currentVideoId = videoId;
  }

  loadAndPlay(videoId) {
    if (!this.player) return;
    if (this.currentVideoId !== videoId) {
      this.player.loadVideoById(videoId);
    } else {
      this.player.playVideo();
    }
  }

  pauseVideo() {
    if (this.player && typeof this.player.pauseVideo === "function") {
      this.player.pauseVideo();
    }
  }

  seekTo(seconds) {
    if (this.player && typeof this.player.seekTo === "function") {
      this.player.seekTo(seconds, true);
    }
  }

  setVolume(volume) {
    if (this.player && typeof this.player.setVolume === "function") {
      this.player.setVolume(volume);
    }
  }

  getCurrentTime() {
    return this.player && typeof this.player.getCurrentTime === "function"
      ? this.player.getCurrentTime()
      : 0;
  }

  getDuration() {
    return this.player && typeof this.player.getDuration === "function"
      ? this.player.getDuration()
      : 0;
  }

  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  isReady() {
    return this.playerReady;
  }
}

export const youtubePlayer = new YouTubePlayerService();

// For backward compatibility with your imports
export const createPlayer = async (containerId, videoId, onStateChange) => {
  youtubePlayer.onStateChange(onStateChange);
  if (videoId) {
    await youtubePlayer.playVideo(videoId);
  }
  return youtubePlayer;
};

export const playVideo = () => youtubePlayer.player && youtubePlayer.player.playVideo();
export const pauseVideo = () => youtubePlayer.player && youtubePlayer.player.pauseVideo();
export const seekTo = (time) => youtubePlayer.seekTo(time);
export const setVolume = (vol) => youtubePlayer.setVolume(vol);
export const getCurrentTime = () => youtubePlayer.getCurrentTime();
export const getDuration = () => youtubePlayer.getDuration();
