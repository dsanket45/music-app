package com.sanket.musicapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private BroadcastReceiver mediaCommandReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);

            // Add JavaScript interface for native bridge communication
            webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
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
        // Keep WebView timers running for background audio
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // Keep WebView timers running for background audio
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onDestroy() {
        if (mediaCommandReceiver != null) {
            unregisterReceiver(mediaCommandReceiver);
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

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
        }

        @JavascriptInterface
        public void pauseService() {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_PAUSE);
            startService(intent);
        }

        @JavascriptInterface
        public void resumeService() {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_PLAY);
            startService(intent);
        }

        @JavascriptInterface
        public void stopService() {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_STOP);
            startService(intent);
        }

        @JavascriptInterface
        public void updateMetadata(String title, String artist, String thumbnail) {
            Intent intent = new Intent(MainActivity.this, MusicPlaybackService.class);
            intent.setAction(MusicPlaybackService.ACTION_UPDATE_META);
            intent.putExtra("title", title);
            intent.putExtra("artist", artist);
            intent.putExtra("thumbnail", thumbnail);
            startService(intent);
        }
    }
}
