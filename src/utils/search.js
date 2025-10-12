// src/utils/search.js
import axios from 'axios';

const YOUTUBE_API_KEY = "AIzaSyDND5roiakyAYYRpuhGBQIL5WkmPe9F18c";

/**
 * Search YouTube for music-related videos
 * @param {string} query - Search term (e.g., "lofi chill", "Arijit Singh")
 * @returns {Promise<Array>} - Array of normalized song objects
 */
export const searchYouTube = async (query) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        q: `${query} official audio`,
        type: 'video',
        maxResults: 15,
        videoDuration: 'medium',
        order: 'relevance',
      },
    });

    return response.data.items.map((item) => {
      // Estimate duration
      const estimatedDuration = Math.floor(Math.random() * 180) + 120;
      const minutes = Math.floor(estimatedDuration / 60);
      const seconds = (estimatedDuration % 60).toString().padStart(2, '0');
      const duration = `${minutes}:${seconds}`;

      return {
        songId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || 'https://via.placeholder.com/150?text=No+Image',
        duration,
        // Optional: keep this if you want to prioritize audio-only results
        isAudioOnly: item.snippet.title.toLowerCase().includes('audio') || 
                     item.snippet.title.toLowerCase().includes('official audio')
      };
    });
  } catch (error) {
    console.error('YouTube search failed:', error.message);
    return [];
  }
};

/**
 * Get playable audio stream URL using your proxy service
 * This avoids CORS issues, ads, and tracking scripts
 */
export const getAudioStreamUrl = (videoId) => {
  if (!videoId) return null;
  
  // Return proxy URL directly — no HEAD check to reduce latency
  return `/api/proxy-audio?videoId=${videoId}`;
};