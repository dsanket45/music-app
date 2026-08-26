package com.sanket.musicapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
                // Signal WebView to play
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

        // Acquire partial wake lock to keep CPU alive for audio
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DMusic::AudioWakeLock");
        wakeLock.acquire();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
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
                startForeground(NOTIFICATION_ID, buildNotification());
                break;

            case ACTION_PAUSE:
                isPlaying = false;
                updatePlaybackState();
                updateNotification();
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
                // Initial start — show notification immediately
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
        // Intent to open the app when notification is tapped
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPending = PendingIntent.getActivity(
            this, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Media control intents
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
            .setOngoing(isPlaying)
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
                       PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                       PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                       PlaybackStateCompat.ACTION_STOP;

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
        // Use a broadcast to communicate with MainActivity
        Intent broadcastIntent = new Intent("com.sanket.musicapp.MEDIA_COMMAND");
        broadcastIntent.putExtra("command", command);
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
        super.onDestroy();
    }
}
