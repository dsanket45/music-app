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

// Verified Instant-Play Music Catalog
const VERIFIED_CATALOG = [
  {
    songId: "rjkrTnma",
    id: "rjkrTnma",
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    album: "Brahmastra",
    thumbnail: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/871/jliIGBI61Lb21rJf6x3gLXgqwzFKoKpKWRrbP44xeHUmE_160.mp4",
    duration: "4:28",
    durationSec: 268,
    language: "hindi",
    globalId: "kesariya"
  },
  {
    songId: "faloMmjX",
    id: "faloMmjX",
    title: "Chaleya",
    artist: "Anirudh Ravichander, Arijit Singh, Shilpa Rao",
    album: "Jawan",
    thumbnail: "https://c.saavncdn.com/026/Jawan-Hindi-2023-20230905151010-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/047/wixuej4iAqLK7tpB27C0DSjaT9yujWiEQ_160.mp4",
    duration: "3:20",
    durationSec: 200,
    language: "hindi",
    globalId: "chaleya"
  },
  {
    songId: "koWi7GRH",
    id: "koWi7GRH",
    title: "Apna Bana Le",
    artist: "Sachin-Jigar, Arijit Singh",
    album: "Bhediya",
    thumbnail: "https://c.saavncdn.com/228/Sachin-Jigar-Bollywood-Hits-Hindi-2026-20260630213800-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/228/3jBXL40r9QokfQUg3J3pAAF2bPhXvWdkfAuqEkQqYPOjL_160.mp4",
    duration: "4:21",
    durationSec: 261,
    language: "hindi",
    globalId: "apnabanale"
  },
  {
    songId: "aRZbUYD7",
    id: "aRZbUYD7",
    title: "Tum Hi Ho",
    artist: "Mithoon, Arijit Singh",
    album: "Aashiqui 2",
    thumbnail: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/430/ZhMYrwMktzetYA0n3XclloledqpoaUWbIyHKZ_160.mp4",
    duration: "4:22",
    durationSec: 262,
    language: "hindi",
    globalId: "tumhiho"
  },
  {
    songId: "-JkPBIE7",
    id: "-JkPBIE7",
    title: "Naatu Naatu",
    artist: "Rahul Sipligunj, Kaala Bhairava, M.M. Keeravaani",
    album: "RRR",
    thumbnail: "https://c.saavncdn.com/683/RRR-Telugu-Telugu-2022-20250828171313-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/683/0OJ7nVDlPT85rs3CwckLOBVDa6ujbTBWWjIs3EW_160.mp4",
    duration: "3:34",
    durationSec: 214,
    language: "telugu",
    globalId: "naatunaatu"
  },
  {
    songId: "ARuXdxyk",
    id: "ARuXdxyk",
    title: "Kurchi Madathapetti",
    artist: "Thaman S, Sri Krishna, Sahithi Chaganti",
    album: "Guntur Kaaram",
    thumbnail: "https://c.saavncdn.com/000/Guntur-Kaaram-Telugu-2023-20240126145901-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/000/AA0NyikYVkBvvIrwNzE6TD2062NZnRNjRg67xFZrp_160.mp4",
    duration: "3:36",
    durationSec: 216,
    language: "telugu",
    globalId: "kurchimadathapetti"
  },
  {
    songId: "mPTrDSun",
    id: "mPTrDSun",
    title: "Raataan Lambiyan",
    artist: "Tanishk Bagchi, Jubin Nautiyal, Asees Kaur",
    album: "Shershaah",
    thumbnail: "https://c.saavncdn.com/238/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/238/fqDfUWHNpiV8EOqHOGx1NcfJWdi1kfuiNdKvQx1C_160.mp4",
    duration: "3:50",
    durationSec: 230,
    language: "hindi",
    globalId: "raataanlambiyan"
  },
  {
    songId: "llxluOsu",
    id: "llxluOsu",
    title: "Pee Loon",
    artist: "Pritam, Mohit Chauhan",
    album: "Once Upon A Time In Mumbaai",
    thumbnail: "https://c.saavncdn.com/512/Once-Upon-A-Time-In-Mumbaai-Hindi-2010-20241223141749-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/512/O9cAkmLtjoQRNUiIJgWHxP0rwvUqtRktwgdCkKrLzTfiT_160.mp4",
    duration: "4:45",
    durationSec: 285,
    language: "hindi",
    globalId: "peeloon"
  },
  {
    songId: "wcsDiSsA",
    id: "wcsDiSsA",
    title: "O Maahi",
    artist: "Pritam, Arijit Singh, Irshad Kamil",
    album: "Dunki",
    thumbnail: "https://c.saavncdn.com/139/Dunki-Hindi-2023-20231220211003-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/139/uMiVaW4yLmWAVHnIVqAtCVcArZzYd5ngm7qAT8CPk_160.mp4",
    duration: "3:53",
    durationSec: 233,
    language: "hindi",
    globalId: "omaahi"
  },
  {
    songId: "YiVML4Zo",
    id: "YiVML4Zo",
    title: "Gehra Hua",
    artist: "Shashwat Sachdev, Arijit Singh",
    album: "Dhurandhar",
    thumbnail: "https://c.saavncdn.com/450/Gehra-Hua-From-Dhurandhar-Hindi-2025-20251205154217-500x500.jpg",
    mediaUrl: "https://aac.saavncdn.com/450/owi6T8FJbV0LMeuerlowSyRYWZgcU5Jjehv_160.mp4",
    duration: "3:40",
    durationSec: 220,
    language: "hindi",
    globalId: "gehrahua"
  }
];

/**
 * Direct Audio Search with stream resolution
 */
export const searchYouTube = async (query) => {
  if (!query || !query.trim()) {
    return VERIFIED_CATALOG;
  }

  const cleanQuery = query.trim().toLowerCase();
  console.log("🔍 Direct Audio Search:", cleanQuery);

  // Check local verified catalog first for instant response
  const localMatches = VERIFIED_CATALOG.filter(s => 
    s.title.toLowerCase().includes(cleanQuery) || 
    s.artist.toLowerCase().includes(cleanQuery)
  );

  try {
    const res = await axios.get(`${SAAVN_BASE_URL}/search`, {
      params: { query: cleanQuery },
      timeout: 8000
    });

    if (res.data?.results?.length > 0) {
      const songs = res.data.results.map(item => {
        const title = cleanTitle(item.title || item.song);
        const artist = cleanArtist(item.more_info?.singers || item.primary_artists || item.artist || item.description);
        const thumbnail = item.images?.['500x500'] || item.images?.['150x150'] || item.image || '';

        return {
          songId: item.id,
          id: item.id,
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

      // Put verified local matches first if any
      const combined = [...localMatches, ...songs.filter(s => !localMatches.some(lm => lm.title === s.title))];
      return combined;
    }
  } catch (err) {
    console.warn("⚠️ Live search error, returning catalog matches:", err.message);
  }

  return localMatches.length > 0 ? localMatches : VERIFIED_CATALOG;
};

/**
 * Get Trending Top Hits
 */
export const getTrendingIndianMusic = async () => {
  try {
    const res = await axios.get(`${SAAVN_BASE_URL}/search`, {
      params: { query: "Arijit Singh top hits" },
      timeout: 6000
    });

    if (res.data?.results?.length > 0) {
      const liveTrending = res.data.results.map(item => {
        const title = cleanTitle(item.title || item.song);
        const artist = cleanArtist(item.more_info?.singers || item.primary_artists || item.artist || item.description);
        const thumbnail = item.images?.['500x500'] || item.images?.['150x150'] || item.image || '';

        return {
          songId: item.id,
          id: item.id,
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

      return [...VERIFIED_CATALOG.slice(0, 4), ...liveTrending];
    }
  } catch (e) {
    console.warn("Trending fetch fallback to verified catalog:", e.message);
  }

  return VERIFIED_CATALOG;
};

export const getRelatedVideos = async () => VERIFIED_CATALOG;
export const getFreshTrending = async () => VERIFIED_CATALOG;
export const forceRefreshTrending = () => {};

function parseSeconds(durationStr) {
  if (!durationStr) return 210;
  if (typeof durationStr === 'number') return durationStr;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}