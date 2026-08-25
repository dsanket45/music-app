import axios from 'axios';

// 🔑 Load YouTube API keys from .env (Vite)
const YOUTUBE_API_KEYS = import.meta.env.VITE_YOUTUBE_API_KEYS
  ? import.meta.env.VITE_YOUTUBE_API_KEYS.split(',').map(key => key.trim()).filter(Boolean)
  : [];

const OFFICIAL_MUSIC_CHANNELS = [
  "T-Series", "Sony Music India", "Zee Music Company", "Saregama", "Tips Official",
  "Venus", "Times Music", "Aditya Music", "Shemaroo Music", "Speed Records",
  "Hitz Music", "VYRL Originals", "SonyMusicSouthVEVO", "Zee Telugu",
  "Zee Tamil", "Zee Kannada", "Zee Malayalam", "Saregama Tamil", "Saregama Telugu",
  "Saregama Kannada", "Saregama Malayalam", "Muzic 24", "Anand Audio", "Divo",
  "Jeetendra", "G Series", "Mango Music", "Rhythm Boy", "Mythri Movie Makers"
];

const LANGUAGE_KEYWORDS = {
  'kannada': ['kannada', 'kannadasong', 'sandalwood', 'kannadamovie'],
  'hindi': ['hindi', 'bollywood', 'hindisong', 'hindimovie'],
  'telugu': ['telugu', 'telugusong', 'tollywood', 'telugumovie'],
  'tamil': ['tamil', 'tamilsong', 'kollywood', 'tamilmovie'],
  'malayalam': ['malayalam', 'malayalamsong', 'mollywood', 'malayalammovie'],
  'punjabi': ['punjabi', 'punjabisong', 'punjabimovie'],
  'bengali': ['bengali', 'bengalisong', 'bengalimovie']
};

const MUSIC_DATABASE = {
  'hindi': [
    {
      songId: "VNs_cCtdbPc",
      title: "Apna Bana Le",
      artist: "Arijit Singh",
      thumbnail: "https://i.ytimg.com/vi/VNs_cCtdbPc/mqdefault.jpg",
      duration: "4:21",
      durationSec: 261,
      isOfficial: true,
      language: "hindi"
    },
    {
      songId: "J---aiyznGQ",
      title: "Kesariya",
      artist: "Arijit Singh",
      thumbnail: "https://i.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg",
      duration: "4:28",
      durationSec: 268,
      isOfficial: true,
      language: "hindi"
    },
    {
      songId: "abc123def46",
      title: "Tum Hi Ho",
      artist: "Arijit Singh",
      thumbnail: "https://i.ytimg.com/vi/abc123def46/mqdefault.jpg",
      duration: "4:22",
      durationSec: 262,
      isOfficial: true,
      language: "hindi"
    }
  ],
  'tamil': [
    {
      songId: "def456ghi79",
      title: "Vikram Title Track",
      artist: "Anirudh Ravichander",
      thumbnail: "https://i.ytimg.com/vi/def456ghi79/mqdefault.jpg",
      duration: "3:48",
      durationSec: 228,
      isOfficial: true,
      language: "tamil"
    },
    {
      songId: "ghi789jkl01",
      title: "Kutty Story",
      artist: "Anirudh Ravichander",
      thumbnail: "https://i.ytimg.com/vi/ghi789jkl01/mqdefault.jpg",
      duration: "4:02",
      durationSec: 242,
      isOfficial: true,
      language: "tamil"
    }
  ],
  'telugu': [
    {
      songId: "mno345pqr67",
      title: "Butta Bomma",
      artist: "Armaan Malik",
      thumbnail: "https://i.ytimg.com/vi/mno345pqr67/mqdefault.jpg",
      duration: "3:45",
      durationSec: 225,
      isOfficial: true,
      language: "telugu"
    }
  ],
  'kannada': [
    {
      songId: "stu901vwx23",
      title: "Hebbuli - The Villain",
      artist: "V. Harikrishna",
      thumbnail: "https://i.ytimg.com/vi/stu901vwx23/mqdefault.jpg",
      duration: "4:15",
      durationSec: 255,
      isOfficial: true,
      language: "kannada"
    }
  ],
  'popular': [
    {
      songId: "J---aiyznGQ",
      title: "Kesariya - Brahmastra",
      artist: "Arijit Singh",
      thumbnail: "https://i.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg",
      duration: "4:28",
      durationSec: 268,
      isOfficial: true,
      language: "hindi"
    },
    {
      songId: "VNs_cCtdbPc",
      title: "Apna Bana Le",
      artist: "Arijit Singh",
      thumbnail: "https://i.ytimg.com/vi/VNs_cCtdbPc/mqdefault.jpg",
      duration: "4:21",
      durationSec: 261,
      isOfficial: true,
      language: "hindi"
    },
    {
      songId: "def456ghi79",
      title: "Vikram Title Track",
      artist: "Anirudh Ravichander",
      thumbnail: "https://i.ytimg.com/vi/def456ghi79/mqdefault.jpg",
      duration: "3:48",
      durationSec: 228,
      isOfficial: true,
      language: "tamil"
    },
    {
      songId: "mno345pqr67",
      title: "Butta Bomma",
      artist: "Armaan Malik",
      thumbnail: "https://i.ytimg.com/vi/mno345pqr67/mqdefault.jpg",
      duration: "3:45",
      durationSec: 225,
      isOfficial: true,
      language: "telugu"
    }
  ]
};

// 🔑 Generate global, canonical song ID
export const getGlobalSongId = (title) => {
  return title
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/(tamil|telugu|hindi|kannada|malayalam|punjabi|bengali|marathi|gujarati|dubbed|version|remix|male|female|original|reprise|unplugged|acoustic|live|cover|karaoke|from|ft|feat|featuring|with).*/gi, '')
    .replace(/(title|theme|track|song|music|video|audio|hd|4k|full|lyrics|official|mass|entry|bgm|background)/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
};

const detectLanguage = (query) => {
  const lowerQuery = query.toLowerCase();
  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return lang;
    }
  }
  return null;
};

const isYouTubeApiAvailable = () => {
  const lastApiError = localStorage.getItem('youtube_api_last_error');
  if (lastApiError) {
    const errorTime = parseInt(lastApiError);
    const now = Date.now();
    if (now - errorTime < 30 * 60 * 1000) { // 30 minutes cooldown
      return false;
    }
  }
  return true;
};

const recordApiError = () => {
  localStorage.setItem('youtube_api_last_error', Date.now().toString());
};

// ✅ IMPROVED: Skip keys with quota errors
let currentKeyIndex = 0;

const tryYouTubeApiWithFallback = async (endpoint, params, timeout = 10000) => {
  const keys = YOUTUBE_API_KEYS;
  if (keys.length === 0) {
    throw new Error("No YouTube API keys available");
  }

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (currentKeyIndex + attempt) % keys.length;
    const apiKey = keys[idx];

    try {
      const response = await axios.get(endpoint.trim(), {
        params: { ...params, key: apiKey },
        timeout
      });
      
      currentKeyIndex = (idx + 1) % keys.length;
      localStorage.removeItem('youtube_api_last_error');
      return response;
    } catch (error) {
      console.warn(`⚠️ Key ${idx} (${apiKey.substring(0, 8)}...) failed:`, error.message);

      const reason = error.response?.data?.error?.errors?.[0]?.reason;

      if (reason === 'quotaExceeded' || reason === 'keyInvalid') {
        console.warn(`🚫 Marking key ${idx} as exhausted`);
        continue;
      }

      console.warn(`🔁 Transient error — trying next key`);
    }
  }

  recordApiError();
  throw new Error("All YouTube API keys failed");
};

// ✅ DURATION HELPERS
const hasMaximumDuration = (song, maxDurationSec = 600) => song.durationSec <= maxDurationSec;
const hasMinimumDuration = (song, minDuration) => song.durationSec >= minDuration;

// 🕒 CACHE TRENDING FOR 12 HOURS (UPDATED)
const TRENDING_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

// 🎵 IMPROVED TRENDING SONGS FUNCTION
export const getTrendingIndianMusic = async () => {
  const cacheKey = 'trending_songs_cache_v2';
  const cached = localStorage.getItem(cacheKey);
  const now = Date.now();

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (now - timestamp < TRENDING_CACHE_DURATION && data.length >= 10) {
      console.log("✅ Using cached trending songs", data.length);
      return data;
    }
  }

  if (!isYouTubeApiAvailable()) {
    console.log("🔄 YouTube API rate limited, using local");
    const fallback = MUSIC_DATABASE.popular.slice(0, 15);
    localStorage.setItem(cacheKey, JSON.stringify({ 
      data: fallback, 
      timestamp: now 
    }));
    return fallback;
  }

  try {
    console.log("🎵 Fetching fresh trending songs from YouTube...");
    
    // METHOD 1: Try search with trending keywords first (more reliable)
    const trendingKeywords = [
      'new hindi songs 2024',
      'latest tamil songs',
      'new telugu songs',
      'latest kannada songs',
      'trending indian music'
    ];

    let allSongs = [];

    for (const keyword of trendingKeywords.slice(0, 2)) {
      try {
        const searchResponse = await tryYouTubeApiWithFallback(
          'https://www.googleapis.com/youtube/v3/search',
          {
            part: 'snippet',
            q: keyword,
            type: 'video',
            videoCategoryId: '10', // Music category
            maxResults: 10,
            order: 'viewCount', // Get popular ones
            publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
          },
          10000
        );

        if (searchResponse.data.items?.length) {
          const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
          const videoDetails = await getVideoDetails(videoIds);

          const songs = searchResponse.data.items
            .map(item => {
              const details = videoDetails.find(v => v.id === item.id.videoId);
              return normalizeSongItem(item, details);
            })
            .filter(song => 
              isMusicContent(song) && 
              hasMinimumDuration(song, 60) &&
              hasMaximumDuration(song, 600) &&
              isQualityChannel(song)
            );

          allSongs.push(...songs);
        }
      } catch (error) {
        console.warn(`Search with keyword "${keyword}" failed:`, error.message);
      }
    }

    // METHOD 2: Fallback to videos list if search doesn't give enough results
    if (allSongs.length < 15) {
      try {
        const videosResponse = await tryYouTubeApiWithFallback(
          'https://www.googleapis.com/youtube/v3/videos',
          {
            part: 'snippet,contentDetails,statistics',
            chart: 'mostPopular',
            videoCategoryId: '10', // Music
            maxResults: 25,
            regionCode: 'IN'
          },
          10000
        );

        if (videosResponse.data.items?.length) {
          const additionalSongs = videosResponse.data.items
            .map(item => normalizeSongItem({ 
              id: { videoId: item.id },
              snippet: item.snippet 
            }, item))
            .filter(song => 
              isMusicContent(song) && 
              hasMinimumDuration(song, 60) &&
              hasMaximumDuration(song, 600) &&
              isQualityChannel(song)
            );

          allSongs.push(...additionalSongs);
        }
      } catch (error) {
        console.warn("Videos API fallback failed:", error.message);
      }
    }

    // Process and deduplicate results
    const deduplicated = deduplicateSongs(allSongs, null);
    
    // Sort by view count and get top 15-20
    const sortedSongs = deduplicated
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 20);

    const finalResults = sortedSongs.length >= 10 ? 
      sortedSongs : 
      [...sortedSongs, ...MUSIC_DATABASE.popular].slice(0, 15);

    console.log(`🎉 Final trending results: ${finalResults.length} songs`);

    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({ 
      data: finalResults, 
      timestamp: now 
    }));

    return finalResults;

  } catch (error) {
    console.error('❌ All trending fetch methods failed:', error);
    recordApiError();
    
    const fallback = MUSIC_DATABASE.popular.slice(0, 15);
    localStorage.setItem(cacheKey, JSON.stringify({ 
      data: fallback, 
      timestamp: now 
    }));
    return fallback;
  }
};

// 🔥 Get related videos
export const getRelatedVideos = async (videoId) => {
  try {
    const response = await tryYouTubeApiWithFallback(
      'https://www.googleapis.com/youtube/v3/search',
      {
        part: 'snippet',
        relatedToVideoId: videoId,
        type: 'video',
        videoCategoryId: '10',
        maxResults: 15
      },
      8000
    );

    if (!response.data.items?.length) return [];

    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    const videoDetails = await getVideoDetails(videoIds);

    return response.data.items
      .map(item => {
        const details = videoDetails.find(v => v.id === item.id.videoId);
        return normalizeSongItem(item, details);
      })
      .filter(song => 
        isMusicContent(song) && 
        hasMinimumDuration(song, 120) &&
        hasMaximumDuration(song, 600) &&
        isQualityChannel(song)
      );
  } catch (error) {
    console.error('❌ Related videos failed:', error);
    return [];
  }
};

// 📈 Fresh songs (last 30 days)
export const getFreshTrending = async (language = 'hindi') => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const publishedAfter = thirtyDaysAgo.toISOString();

  try {
    const response = await tryYouTubeApiWithFallback(
      'https://www.googleapis.com/youtube/v3/search',
      {
        part: 'snippet',
        q: `${language} song 2024`,
        type: 'video',
        videoCategoryId: '10',
        order: 'date',
        publishedAfter,
        maxResults: 20
      },
      8000
    );

    if (!response.data.items?.length) return [];

    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    const videoDetails = await getVideoDetails(videoIds);

    return response.data.items
      .map(item => {
        const details = videoDetails.find(v => v.id === item.id.videoId);
        return normalizeSongItem(item, details);
      })
      .filter(song => 
        isMusicContent(song) && 
        hasMinimumDuration(song, 120) &&
        hasMaximumDuration(song, 600) &&
        isQualityChannel(song) &&
        song.language === language
      )
      .slice(0, 15);
  } catch (error) {
    console.error('❌ Fresh trending failed:', error);
    return [];
  }
};

const deduplicateSongs = (songs, detectedLanguage) => {
  const songMap = new Map();
  for (const song of songs) {
    const canonicalTitle = getGlobalSongId(song.title);
    const key = canonicalTitle + (song.language || '');
    
    if (!songMap.has(key)) {
      songMap.set(key, song);
    } else {
      const existing = songMap.get(key);
      // Prefer official channels, higher view count, or matching language
      if (song.isOfficial && !existing.isOfficial) {
        songMap.set(key, song);
      } else if (song.viewCount > existing.viewCount) {
        songMap.set(key, song);
      } else if (detectedLanguage && song.language === detectedLanguage && existing.language !== detectedLanguage) {
        songMap.set(key, song);
      }
    }
  }
  return Array.from(songMap.values());
};

export const searchYouTube = async (query, options = {}) => {
  try {
    const {
      enforceLanguage = true,
      minDuration = 60,
      maxResults = 15,
      prioritizeOfficial = true
    } = options;

    const cleanQuery = cleanSearchQuery(query);
    const detectedLanguage = detectLanguage(query);
    console.log("🔍 Enhanced Search:", { query: cleanQuery, detectedLanguage, options });

    let rawSongs = [];

    if (isYouTubeApiAvailable()) {
      try {
        const response = await tryYouTubeApiWithFallback(
          'https://www.googleapis.com/youtube/v3/search',
          {
            part: 'snippet',
            q: cleanQuery,
            type: 'video',
            maxResults: 25,
            videoCategoryId: '10',
            order: 'relevance'
          },
          8000
        );

        if (response.data.items?.length) {
          const videoIds = response.data.items.map(item => item.id.videoId).join(',');
          const videoDetails = await getVideoDetails(videoIds);

          rawSongs = response.data.items
            .map(item => {
              const details = videoDetails.find(v => v.id === item.id.videoId);
              return normalizeSongItem(item, details);
            })
            .filter(song => {
              return isMusicContent(song) &&
                     hasMinimumDuration(song, minDuration) &&
                     hasMaximumDuration(song, 600) &&
                     (!enforceLanguage || isSameLanguage(song, detectedLanguage, query)) &&
                     (!prioritizeOfficial || isQualityChannel(song));
            });

          console.log("✅ YouTube API returned", rawSongs.length, "songs");
        }
      } catch (apiError) {
        console.log("🔄 YouTube API failed:", apiError.message);
        recordApiError();
      }
    }

    if (rawSongs.length === 0) {
      console.log("🔄 Falling back to local database...");
      const localResults = searchLocalDatabase(cleanQuery, detectedLanguage, maxResults * 2);
      rawSongs = localResults;
    }

    const deduplicatedSongs = deduplicateSongs(rawSongs, detectedLanguage);
    const finalResults = deduplicatedSongs.slice(0, maxResults);

    return finalResults.length ? finalResults : MUSIC_DATABASE.popular.slice(0, maxResults);

  } catch (error) {
    console.error('❌ All search failed:', error);
    return MUSIC_DATABASE.popular.slice(0, 8);
  }
};

// --- Helper functions ---
const searchLocalDatabase = (query, detectedLanguage, maxResults) => {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  if (detectedLanguage && MUSIC_DATABASE[detectedLanguage]) {
    const languageSongs = MUSIC_DATABASE[detectedLanguage].filter(song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery)
    );
    results.push(...languageSongs);
  }
  
  Object.values(MUSIC_DATABASE).forEach(songs => {
    songs.forEach(song => {
      if ((song.title.toLowerCase().includes(lowerQuery) ||
           song.artist.toLowerCase().includes(lowerQuery)) &&
          !results.some(r => r.songId === song.songId)) {
        results.push(song);
      }
    });
  });

  if (results.length === 0) {
    Object.values(MUSIC_DATABASE).forEach(songs => {
      songs.forEach(song => {
        const songText = (song.title + ' ' + song.artist).toLowerCase();
        if (songText.includes(lowerQuery) && !results.some(r => r.songId === song.songId)) {
          results.push(song);
        }
      });
    });
  }
  
  return results.slice(0, maxResults);
};

const getVideoDetails = async (videoIds) => {
  try {
    const response = await tryYouTubeApiWithFallback(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        part: 'contentDetails,snippet,statistics',
        id: videoIds
      },
      5000
    );
    return response.data.items || [];
  } catch (error) {
    console.error('❌ Video details fetch failed:', error);
    return [];
  }
};

const parseDuration = (durationStr) => {
  if (!durationStr) return 180;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 180;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
};

const cleanSearchQuery = (query) => {
  if (!query) return "latest hindi songs";
  let cleanQuery = query
    .replace(/(official video|hd|4k|full video|lyrics|video|audio)/gi, '')
    .trim();
  if (!cleanQuery.includes('song') && !cleanQuery.includes('music')) {
    cleanQuery += ' song';
  }
  return cleanQuery;
};

const normalizeSongItem = (item, details = null) => {
  const durationSec = details ? parseDuration(details.contentDetails?.duration) : 180;
  const minutes = Math.floor(durationSec / 60);
  const seconds = (durationSec % 60).toString().padStart(2, '0');
  const duration = `${minutes}:${seconds}`;
  const viewCount = parseInt(details?.statistics?.viewCount || 0);
  const detectedLanguage = detectSongLanguage(item.snippet.title, item.snippet.channelTitle) || 'hindi';
  const globalId = getGlobalSongId(item.snippet.title);

  return {
    songId: item.id.videoId || item.id,
    title: cleanTitle(item.snippet.title),
    artist: cleanArtist(item.snippet.channelTitle),
    thumbnail: getBestThumbnail(item.snippet.thumbnails),
    duration,
    durationSec,
    channel: item.snippet.channelTitle,
    viewCount,
    isOfficial: isOfficialChannel(item.snippet.channelTitle),
    language: detectedLanguage,
    globalId
  };
};

const detectSongLanguage = (title, channel) => {
  const text = (title + ' ' + channel).toLowerCase();
  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return lang;
    }
  }
  return 'hindi';
};

const isMusicContent = (song) => {
  const title = song.title.toLowerCase();
  const channel = song.channel.toLowerCase();
  
  // Less aggressive filtering for trending content
  const hardExclude = [
    'podcast', 'interview', 'talk show', 'trailer', 'movie scene',
    'dialogue', 'comedy', 'funny', 'tutorial', 'lesson'
  ];
  
  if (hardExclude.some(keyword => title.includes(keyword) || channel.includes(keyword))) {
    return false;
  }
  
  // For trending, be more lenient with music detection
  const musicIndicators = [
    'song', 'music', 'track', 'album', 'single', 'hit', 
    'bhajan', 'gaan', 'songs', 'musics', 'soundtrack'
  ];
  
  return musicIndicators.some(keyword => title.includes(keyword)) || 
         isOfficialChannel(song.channel) ||
         song.durationSec >= 120; // Assume songs are at least 2 minutes
};

const isSameLanguage = (song, detectedLanguage, originalQuery) => {
  if (!detectedLanguage) return true;
  return song.language === detectedLanguage;
};

const isOfficialChannel = (channelTitle) => {
  const channel = channelTitle.toLowerCase();
  return OFFICIAL_MUSIC_CHANNELS.some(official => 
    channel.includes(official.toLowerCase())
  );
};

const isQualityChannel = (song) => {
  if (song.isOfficial) return true;
  if (song.viewCount > 500000) return true; // Reduced threshold for trending
  
  const lowQualityIndicators = ['karaoke', 'tribute', 'fan', 'unofficial', 'mix', 'playlist'];
  const channel = song.channel.toLowerCase();
  return !lowQualityIndicators.some(indicator => channel.includes(indicator));
};

const getBestThumbnail = (thumbnails) => {
  return thumbnails.medium?.url || 
         thumbnails.high?.url || 
         thumbnails.default?.url ||
         'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop';
};

const cleanTitle = (title) => {
  return title
    .replace(/\s*\|\s*[^|]*$/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/(official video|hd|4k|full video|lyrics|video|audio)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanArtist = (channelTitle) => {
  return channelTitle
    .replace(/VEVO$/i, '')
    .replace(/Official$/i, '')
    .replace(/Channel$/i, '')
    .replace(/Music$/i, '')
    .trim();
};

export const getAudioStreamUrl = (videoId) => {
  if (!videoId) return null;
  return `/api/proxy-audio?videoId=${videoId}`;
};

// ✅ NEW: Force refresh trending cache
export const forceRefreshTrending = () => {
  localStorage.removeItem('trending_songs_cache_v2');
  console.log("🔄 Trending cache cleared - will fetch fresh data on next call");
};