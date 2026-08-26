// src/utils/search.js
import axios from 'axios';

export const cleanTitle = (title) => {
  if (!title) return 'Unknown Title';
  return title
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s*\|\s*[^|]*$/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*(official|video|audio|lyrics|hd|4k|full song|full video)[^)]*\)/gi, '')
    .trim();
};

export const cleanArtist = (artist) => {
  if (!artist) return 'Unknown Artist';
  return artist
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/ - Topic$/i, '')
    .replace(/VEVO$/i, '')
    .trim();
};

export const getGlobalSongId = (title) => {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

// Verified Full-Length Instant Catalog
const FULL_LENGTH_CATALOG = [
  {
    songId: "BddP6PYo2gs",
    id: "BddP6PYo2gs",
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    album: "Brahmāstra",
    thumbnail: "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg",
    duration: "4:28",
    durationSec: 268,
    language: "hindi",
    globalId: "kesariya"
  },
  {
    songId: "VAdGW7QDJhU",
    id: "VAdGW7QDJhU",
    title: "Chaleya",
    artist: "Anirudh Ravichander, Arijit Singh, Shilpa Rao",
    album: "Jawan",
    thumbnail: "https://i.ytimg.com/vi/VAdGW7QDJhU/hqdefault.jpg",
    duration: "3:20",
    durationSec: 200,
    language: "hindi",
    globalId: "chaleya"
  },
  {
    songId: "ElZfdU54Cp8",
    id: "ElZfdU54Cp8",
    title: "Apna Bana Le",
    artist: "Sachin-Jigar, Arijit Singh",
    album: "Bhediya",
    thumbnail: "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg",
    duration: "4:21",
    durationSec: 261,
    language: "hindi",
    globalId: "apnabanale"
  },
  {
    songId: "IJq0ydz4438",
    id: "IJq0ydz4438",
    title: "Tum Hi Ho",
    artist: "Mithoon, Arijit Singh",
    album: "Aashiqui 2",
    thumbnail: "https://i.ytimg.com/vi/IJq0ydz4438/hqdefault.jpg",
    duration: "4:22",
    durationSec: 262,
    language: "hindi",
    globalId: "tumhiho"
  },
  {
    songId: "7wtfhZwyrcc",
    id: "7wtfhZwyrcc",
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    thumbnail: "https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg",
    duration: "3:24",
    durationSec: 204,
    language: "english",
    globalId: "believer"
  },
  {
    songId: "OsU0HnnVznU",
    id: "OsU0HnnVznU",
    title: "Naatu Naatu",
    artist: "Rahul Sipligunj, Kaala Bhairava",
    album: "RRR",
    thumbnail: "https://i.ytimg.com/vi/OsU0HnnVznU/hqdefault.jpg",
    duration: "3:34",
    durationSec: 214,
    language: "telugu",
    globalId: "naatunaatu"
  },
  {
    songId: "gvyUuxdRdR4",
    id: "gvyUuxdRdR4",
    title: "Raataan Lambiyan",
    artist: "Tanishk Bagchi, Jubin Nautiyal, Asees Kaur",
    album: "Shershaah",
    thumbnail: "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg",
    duration: "3:50",
    durationSec: 230,
    language: "hindi",
    globalId: "raataanlambiyan"
  },
  {
    songId: "HjAdfT5aP_Q",
    id: "HjAdfT5aP_Q",
    title: "Pee Loon",
    artist: "Pritam, Mohit Chauhan",
    album: "Once Upon A Time In Mumbaai",
    thumbnail: "https://i.ytimg.com/vi/HjAdfT5aP_Q/hqdefault.jpg",
    duration: "4:45",
    durationSec: 285,
    language: "hindi",
    globalId: "peeloon"
  },
  {
    songId: "2TGlyLq_Z8I",
    id: "2TGlyLq_Z8I",
    title: "O Maahi",
    artist: "Pritam, Arijit Singh",
    album: "Dunki",
    thumbnail: "https://i.ytimg.com/vi/2TGlyLq_Z8I/hqdefault.jpg",
    duration: "3:53",
    durationSec: 233,
    language: "hindi",
    globalId: "omaahi"
  }
];

/**
 * Direct Live Full-Length Search with YouTube Innertube
 */
export const searchYouTube = async (query) => {
  if (!query || !query.trim()) {
    return FULL_LENGTH_CATALOG;
  }

  const cleanQuery = query.trim().toLowerCase();
  console.log("🔍 Live Search Full Length:", cleanQuery);

  // Local instant match
  const localMatches = FULL_LENGTH_CATALOG.filter(s => 
    s.title.toLowerCase().includes(cleanQuery) || 
    s.artist.toLowerCase().includes(cleanQuery)
  );

  // YouTube Innertube Search API (Zero API Keys Required, Full Results)
  try {
    const res = await axios.post(
      'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
      {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231201.00.00'
          }
        },
        query: `${cleanQuery} song`
      },
      { timeout: 7000 }
    );

    const section = res.data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;

    if (section && section.length > 0) {
      const results = [];
      for (const item of section) {
        const v = item.videoRenderer;
        if (v && v.videoId) {
          const rawTitle = v.title?.runs?.[0]?.text || '';
          const rawArtist = v.ownerText?.runs?.[0]?.text || '';
          const durationStr = v.lengthText?.simpleText || '3:30';
          const thumb = v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

          results.push({
            songId: v.videoId,
            id: v.videoId,
            title: cleanTitle(rawTitle),
            artist: cleanArtist(rawArtist),
            album: 'Single',
            duration: durationStr,
            durationSec: parseSeconds(durationStr),
            thumbnail: thumb,
            language: 'hindi',
            globalId: getGlobalSongId(rawTitle)
          });
        }
      }

      if (results.length > 0) {
        return [...localMatches, ...results.filter(r => !localMatches.some(lm => lm.songId === r.songId))];
      }
    }
  } catch (err) {
    console.warn("YouTube Innertube search error, using catalog:", err.message);
  }

  return localMatches.length > 0 ? localMatches : FULL_LENGTH_CATALOG;
};

export const getTrendingIndianMusic = async () => {
  return FULL_LENGTH_CATALOG;
};

export const getRelatedVideos = async () => FULL_LENGTH_CATALOG;
export const getFreshTrending = async () => FULL_LENGTH_CATALOG;
export const forceRefreshTrending = () => {};

function parseSeconds(durationStr) {
  if (!durationStr) return 210;
  if (typeof durationStr === 'number') return durationStr;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}