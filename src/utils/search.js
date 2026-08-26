// src/utils/search.js
import axios from 'axios';

const SAAVN_BASE_URL = 'https://jiosaavn-api.vercel.app';

export const cleanTitle = (title) => {
  if (!title) return 'Unknown Title';
  return title
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s*\|\s*[^|]*$/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*(video|audio|lyrics|hd|4k)[^)]*\)/gi, '')
    .trim();
};

export const cleanArtist = (artist) => {
  if (!artist) return 'Unknown Artist';
  return artist
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .trim();
};

export const getGlobalSongId = (title) => {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Direct Audio Search using JioSaavn API
 */
export const searchYouTube = async (query, options = {}) => {
  if (!query || !query.trim()) {
    return getTrendingIndianMusic();
  }

  const cleanQuery = query.trim();
  console.log("🔍 Direct Audio Search:", cleanQuery);

  try {
    const res = await axios.get(`${SAAVN_BASE_URL}/search`, {
      params: { query: cleanQuery },
      timeout: 7000
    });

    if (res.data && res.data.results && res.data.results.length > 0) {
      const songs = res.data.results.map(item => {
        const title = cleanTitle(item.title || item.song);
        const artist = cleanArtist(item.more_info?.singers || item.primary_artists || item.artist || item.description);
        const thumbnail = item.images?.['500x500'] || item.images?.['150x150'] || item.image || '';
        
        return {
          songId: item.id,
          id: item.id,
          saavnId: item.id,
          title,
          artist,
          thumbnail,
          album: item.album || 'Single',
          duration: item.duration || '3:30',
          durationSec: parseSeconds(item.duration),
          language: item.more_info?.language?.toLowerCase() || 'hindi',
          globalId: getGlobalSongId(title)
        };
      });

      console.log(`✅ Direct Audio found ${songs.length} songs for "${cleanQuery}"`);
      return songs;
    }
  } catch (err) {
    console.warn("⚠️ Saavn search error:", err.message);
  }

  return getFallbackSongs(cleanQuery);
};

/**
 * Get Trending Top Hits across Indian & Global charts
 */
export const getTrendingIndianMusic = async () => {
  const trendingQueries = [
    'Arijit Singh top hits',
    'Latest Hindi Songs',
    'Trending Tamil Songs',
    'Trending Telugu Songs',
    'Global Top Hits'
  ];

  const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];

  try {
    const res = await axios.get(`${SAAVN_BASE_URL}/search`, {
      params: { query: randomQuery },
      timeout: 7000
    });

    if (res.data && res.data.results && res.data.results.length > 0) {
      return res.data.results.map(item => {
        const title = cleanTitle(item.title || item.song);
        const artist = cleanArtist(item.more_info?.singers || item.primary_artists || item.artist || item.description);
        const thumbnail = item.images?.['500x500'] || item.images?.['150x150'] || item.image || '';

        return {
          songId: item.id,
          id: item.id,
          saavnId: item.id,
          title,
          artist,
          thumbnail,
          album: item.album || 'Single',
          duration: item.duration || '3:30',
          durationSec: parseSeconds(item.duration),
          language: item.more_info?.language?.toLowerCase() || 'hindi',
          globalId: getGlobalSongId(title)
        };
      });
    }
  } catch (err) {
    console.warn("⚠️ Trending fetch error:", err.message);
  }

  return getFallbackSongs('trending');
};

export const getRelatedVideos = async (videoId) => {
  return searchYouTube('popular songs');
};

export const getFreshTrending = async (language = 'hindi') => {
  return searchYouTube(`latest ${language} songs`);
};

export const forceRefreshTrending = () => {
  localStorage.removeItem('trending_songs_cache_v2');
};

function parseSeconds(durationStr) {
  if (!durationStr) return 210;
  if (typeof durationStr === 'number') return durationStr;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}

function getFallbackSongs(query = '') {
  return [
    {
      songId: 'rjkrTnma',
      id: 'rjkrTnma',
      saavnId: 'rjkrTnma',
      title: 'Kesariya',
      artist: 'Arijit Singh, Pritam',
      thumbnail: 'https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg',
      album: 'Brahmastra',
      duration: '4:28',
      durationSec: 268,
      language: 'hindi',
      globalId: 'kesariya'
    },
    {
      songId: 'mno345pqr67',
      id: 'mno345pqr67',
      saavnId: 'mno345pqr67',
      title: 'Chaleya',
      artist: 'Arijit Singh, Shilpa Rao',
      thumbnail: 'https://c.saavncdn.com/026/Jawan-Hindi-2023-20230905151010-500x500.jpg',
      album: 'Jawan',
      duration: '3:20',
      durationSec: 200,
      language: 'hindi',
      globalId: 'chaleya'
    },
    {
      songId: 'believer123',
      id: 'believer123',
      saavnId: 'believer123',
      title: 'Believer',
      artist: 'Imagine Dragons',
      thumbnail: 'https://c.saavncdn.com/044/Evolve-English-2017-500x500.jpg',
      album: 'Evolve',
      duration: '3:24',
      durationSec: 204,
      language: 'english',
      globalId: 'believer'
    }
  ];
}