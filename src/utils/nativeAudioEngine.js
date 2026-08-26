// src/utils/nativeAudioEngine.js
/**
 * Native Direct Audio Engine
 * Plays direct high-quality audio streams (MP4/M4A/MP3) via native HTML5 Audio
 * Provides 100% uninterrupted background playback with lock-screen & notification controls
 */

class NativeAudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.currentSong = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.onStateChangeCallback = null;
    this.onTimeUpdateCallback = null;
    this.onEndedCallback = null;
    this.userInitiatedPause = false;

    // Attach native audio event listeners
    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.userInitiatedPause = false;
      this.notifyNativePlay();
      if (this.onStateChangeCallback) this.onStateChangeCallback(1);
      this.updateMediaSessionPlaybackState("playing");
    });

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.notifyNativePause();
      if (this.onStateChangeCallback) this.onStateChangeCallback(2);
      this.updateMediaSessionPlaybackState("paused");
    });

    this.audio.addEventListener("timeupdate", () => {
      this.currentTime = this.audio.currentTime;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentTime);
      }
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.duration = this.audio.duration || 0;
    });

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      } else if (window.playerContext && window.playerContext.nextSong) {
        window.playerContext.nextSong();
      }
    });

    this.audio.addEventListener("error", (e) => {
      console.warn("⚠️ Audio stream error, trying fallback...", e);
    });

    // Listen for native Android notification commands
    window.nativeMediaCommand = (command) => {
      console.log("📱 Native lock-screen command received:", command);
      switch (command) {
        case "play":
          this.play();
          break;
        case "pause":
          this.pause();
          break;
        case "next":
          if (window.playerContext && window.playerContext.nextSong) {
            window.playerContext.nextSong();
          }
          break;
        case "prev":
          if (window.playerContext && window.playerContext.prevSong) {
            window.playerContext.prevSong();
          }
          break;
      }
    };

    this.initMediaSession();
  }

  hasAndroidBridge() {
    return typeof window.AndroidBridge !== "undefined";
  }

  notifyNativePlay() {
    if (this.hasAndroidBridge() && this.currentSong) {
      try {
        window.AndroidBridge.startService(
          this.currentSong.title || "D Music",
          this.currentSong.artist || "Unknown Artist",
          this.currentSong.thumbnail || ""
        );
      } catch (e) {
        console.warn("AndroidBridge startService error:", e);
      }
    }
  }

  notifyNativePause() {
    if (this.hasAndroidBridge()) {
      try {
        window.AndroidBridge.pauseService();
      } catch (e) {
        console.warn("AndroidBridge pauseService error:", e);
      }
    }
  }

  notifyNativeMetadata(song) {
    if (this.hasAndroidBridge() && song) {
      try {
        window.AndroidBridge.updateMetadata(
          song.title || "D Music",
          song.artist || "Unknown Artist",
          song.thumbnail || ""
        );
      } catch (e) {
        console.warn("AndroidBridge updateMetadata error:", e);
      }
    }
  }

  initMediaSession() {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => this.play());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (window.playerContext && window.playerContext.prevSong) {
          window.playerContext.prevSong();
        }
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (window.playerContext && window.playerContext.nextSong) {
          window.playerContext.nextSong();
        }
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const seekTime = Math.max(0, this.audio.currentTime - (details.seekOffset || 10));
        this.seekTo(seekTime);
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const seekTime = Math.min(this.getDuration(), this.audio.currentTime + (details.seekOffset || 10));
        this.seekTo(seekTime);
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          this.seekTo(details.seekTime);
        }
      });
    }
  }

  updateMediaSession(song) {
    if ("mediaSession" in navigator && song) {
      this.currentSong = song;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title || "Unknown Song",
        artist: song.artist || "Unknown Artist",
        album: song.album || "D Music",
        artwork: [
          { src: song.thumbnail, sizes: "96x96", type: "image/png" },
          { src: song.thumbnail, sizes: "128x128", type: "image/png" },
          { src: song.thumbnail, sizes: "192x192", type: "image/png" },
          { src: song.thumbnail, sizes: "256x256", type: "image/png" },
          { src: song.thumbnail, sizes: "384x384", type: "image/png" },
          { src: song.thumbnail, sizes: "512x512", type: "image/png" }
        ]
      });

      this.notifyNativeMetadata(song);
    }
  }

  updateMediaSessionPlaybackState(state) {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  /**
   * Fetch streamable audio URL if not present on song object
   */
  async resolveAudioUrl(song) {
    if (song.mediaUrl && song.mediaUrl.startsWith("http")) {
      return song.mediaUrl;
    }
    if (song.audioUrl && song.audioUrl.startsWith("http")) {
      return song.audioUrl;
    }

    // Fetch from JioSaavn API by song ID or title
    try {
      const searchId = song.saavnId || song.id;
      if (searchId && !searchId.includes("-") && searchId.length < 20) {
        const res = await fetch(`https://jiosaavn-api.vercel.app/song?id=${searchId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.media_url) return data.media_url;
          if (data.media_urls) {
            return data.media_urls["320_KBPS"] || data.media_urls["160_KBPS"] || data.media_urls["96_KBPS"];
          }
        }
      }

      // Fallback search by title and artist
      const query = encodeURIComponent(`${song.title} ${song.artist || ""}`.trim());
      const searchRes = await fetch(`https://jiosaavn-api.vercel.app/search?query=${query}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const first = searchData.results?.[0];
        if (first?.id) {
          const songRes = await fetch(`https://jiosaavn-api.vercel.app/song?id=${first.id}`);
          if (songRes.ok) {
            const songData = await songRes.json();
            if (songData.media_url) return songData.media_url;
            if (songData.media_urls) {
              return songData.media_urls["320_KBPS"] || songData.media_urls["160_KBPS"];
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not resolve Saavn stream:", err);
    }

    // Default backup stream
    return song.mediaUrl || song.audioUrl || null;
  }

  async loadAndPlay(song) {
    if (!song) return;
    this.currentSong = song;
    this.updateMediaSession(song);

    try {
      const streamUrl = await this.resolveAudioUrl(song);
      if (streamUrl) {
        console.log("🎵 Playing Direct Native Audio Stream:", song.title, streamUrl);
        this.audio.src = streamUrl;
        await this.audio.play();
        this.isPlaying = true;
        this.notifyNativePlay();
      } else {
        console.warn("⚠️ No audio stream found for:", song.title);
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  }

  play() {
    this.userInitiatedPause = false;
    this.audio.play().catch((e) => console.warn("Audio play error:", e));
  }

  pause() {
    this.userInitiatedPause = true;
    this.audio.pause();
  }

  seekTo(seconds) {
    if (this.audio && !isNaN(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(volumePercent) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volumePercent / 100));
    }
  }

  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  }

  getDuration() {
    return this.audio && !isNaN(this.audio.duration) ? this.audio.duration : 0;
  }

  isReady() {
    return true;
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
}

export const nativeAudioEngine = new NativeAudioEngine();
export const youtubePlayer = nativeAudioEngine; // Compatibility alias
