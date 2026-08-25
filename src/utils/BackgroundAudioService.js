/**
 * BackgroundAudioService.js
 * 
 * A production-grade service to maintain audio context and simulate
 * uninterrupted playback in PWAs—even with YouTube iframe limitations.
 * 
 * Techniques used:
 * 1. Persistent AudioContext (with silent oscillator)
 * 2. Web Worker heartbeat to prevent suspension
 * 3. MediaSession position updates
 * 4. Optional Wake Lock (system)
 * 5. Silent audio fallback loop
 * 6. Visibility change auto-resume
 * 7. React integration hooks
 */

class BackgroundAudioService {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.worker = null;
    this.wakeLock = null;
    this.silentAudio = null;
    this.isResumed = false;
    this.lastKnownTime = 0;
    this.playbackRate = 1;
    this.onVisibilityChange = null;
    this.onPlaybackResume = null;
    this.onMetadataUpdate = null;

    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.resumePlayback = this.resumePlayback.bind(this);
  }

  /**
   * Initialize all background playback mechanisms
   */
  async initialize() {
    console.log('🔊 [BackgroundAudioService] Initializing background audio service...');

    try {
      // 1. Create persistent AudioContext
      await this.setupAudioContext();

      // 2. Start Web Worker heartbeat
      this.startWorkerHeartbeat();

      // 3. Setup silent audio fallback (for YouTube iframe)
      this.setupSilentAudio();

      // 4. Request Wake Lock (optional)
      this.requestWakeLock();

      // 5. Listen for visibility changes
      this.setupVisibilityListener();

      console.log('✅ [BackgroundAudioService] Background service initialized successfully');
    } catch (error) {
      console.error('❌ [BackgroundAudioService] Initialization failed:', error);
    }
  }

  /**
   * Create and maintain an active AudioContext
   */
  async setupAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('⚠️ [BackgroundAudioService] Web Audio API not supported');
      return;
    }

    this.audioContext = new AudioContext();
    
    // Resume on user gesture if suspended
    const resumeContext = async () => {
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('🔊 [BackgroundAudioService] AudioContext resumed');
        } catch (e) {
          console.warn('⚠️ [BackgroundAudioService] Could not resume AudioContext:', e);
        }
      }
    };

    // Attempt resume on first user interaction
    const userEvents = ['click', 'touchstart', 'keydown'];
    userEvents.forEach(event => {
      window.addEventListener(event, resumeContext, { once: true });
    });

    // Create silent oscillator to keep context alive
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.frequency.setValueAtTime(0.001, this.audioContext.currentTime); // near-silent
    const destination = this.audioContext.createGain();
    destination.gain.setValueAtTime(0.0001, this.audioContext.currentTime); // almost muted
    this.oscillator.connect(destination);
    destination.connect(this.audioContext.destination);
    this.oscillator.start();

    console.log('🔊 [BackgroundAudioService] AudioContext and silent oscillator created');
  }

  /**
   * Start a Web Worker that sends periodic pings to prevent suspension
   */
  startWorkerHeartbeat() {
    const workerCode = `
      self.onmessage = function(e) {
        if (e.data.action === 'start') {
          setInterval(() => {
            self.postMessage({ type: 'heartbeat' });
          }, 30000); // Every 30s
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.postMessage({ action: 'start' });

    this.worker.onmessage = () => {
      // Keep main thread awake
      navigator?.wakeLock?.request?.('screen').then(lock => lock.release()).catch(() => {});
    };

    console.log('🔁 [BackgroundAudioService] Web Worker heartbeat started');
  }

  /**
   * Create a silent audio element to maintain audio focus
   */
  setupSilentAudio() {
    this.silentAudio = new Audio();
    this.silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAA';
    this.silentAudio.loop = true;
    this.silentAudio.volume = 0.01; // barely audible

    // Prevent autoplay blocking
    this.silentAudio.muted = true;

    console.log('🔇 [BackgroundAudioService] Silent audio element created');
  }

  /**
   * Request system Wake Lock (if supported)
   */
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('system');
        console.log('🔋 [BackgroundAudioService] System Wake Lock acquired');

        this.wakeLock.addEventListener('release', () => {
          console.log('🔋 [BackgroundAudioService] Wake Lock released');
        });
      } catch (err) {
        console.warn('⚠️ [BackgroundAudioService] Wake Lock request failed:', err.name, err.message);
      }
    } else {
      console.warn('⚠️ [BackgroundAudioService] Wake Lock API not supported');
    }
  }

  /**
   * Setup visibility change listener for auto-resume
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('👁️ [BackgroundAudioService] Visibility change listener added');
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('📱 [BackgroundAudioService] App moved to background');
      this.lastKnownTime = Date.now();
      
      // Mute silent audio to avoid noise
      if (this.silentAudio) {
        this.silentAudio.muted = true;
      }

      // Notify consumer
      if (this.onVisibilityChange) {
        this.onVisibilityChange(false);
      }
    } else {
      const timeInBg = Date.now() - this.lastKnownTime;
      console.log(`🖥️ [BackgroundAudioService] App returned from background after ${Math.round(timeInBg / 1000)}s`);
      
      // Unmute silent audio
      if (this.silentAudio) {
        this.silentAudio.muted = false;
        this.silentAudio.play().catch(e => console.warn('🔇 Silent audio play failed:', e));
      }

      // Auto-resume if needed
      if (!this.isResumed && timeInBg > 1000) {
        this.resumePlayback();
      }

      // Notify consumer
      if (this.onVisibilityChange) {
        this.onVisibilityChange(true);
      }
    }
  }

  /**
   * Resume playback when returning from background
   */
  resumePlayback() {
    console.log('▶️ [BackgroundAudioService] Attempting to resume playback...');
    this.isResumed = true;

    if (this.onPlaybackResume) {
      this.onPlaybackResume();
    }
  }

  /**
   * Update MediaSession metadata and position
   */
  updateMediaSession(metadata, currentTime = 0, duration = 0) {
    if (!('mediaSession' in navigator)) return;

    try {
      // Update metadata
      navigator.mediaSession.metadata = new MediaMetadata(metadata);
      
      // Update position state
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: this.playbackRate,
        position: currentTime
      });

      console.log('🎵 [BackgroundAudioService] MediaSession updated:', { metadata, currentTime, duration });
    } catch (e) {
      console.warn('⚠️ [BackgroundAudioService] MediaSession update failed:', e);
    }
  }

  /**
   * Start silent audio loop (for YouTube iframe focus retention)
   */
  startSilentLoop() {
    if (!this.silentAudio) return;
    
    this.silentAudio.play()
      .then(() => console.log('🔇 [BackgroundAudioService] Silent loop started'))
      .catch(e => console.warn('🔇 [BackgroundAudioService] Silent loop failed:', e));
  }

  /**
   * Stop silent audio loop
   */
  stopSilentLoop() {
    if (!this.silentAudio) return;
    
    this.silentAudio.pause();
    this.silentAudio.currentTime = 0;
    console.log('🔇 [BackgroundAudioService] Silent loop stopped');
  }

  /**
   * Clean up all resources
   */
  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
    
    if (this.silentAudio) {
      this.silentAudio.pause();
      this.silentAudio = null;
    }
    
    console.log('🗑️ [BackgroundAudioService] Background service destroyed');
  }

  // --- React Integration Hooks ---
  
  /**
   * Set callback for visibility changes
   * @param {function} callback - (isVisible: boolean) => void
   */
  onVisibilityChangeCallback(callback) {
    this.onVisibilityChange = callback;
  }

  /**
   * Set callback for playback resume
   * @param {function} callback - () => void
   */
  onPlaybackResumeCallback(callback) {
    this.onPlaybackResume = callback;
  }

  /**
   * Set callback for metadata updates
   * @param {function} callback - (metadata) => void
   */
  onMetadataUpdateCallback(callback) {
    this.onMetadataUpdate = callback;
  }
}

// Export as singleton
export const backgroundAudioService = new BackgroundAudioService();