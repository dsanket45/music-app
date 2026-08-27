// src/utils/youtubePlayer.js
// HTML5 Audio player with JioSaavn direct MP3 streaming
// Supports true background playback on Android

class AudioPlayerService {
  constructor() {
    this.audio = null;
    this.currentSong = null;
    this.isPlayingState = false;
    this.userInitiatedPause = false;
    this.onStateChangeCallback = null;
    this.onTimeUpdateCallback = null;
    this.onEndedCallback = null;
    this.timeUpdateTimer = null;
    this.serviceStarted = false;
    this.playerReady = true;

    // Create the HTML5 audio element
    this.createAudioElement();

    // Listen for native media commands from Android foreground service
    window.nativeMediaCommand = (command) => {
      console.log('📱 Native media command:', command);
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
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = 0.8;

    this.audio.addEventListener('play', () => {
      console.log('🎵 Audio playing');
      this.isPlayingState = true;
      this.userInitiatedPause = false;
      this.notifyNativePlay();
      this.updateMediaSessionPlaybackState('playing');
      if (this.onStateChangeCallback) this.onStateChangeCallback(1);
    });

    this.audio.addEventListener('pause', () => {
      if (!this.userInitiatedPause) {
        // System paused (screen lock/app switch) — auto-resume
        console.log('⚡ System pause — auto-resuming...');
        setTimeout(() => {
          if (!this.userInitiatedPause && this.audio && this.audio.src) {
            this.audio.play().catch(() => {});
          }
        }, 100);
        setTimeout(() => {
          if (!this.userInitiatedPause && this.audio && this.audio.src) {
            this.audio.play().catch(() => {});
          }
        }, 500);
        return;
      }
      this.isPlayingState = false;
      this.notifyNativePause();
      this.updateMediaSessionPlaybackState('paused');
      if (this.onStateChangeCallback) this.onStateChangeCallback(2);
    });

    this.audio.addEventListener('ended', () => {
      console.log('⏹️ Audio ended');
      this.isPlayingState = false;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      } else if (window.playerContext && window.playerContext.nextSong) {
        window.playerContext.nextSong();
      }
      if (this.onStateChangeCallback) this.onStateChangeCallback(0);
    });

    this.audio.addEventListener('error', (e) => {
      console.error('❌ Audio error:', this.audio.error?.message || e);
      // Try lower quality URL if available
      if (this.currentSong && this.currentSong.streamUrl) {
        const lowerUrl = this.currentSong.streamUrl.replace('_320.mp4', '_160.mp4');
        if (lowerUrl !== this.audio.src) {
          console.log('🔄 Retrying with 160kbps...');
          this.audio.src = lowerUrl;
          this.audio.load();
          this.audio.play().catch(() => {});
          return;
        }
        // Try preview URL as last resort
        if (this.currentSong.previewUrl && this.currentSong.previewUrl !== this.audio.src) {
          console.log('🔄 Retrying with preview URL...');
          this.audio.src = this.currentSong.previewUrl;
          this.audio.load();
          this.audio.play().catch(() => {});
          return;
        }
      }
      // Skip to next song on persistent failure
      setTimeout(() => {
        if (window.playerContext && window.playerContext.nextSong) {
          window.playerContext.nextSong();
        }
      }, 1000);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('📊 Duration:', Math.round(this.audio.duration), 'seconds');
    });
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
      } catch (e) {}
    }
  }

  notifyNativePause() {
    if (this.hasAndroidBridge()) {
      try { window.AndroidBridge.pauseService(); } catch (e) {}
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
    if (!('mediaSession' in navigator)) return;
    
    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => {
      this.userInitiatedPause = true;
      this.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (window.playerContext?.prevSong) window.playerContext.prevSong();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (window.playerContext?.nextSong) window.playerContext.nextSong();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) this.seekTo(details.seekTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      this.seekTo(Math.max(0, this.getCurrentTime() - (details.seekOffset || 10)));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      this.seekTo(Math.min(this.getDuration(), this.getCurrentTime() + (details.seekOffset || 10)));
    });
  }

  updateMediaSession(song) {
    if (!('mediaSession' in navigator) || !song) return;
    this.currentSong = song;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'D Music',
      artwork: [
        { src: song.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: song.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    this.notifyNativeMetadata(song);
  }

  updateMediaSessionPlaybackState(state) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  // Compatibility API
  async initialize() { this.initMediaSession(); }
  waitForPlayerReady() { return Promise.resolve(); }
  playVideo() { this.play(); }
  pauseVideo() { this.userInitiatedPause = true; this.pause(); }

  play() {
    this.userInitiatedPause = false;
    this.isPlayingState = true;
    if (this.audio && this.audio.src) {
      this.audio.play().catch(e => console.warn('Play error:', e));
    }
    if (this.hasAndroidBridge()) {
      try { window.AndroidBridge.resumeService(); } catch(e) {}
    }
  }

  pause() {
    this.userInitiatedPause = true;
    this.isPlayingState = false;
    if (this.audio) this.audio.pause();
    this.notifyNativePause();
  }

  seekTo(seconds) {
    if (this.audio) this.audio.currentTime = seconds;
  }

  setVolume(volume) {
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, volume / 100));
  }

  getCurrentTime() {
    return this.audio ? (this.audio.currentTime || 0) : 0;
  }

  getDuration() {
    const dur = this.audio ? this.audio.duration : 0;
    return (dur && !isNaN(dur) && dur > 0) ? dur : (this.currentSong?.durationSec || 210);
  }

  onStateChange(cb) { this.onStateChangeCallback = cb; }
  onTimeUpdate(cb) { this.onTimeUpdateCallback = cb; }
  onEnded(cb) { this.onEndedCallback = cb; }
  isReady() { return true; }

  async loadAndPlay(song) {
    if (!song) return;
    this.currentSong = song;
    this.updateMediaSession(song);
    this.initMediaSession();

    // Start the foreground service FIRST
    this.notifyNativePlay();

    // Stop current playback
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    // Get the stream URL
    let streamUrl = song.streamUrl || '';
    
    if (!streamUrl && song.previewUrl) {
      // Convert preview URL to full quality
      streamUrl = song.previewUrl
        .replace('preview.saavncdn.com', 'aac.saavncdn.com')
        .replace(/_96_p\.mp4/, '_320.mp4');
    }

    if (!streamUrl) {
      console.error('❌ No stream URL available for:', song.title);
      // Try to fetch from JioSaavn API directly
      try {
        const response = await fetch(
          `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${song.songId || song.id}`
        );
        const data = await response.json();
        const songData = data[song.songId || song.id] || Object.values(data)[0];
        if (songData && songData.media_preview_url) {
          streamUrl = songData.media_preview_url
            .replace('preview.saavncdn.com', 'aac.saavncdn.com')
            .replace(/_96_p\.mp4/, '_320.mp4');
        }
      } catch (e) {
        console.error('Failed to fetch song details:', e);
      }
    }

    if (!streamUrl) {
      console.error('❌ Could not get stream URL, skipping...');
      setTimeout(() => {
        if (window.playerContext?.nextSong) window.playerContext.nextSong();
      }, 1000);
      return;
    }

    console.log('🎵 Playing:', song.title, 'via', streamUrl.substring(0, 60) + '...');
    
    this.audio.src = streamUrl;
    this.audio.load();
    
    try {
      await this.audio.play();
      this.isPlayingState = true;
      console.log('✅ Playback started');
    } catch (err) {
      console.warn('Play failed, retrying:', err.message);
      setTimeout(() => {
        this.audio.play().catch(e => console.error('Retry failed:', e));
      }, 300);
    }
  }
}

export const youtubePlayer = new AudioPlayerService();
export const nativeAudioEngine = youtubePlayer;