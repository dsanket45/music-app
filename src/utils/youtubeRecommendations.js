// src/utils/youtubeRecommendations.js
import { searchYouTube } from "./search.js";

// 🔑 STRONGER mood keywords (include common Indian song patterns)
const MOOD_KEYWORDS = {
  'energetic': [
    'action', 'fight', 'battle', 'mass', 'entry', 'hero', 'villain', 'war', 'punch',
    'title track', 'theme music', 'background score', 'bgm', 'dhoom', 'dhamaka',
    'power', 'high energy', 'fast beat', 'intense', 'adrenaline', 'kuthu',
    'item song', 'club mix', 'dance number'
  ],
  'romantic': [
    'romantic', 'love', 'heart', 'pyaar', 'prem', 'melody', 'slow', 'soulful',
    'emotional', 'heartbreak', 'missing you', 'tu', 'tere', 'tumhi', 'ishq',
    'sad love', 'breakup', 'lonely'
  ],
  'party': [
    'party', 'dance', 'club', 'bhangra', 'disco', 'celebration', 'festive',
    'navratri', 'sangeet', 'wedding', 'dhol', 'beat', 'remix', 'kuthu'
  ]
};

const detectMood = (title, artist = '') => {
  const text = (title + ' ' + artist).toLowerCase();
  
  // Check energetic first (most important for your case)
  if (MOOD_KEYWORDS['energetic'].some(kw => text.includes(kw))) {
    return 'energetic';
  }
  if (MOOD_KEYWORDS['party'].some(kw => text.includes(kw))) {
    return 'party';
  }
  if (MOOD_KEYWORDS['romantic'].some(kw => text.includes(kw))) {
    return 'romantic';
  }
  
  // Default: if it's a "title", "theme", or "bgm" → energetic
  if (text.includes('title') || text.includes('theme') || text.includes('bgm') || text.includes('background')) {
    return 'energetic';
  }
  
  return 'romantic'; // safe fallback
};

// 🔑 CRITICAL: Generate query that LOCKS the mood
const generateMoodLockedQuery = (currentSong) => {
  const mood = detectMood(currentSong.title, currentSong.artist);
  const lang = currentSong.language || 'hindi';
  
  // Use mood-specific templates
  const templates = {
    'energetic': [
      `${lang} action songs`,
      `${lang} mass entry songs`,
      `${lang} title track bgm`,
      `${lang} high energy fight songs`,
      `${lang} villain hero songs`
    ],
    'party': [
      `${lang} party dance songs`,
      `${lang} bhangra wedding songs`,
      `${lang} club remix ${lang}`,
      `${lang} festive celebration songs`
    ],
    'romantic': [
      `${lang} romantic love songs`,
      `${lang} emotional melody`,
      `${lang} sad love songs`
    ]
  };

  const options = templates[mood] || templates['romantic'];
  // Rotate queries to avoid repetition
  const index = Math.floor(Math.random() * options.length);
  return options[index];
};

export const getYouTubeRecommendations = async (currentSong) => {
  try {
    console.log("🎯 Recommending for:", currentSong.title, "| Mood:", detectMood(currentSong.title), "| Lang:", currentSong.language);
    
    if (!currentSong) return null;

    const detectedLanguage = currentSong.language || 'hindi';
    const currentMood = detectMood(currentSong.title, currentSong.artist);

    // 🔁 Try 2-3 mood-locked queries before giving up
    const queries = [
      generateMoodLockedQuery(currentSong),
      `${currentSong.artist} ${currentMood === 'energetic' ? 'action' : currentMood} ${detectedLanguage} songs`,
      `${detectedLanguage} ${currentMood} songs 2025`
    ];

    for (const query of queries) {
      console.log("🔍 Trying query:", query);
      
      let recommendations = await searchYouTube(query, {
        enforceLanguage: true,
        minDuration: 120,
        prioritizeOfficial: true,
        maxResults: 15
      });

      // Filter: same language + same mood + not current song
      recommendations = recommendations.filter(song => 
        song.songId !== currentSong.songId &&
        song.language === detectedLanguage &&
        detectMood(song.title, song.artist) === currentMood
      );

      if (recommendations.length > 0) {
        console.log(`✅ Found ${recommendations.length} ${currentMood} ${detectedLanguage} songs`);
        return recommendations[0];
      }
    }

    // 🚨 LAST RESORT: Only if ALL mood-locked searches fail
    console.warn("⚠️ No mood-consistent songs found. Using genre fallback...");

    // Try a broader but still mood-biased search
    const fallbackQuery = `${detectedLanguage} ${currentMood} music`;
    let fallbackRecs = await searchYouTube(fallbackQuery, {
      enforceLanguage: true,
      minDuration: 120,
      maxResults: 10
    });

    fallbackRecs = fallbackRecs.filter(song => 
      song.songId !== currentSong.songId &&
      song.language === detectedLanguage
    );

    if (fallbackRecs.length > 0) {
      return fallbackRecs[0];
    }

    // 💥 Absolute fallback: return null so player can stop or show message
    console.error("❌ No same-mood, same-language song found. Stopping auto-play.");
    return null;

  } catch (error) {
    console.error("❌ Recommendation error:", error);
    return null;
  }
};

// Keep this for manual "shuffle" only
export const getRandomRecommendation = async (currentSong) => {
  const lang = currentSong?.language || 'hindi';
  const query = `${lang} trending songs`;
  const results = await searchYouTube(query, { 
    enforceLanguage: true,
    maxResults: 5 
  });
  return results.find(s => s.songId !== currentSong?.songId) || results[0] || null;
};