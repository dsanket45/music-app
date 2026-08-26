package com.sanket.musicapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MusicPlaybackService extends Service {

    private static final String TAG = "MusicPlaybackService";
    private static final String CHANNEL_ID = "dmusic_playback_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_PLAY = "com.sanket.musicapp.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.sanket.musicapp.ACTION_PAUSE";
    public static final String ACTION_NEXT = "com.sanket.musicapp.ACTION_NEXT";
    public static final String ACTION_PREV = "com.sanket.musicapp.ACTION_PREV";
    public static final String ACTION_STOP = "com.sanket.musicapp.ACTION_STOP";
    public static final String ACTION_UPDATE_META = "com.sanket.musicapp.ACTION_UPDATE_META";

    private MediaSessionCompat mediaSession;
    private PowerManager.WakeLock wakeLock;
    private PowerManager.WakeLock screenWakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean isPlaying = false;

    private String currentTitle = "D Music";
    private String currentArtist = "Unknown Artist";
    private String currentThumbnailUrl = "";
    private Bitmap currentThumbnailBitmap = null;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "MusicPlaybackService created");

        createNotificationChannel();

        // Acquire audio focus to prevent other apps from stealing audio
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        requestAudioFocus();

        // Create MediaSession for lock-screen & notification controls
        mediaSession = new MediaSessionCompat(this, "DMusic");
        mediaSession.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                Log.d(TAG, "MediaSession: Play");
                isPlaying = true;
                updatePlaybackState();
                updateNotification();
                sendCommandToWebView("play");
            }

            @Override
            public void onPause() {
                Log.d(TAG, "MediaSession: Pause");
                isPlaying = false;
                updatePlaybackState();
                updateNotification();
                sendCommandToWebView("pause");
            }

            @Override
            public void onSkipToNext() {
                Log.d(TAG, "MediaSession: Next");
                sendCommandToWebView("next");
            }

            @Override
            public void onSkipToPrevious() {
                Log.d(TAG, "MediaSession: Previous");
                sendCommandToWebView("prev");
            }

            @Override
            public void onStop() {
                Log.d(TAG, "MediaSession: Stop");
                isPlaying = false;
                updatePlaybackState();
                stopForeground(true);
                stopSelf();
            }
        });

        mediaSession.setActive(true);
        updatePlaybackState();

        // Acquire PARTIAL_WAKE_LOCK — keeps CPU alive for audio playback
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DMusic::ServiceWakeLock");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire();

        // Also acquire a WIFI lock to keep network alive for streaming
        android.net.wifi.WifiManager wifiManager = (android.net.wifi.WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
        if (wifiManager != null) {
            android.net.wifi.WifiManager.WifiLock wifiLock = wifiManager.createWifiLock(
                android.net.wifi.WifiManager.WIFI_MODE_FULL_HIGH_PERF, "DMusic::WifiLock"
            );
            wifiLock.acquire();
        }
    }

    private void requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(focusChange -> {
                    switch (focusChange) {
                        case AudioManager.AUDIOFOCUS_LOSS:
                            // Another app took audio focus permanently
                            sendCommandToWebView("pause");
                            break;
                        case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                            // Temporarily lost (phone call, etc)
                            sendCommandToWebView("pause");
                            break;
                        case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                            // Can duck the volume
                            break;
                        case AudioManager.AUDIOFOCUS_GAIN:
                            // Regained audio focus
                            sendCommandToWebView("play");
                            break;
                    }
                })
                .build();

            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(
                focusChange -> {},
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            );
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            // Service restarted by system — show a basic notification to stay alive
            isPlaying = true;
            startForeground(NOTIFICATION_ID, buildNotification());
            return START_STICKY;
        }

        String action = intent.getAction();
        if (action == null) {
            action = "";
        }

        switch (action) {
            case ACTION_PLAY:
                isPlaying = true;
                String title = intent.getStringExtra("title");
                String artist = intent.getStringExtra("artist");
                String thumbnail = intent.getStringExtra("thumbnail");
                if (title != null) currentTitle = title;
                if (artist != null) currentArtist = artist;
                if (thumbnail != null && !thumbnail.equals(currentThumbnailUrl)) {
                    currentThumbnailUrl = thumbnail;
                    loadThumbnailAsync(thumbnail);
                }
                updatePlaybackState();
                updateMediaSessionMetadata();
                startForeground(NOTIFICATION_ID, buildNotification());
                break;

            case ACTION_PAUSE:
                isPlaying = false;
                updatePlaybackState();
                updateNotification();
                // Don't stop foreground — keep the notification visible
                break;

            case ACTION_NEXT:
                sendCommandToWebView("next");
                break;

            case ACTION_PREV:
                sendCommandToWebView("prev");
                break;

            case ACTION_STOP:
                isPlaying = false;
                updatePlaybackState();
                stopForeground(true);
                stopSelf();
                break;

            case ACTION_UPDATE_META:
                String metaTitle = intent.getStringExtra("title");
                String metaArtist = intent.getStringExtra("artist");
                String metaThumbnail = intent.getStringExtra("thumbnail");
                if (metaTitle != null) currentTitle = metaTitle;
                if (metaArtist != null) currentArtist = metaArtist;
                if (metaThumbnail != null && !metaThumbnail.equals(currentThumbnailUrl)) {
                    currentThumbnailUrl = metaThumbnail;
                    loadThumbnailAsync(metaThumbnail);
                }
                updateNotification();
                updateMediaSessionMetadata();
                break;

            default:
                isPlaying = true;
                updatePlaybackState();
                startForeground(NOTIFICATION_ID, buildNotification());
                break;
        }

        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "D Music Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controls for D Music playback");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPending = PendingIntent.getActivity(
            this, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent prevPending = createActionPendingIntent(ACTION_PREV, 1);
        PendingIntent playPausePending = createActionPendingIntent(
            isPlaying ? ACTION_PAUSE : ACTION_PLAY, 2
        );
        PendingIntent nextPending = createActionPendingIntent(ACTION_NEXT, 3);
        PendingIntent stopPending = createActionPendingIntent(ACTION_STOP, 4);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(openAppPending)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true) // Always ongoing to prevent swipe-dismiss
            .setShowWhen(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
            )
            .addAction(R.drawable.ic_skip_previous, "Previous", prevPending)
            .addAction(
                isPlaying ? R.drawable.ic_pause : R.drawable.ic_play,
                isPlaying ? "Pause" : "Play",
                playPausePending
            )
            .addAction(R.drawable.ic_skip_next, "Next", nextPending)
            .addAction(R.drawable.ic_close, "Stop", stopPending);

        if (currentThumbnailBitmap != null) {
            builder.setLargeIcon(currentThumbnailBitmap);
        }

        return builder.build();
    }

    private PendingIntent createActionPendingIntent(String action, int requestCode) {
        Intent intent = new Intent(this, MusicPlaybackService.class);
        intent.setAction(action);
        return PendingIntent.getService(
            this, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private void updatePlaybackState() {
        long actions = PlaybackStateCompat.ACTION_PLAY |
                       PlaybackStateCompat.ACTION_PAUSE |
                       PlaybackStateCompat.ACTION_PLAY_PAUSE |
                       PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                       PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                       PlaybackStateCompat.ACTION_STOP |
                       PlaybackStateCompat.ACTION_SEEK_TO;

        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(actions)
            .setState(
                isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN,
                1.0f
            );

        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void updateMediaSessionMetadata() {
        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "D Music");

        if (currentThumbnailBitmap != null) {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentThumbnailBitmap);
        }

        mediaSession.setMetadata(metaBuilder.build());
    }

    private void loadThumbnailAsync(String url) {
        new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setDoInput(true);
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.connect();
                InputStream input = connection.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(input);
                if (bitmap != null) {
                    currentThumbnailBitmap = bitmap;
                    updateMediaSessionMetadata();
                    updateNotification();
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to load thumbnail: " + e.getMessage());
            }
        }).start();
    }

    private void sendCommandToWebView(String command) {
        Intent broadcastIntent = new Intent("com.sanket.musicapp.MEDIA_COMMAND");
        broadcastIntent.putExtra("command", command);
        broadcastIntent.setPackage(getPackageName());
        sendBroadcast(broadcastIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "MusicPlaybackService destroyed");
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // When user swipes app from recents, keep service alive
        Log.d(TAG, "Task removed — service stays alive");
        // Do NOT call stopSelf() here
        super.onTaskRemoved(rootIntent);
    }
}
