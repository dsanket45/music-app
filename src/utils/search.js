// src/utils/search.js
// Uses our Netlify serverless function that proxies JioSaavn API 
// and decrypts media URLs server-side to get direct 320kbps MP3 URLs
import axios from 'axios';

// Our own Netlify function handles JioSaavn API + DES decryption
const API_BASE = '/.netlify/functions/saavn';

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export const cleanTitle = cleanText;
export const cleanArtist = cleanText;
export const getGlobalSongId = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Search songs — returns songs with direct MP3 streaming URLs
 */
export const searchYouTube = async (query) => {
  if (!query || !query.trim()) {
    return getTrendingIndianMusic();
  }

  console.log("🔍 Searching JioSaavn:", query);

  try {
    const res = await axios.get(API_BASE, {
      params: { action: 'search', query: query.trim(), limit: '20' },
      timeout: 10000,
    });

    if (res.data && res.data.success && res.data.songs && res.data.songs.length > 0) {
      console.log(`✅ Found ${res.data.songs.length} songs`);
      return res.data.songs;
    }
  } catch (err) {
    console.warn("Search error:", err.message);
    // Fallback: try direct JioSaavn API without decryption
    return searchDirectFallback(query);
  }

  return getTrendingIndianMusic();
};

/**
 * Fallback: query JioSaavn directly (media URLs may not be decrypted)
 */
async function searchDirectFallback(query) {
  try {
    const res = await axios.get('https://www.jiosaavn.com/api.php', {
      params: {
        __call: 'search.getResults',
        _format: 'json',
        _marker: '0',
        p: '1',
        q: query,
        n: '15'
      },
      timeout: 8000,
    });

    if (res.data && res.data.results) {
      return res.data.results
        .filter(s => s.id && s.media_preview_url)
        .map(s => ({
          songId: s.id,
          id: s.id,
          title: cleanText(s.song || ''),
          artist: cleanText(s.primary_artists || s.singers || ''),
          album: cleanText(s.album || 'Single'),
          thumbnail: (s.image || '').replace('150x150', '500x500'),
          duration: formatDuration(parseInt(s.duration) || 210),
          durationSec: parseInt(s.duration) || 210,
          language: s.language || 'hindi',
          globalId: (s.id || '').toLowerCase(),
          // Use preview URL as stream (96kbps but guaranteed to work)
          streamUrl: s.media_preview_url || '',
          previewUrl: s.media_preview_url || '',
        }))
        .filter(s => s.streamUrl);
    }
  } catch (e) {
    console.warn('Direct fallback failed:', e.message);
  }
  return FALLBACK_CATALOG;
}

/**
 * Get trending songs
 */
export const getTrendingIndianMusic = async () => {
  console.log("🔥 Fetching trending...");

  try {
    const res = await axios.get(API_BASE, {
      params: { action: 'trending' },
      timeout: 10000,
    });

    if (res.data && res.data.success && res.data.songs && res.data.songs.length > 0) {
      console.log(`✅ Got ${res.data.songs.length} trending songs`);
      return res.data.songs;
    }
  } catch (err) {
    console.warn("Trending error:", err.message);
    return searchDirectFallback('trending bollywood songs');
  }

  return FALLBACK_CATALOG;
};

export const getRelatedVideos = async (title) => title ? searchYouTube(title) : getTrendingIndianMusic();
export const getFreshTrending = async () => getTrendingIndianMusic();
export const forceRefreshTrending = () => {};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Hardcoded fallback for when all APIs fail
const FALLBACK_CATALOG = [
  {
    songId: "rjkrTnma", id: "rjkrTnma",
    title: "Kesariya", artist: "Pritam, Arijit Singh",
    album: "Brahmastra",
    thumbnail: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    duration: "4:28", durationSec: 268, language: "hindi", globalId: "rjkrtnma",
    streamUrl: "", previewUrl: "",
  },
  {
    songId: "aRZbUYD7", id: "aRZbUYD7",
    title: "Tum Hi Ho", artist: "Mithoon, Arijit Singh",
    album: "Aashiqui 2",
    thumbnail: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    duration: "4:22", durationSec: 262, language: "hindi", globalId: "arzbuydb7",
    streamUrl: "", previewUrl: "",
  },
];