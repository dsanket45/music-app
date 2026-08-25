// src/utils/fileStorage.js
import { openDB } from 'idb';

const DB_NAME = 'OfflineMusicDB';
const STORE_NAME = 'downloadedSongs';

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'songId' });
        store.createIndex('savedAt', 'savedAt');
      }
    },
  });
}

// Save file to system + store fileHandle for later access
export async function saveSongToFileSystem(song, blob) {
  if (!('showSaveFilePicker' in window)) {
    throw new Error('File System Access API not supported');
  }

  const filename = `${sanitizeFileName(song.title)}.mp3`;
  let fileHandle;
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'MP3 Audio', accept: { 'audio/mpeg': ['.mp3'] } }],
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('User cancelled save');
    }
    throw err;
  }

  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  // Store metadata + fileHandle (browsers allow this)
  const db = await initDB();
  await db.put(STORE_NAME, {
    songId: song.songId,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
    fileHandle,
    savedAt: Date.now(),
  });

  return true;
}

// Get saved file from stored handle
export async function getSavedSongFile(songId) {
  const db = await initDB();
  const record = await db.get(STORE_NAME, songId);
  if (!record || !record.fileHandle) return null;

  try {
    const file = await record.fileHandle.getFile();
    return { file, metadata: record };
  } catch (err) {
    console.warn('File access revoked (moved/deleted)', err);
    // Clean up stale entry
    await db.delete(STORE_NAME, songId);
    return null;
  }
}

// List all downloaded songs (for library)
export async function listDownloadedSongs() {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
}

// Helper
function sanitizeFileName(name = 'song') {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 150);
}