package com.sanket.musicapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private BroadcastReceiver mediaCommandReceiver;
    private AndroidBridge bridgeInterface;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on during active playback if needed
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

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
        setupWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupWebViewSettings();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().resumeTimers();
        }
    }

    private void setupWebViewSettings() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Add JavaScript interface for native bridge communication
            webView.addJavascriptInterface(bridgeInterface, "AndroidBridge");
        }
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            if (webView.canGoBack()) {
                webView.goBack();
            } else {
                moveTaskToBack(true);
            }
        } else {
            moveTaskToBack(true);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Keep WebView active for background audio playback
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // Keep WebView active for background audio playback
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onDestroy() {
        if (mediaCommandReceiver != null) {
            try {
                unregisterReceiver(mediaCommandReceiver);
            } catch (Exception e) {}
        }
        super.onDestroy();
    }

    /**
     * JavaScript interface exposed to the WebView as window.AndroidBridge
     * Allows JS code to start/stop the foreground service and update metadata
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
                MainActivity.this.startService(intent);
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
    }
}
