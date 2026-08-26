package com.sanket.musicapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private BroadcastReceiver mediaCommandReceiver;
    private AndroidBridge bridgeInterface;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Acquire a partial wake lock immediately — keeps CPU alive for audio even when screen is off
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ON_AFTER_RELEASE,
            "DMusic::BackgroundAudio"
        );
        wakeLock.acquire();

        bridgeInterface = new AndroidBridge();

        // Register broadcast receiver for media commands from the foreground service
        mediaCommandReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String command = intent.getStringExtra("command");
                if (command != null && bridge != null && bridge.getWebView() != null) {
                    runOnUiThread(() -> {
                        bridge.getWebView().evaluateJavascript(
                            "window.nativeMediaCommand && window.nativeMediaCommand('" + command + "');",
                            null
                        );
                    });
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mediaCommandReceiver,
                new IntentFilter("com.sanket.musicapp.MEDIA_COMMAND"),
                Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(mediaCommandReceiver,
                new IntentFilter("com.sanket.musicapp.MEDIA_COMMAND"));
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebViewForBackground();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewForBackground();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().onResume();
            this.bridge.getWebView().resumeTimers();
        }
    }

    /**
     * Configure the WebView to allow background media playback.
     * Key settings:
     *   - setMediaPlaybackRequiresUserGesture(false): allow autoplay
     *   - MIXED_CONTENT_ALWAYS_ALLOW: allow HTTPS + HTTP resources
     *   - JavaScript interface for native bridge
     */
    private void configureWebViewForBackground() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Add JavaScript interface for native bridge communication
            try {
                webView.addJavascriptInterface(bridgeInterface, "AndroidBridge");
            } catch (Exception e) {
                // Already added
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            if (webView.canGoBack()) {
                webView.goBack();
            } else {
                // Don't finish the activity — move to background to keep playing
                moveTaskToBack(true);
            }
        } else {
            moveTaskToBack(true);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // CRITICAL: Force WebView to stay alive when app goes to background
        keepWebViewAlive();
    }

    @Override
    public void onStop() {
        super.onStop();
        // CRITICAL: Force WebView to stay alive when screen is locked or other app is opened
        keepWebViewAlive();
    }

    /**
     * The nuclear option for background WebView media playback.
     * Android Chromium will try to pause/suspend the WebView when the app loses focus.
     * We counter this by:
     * 1. Calling webView.onResume() to reverse the onPause()
     * 2. Calling resumeTimers() to keep JavaScript timers running
     * 3. Evaluating JavaScript to resume any paused AudioContext
     */
    private void keepWebViewAlive() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();

            // Reverse the WebView pause that Android just triggered
            webView.onResume();
            webView.resumeTimers();

            // Resume AudioContext and YouTube player from JavaScript side
            webView.evaluateJavascript(
                "(function() {" +
                "  try {" +
                "    if (window._audioCtx && window._audioCtx.state === 'suspended') {" +
                "      window._audioCtx.resume();" +
                "    }" +
                "    var iframes = document.querySelectorAll('iframe');" +
                "    for (var i = 0; i < iframes.length; i++) {" +
                "      try { iframes[i].contentWindow.postMessage('{\"event\":\"command\",\"func\":\"playVideo\",\"args\":\"\"}', '*'); } catch(e) {}" +
                "    }" +
                "  } catch(e) {}" +
                "})();",
                null
            );
        }
    }

    @Override
    public void onDestroy() {
        if (mediaCommandReceiver != null) {
            try {
                unregisterReceiver(mediaCommandReceiver);
            } catch (Exception e) {}
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception e) {}
        }
        super.onDestroy();
    }

    /**
     * JavaScript interface exposed to the WebView as window.AndroidBridge
     */
    public class AndroidBridge {

        @JavascriptInterface
        public void startService(String title, String artist, String thumbnail) {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_PLAY);
            intent.putExtra("title", title);
            intent.putExtra("artist", artist);
            intent.putExtra("thumbnail", thumbnail);

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    MainActivity.this.startForegroundService(intent);
                } else {
                    MainActivity.this.startService(intent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void pauseService() {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_PAUSE);
            try {
                MainActivity.this.startService(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void resumeService() {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_PLAY);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    MainActivity.this.startForegroundService(intent);
                } else {
                    MainActivity.this.startService(intent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void stopService() {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_STOP);
            try {
                MainActivity.this.startService(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void updateMetadata(String title, String artist, String thumbnail) {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_UPDATE_META);
            intent.putExtra("title", title);
            intent.putExtra("artist", artist);
            intent.putExtra("thumbnail", thumbnail);
            try {
                MainActivity.this.startService(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        /**
         * Expose wake lock control to JavaScript so the service foreground
         * can be started at the right time (when playback actually starts)
         */
        @JavascriptInterface
        public void acquireWakeLock() {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire();
            }
        }

        @JavascriptInterface
        public void releaseWakeLock() {
            if (wakeLock != null && wakeLock.isHeld()) {
                try {
                    wakeLock.release();
                } catch (Exception e) {}
            }
        }
    }
}
