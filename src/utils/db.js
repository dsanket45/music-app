// src/utils/db.js
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid'; // npm i uuid

const DB_NAME = 'MusicAppDB';
const VERSION = 3;

export const initDB = async () => {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      // ================= Preferences =================
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'id' });
      }

      // ================= Liked Songs =================
      if (!db.objectStoreNames.contains('likedSongs')) {
        db.createObjectStore('likedSongs', { keyPath: 'songId' });
      }

      // ================= Recently Played =================
      if (!db.objectStoreNames.contains('recentlyPlayed')) {
        db.createObjectStore('recentlyPlayed', { keyPath: 'songId' });
      }

      // ================= Most Played =================
      if (!db.objectStoreNames.contains('mostPlayed')) {
        db.createObjectStore('mostPlayed', { keyPath: 'songId' });
      }

      // ================= Songs =================
      if (!db.objectStoreNames.contains('songs')) {
        const store = db.createObjectStore('songs', { keyPath: 'songId' });
        store.createIndex('playCount', 'playCount');
        store.createIndex('lastPlayed', 'lastPlayed');
      }

      // ================= Playlists =================
      if (!db.objectStoreNames.contains('playlists')) {
        const store = db.createObjectStore('playlists', {
          keyPath: 'id',
        });
        store.createIndex('name', 'name');
      }

      // ================= Downloaded Songs =================
if (!db.objectStoreNames.contains('downloadedSongs')) {
  db.createObjectStore('downloadedSongs', { keyPath: 'songId' });
}

      // ================= Search History =================
      if (!db.objectStoreNames.contains('searchHistory')) {
        const store = db.createObjectStore('searchHistory', { keyPath: 'songId' });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
};

// ================= Preferences =================
// src/utils/db.js

export const savePreferences = async (partialPrefs) => {
  const db = await initDB();
  
  // Get existing preferences
  const existing = (await db.get('preferences', 'userPrefs')) || {};
  
  // Merge new prefs into existing
  const updated = {
    id: 'userPrefs',
    ...existing,
    ...partialPrefs
  };
  
  await db.put('preferences', updated);
  return updated;
};

export const getPreferences = async () => {
  const db = await initDB();
  return (await db.get('preferences', 'userPrefs')) || {};
};

// ================= Liked Songs =================
export const toggleLike = async (song) => {
  const db = await initDB();
  const existing = await db.get('likedSongs', song.songId);
  if (existing) {
    await db.delete('likedSongs', song.songId);
    return false;
  } else {
    await db.put('likedSongs', { ...song, likedAt: Date.now() });
    return true;
  }
};

export const getLikedSongs = async () => {
  const db = await initDB();
  const songs = await db.getAll('likedSongs');
  return songs.sort((a, b) => (b.likedAt || 0) - (a.likedAt || 0));
};

// ================= Recently Played =================
export const addRecentlyPlayed = async (song) => {
  const db = await initDB();
  await db.put('recentlyPlayed', { ...song, timestamp: Date.now() });
  await trackPlay(song);
};

export const getRecentlyPlayed = async () => {
  const db = await initDB();
  const all = await db.getAll('recentlyPlayed');
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
};

// ================= Most Played =================
export const addMostPlayed = async (song) => {
  const db = await initDB();
  const existing = await db.get('mostPlayed', song.songId);
  const updated = { ...song, plays: existing ? existing.plays + 1 : 1 };
  await db.put('mostPlayed', updated);
  await trackPlay(song);
};

export const getMostPlayed = async () => {
  const db = await initDB();
  const all = await db.getAll('mostPlayed');
  return all.sort((a, b) => b.plays - a.plays).slice(0, 10);
};

// ================= Song Tracking =================
export const trackPlay = async (song) => {
  const db = await initDB();
  const existing = await db.get('songs', song.songId);
  if (existing) {
    existing.playCount = (existing.playCount || 0) + 1;
    existing.lastPlayed = Date.now();
    await db.put('songs', existing);
  } else {
    await db.put('songs', {
      ...song,
      playCount: 1,
      lastPlayed: Date.now(),
    });
  }
};

// ================= Playlists =================
export const createPlaylist = async (name) => {
  if (!name || name.trim() === '') throw new Error('Playlist name is required');
  const db = await initDB();
  const store = db.transaction('playlists', 'readwrite').objectStore('playlists');

  const playlist = {
    id: uuidv4(),
    name: name.trim(),
    songs: [],
    createdAt: Date.now(),
  };

  await store.add(playlist);
  return playlist;
};

export const getPlaylists = async () => {
  const db = await initDB();
  return db.getAll('playlists');
};

export const getPlaylist = async (id) => {
  const db = await initDB();
  return db.get('playlists', id);
};

export const addSongToPlaylist = async (playlistId, song) => {
  const db = await initDB();
  const playlist = await db.get('playlists', playlistId);
  if (playlist && !playlist.songs.some(s => s.songId === song.songId)) {
    playlist.songs.push(song);
    await db.put('playlists', playlist);
  }
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  const db = await initDB();
  const playlist = await db.get('playlists', playlistId);
  if (playlist) {
    playlist.songs = playlist.songs.filter(s => s.songId !== songId);
    await db.put('playlists', playlist);
  }
};

export const deletePlaylist = async (id) => {
  const db = await initDB();
  await db.delete('playlists', id);
};

export const updatePlaylistName = async (id, newName) => {
  const db = await initDB();
  const playlist = await db.get('playlists', id);
  if (playlist) {
    playlist.name = newName.trim();
    await db.put('playlists', playlist);
  }
};

// ================= Search History =================
// Stores last 30 songs searched
export const addSearchHistorySong = async (song) => {
  const db = await initDB();
  const all = await db.getAll('searchHistory');

  // Remove existing song if already in history
  const existingIndex = all.findIndex(s => s.songId === song.songId);
  if (existingIndex !== -1) {
    all.splice(existingIndex, 1);
  }

  // Add new song at the beginning
  await db.put('searchHistory', { ...song, timestamp: Date.now() });

  // Keep only last 30 songs
  if (all.length >= 30) {
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = sorted.slice(30 - 1); // delete oldest
    for (const s of toDelete) {
      await db.delete('searchHistory', s.songId);
    }
  }
};

export const getSearchHistory = async () => {
  const db = await initDB();
  const all = await db.getAll('searchHistory');
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
};

export const removeFromSearchHistory = async (songId) => {
  const db = await initDB();
  await db.delete('searchHistory', songId);
};


// Save downloaded song with fileHandle
export const saveDownloadedSong = async (song, fileHandle) => {
  const db = await initDB();
  await db.put('downloadedSongs', {
    songId: song.songId,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
    language: song.language,
    fileHandle,
    downloadedAt: Date.now(),
  });
};

// Get all downloaded songs
export const getDownloadedSongs = async () => {
  const db = await initDB();
  return await db.getAll('downloadedSongs');
};

// Get one downloaded song by ID
export const getDownloadedSong = async (songId) => {
  const db = await initDB();
  return await db.get('downloadedSongs', songId);
};
