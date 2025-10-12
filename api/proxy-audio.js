// MUSIC-APP/api/proxy-audio.js

import ytdl from 'ytdl-core';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  try {
    // Get video info
    const info = await ytdl.getInfo(videoId);
    
    // Choose highest quality audio format
    const audioFormat = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    if (!audioFormat) {
      throw new Error('No audio format available');
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the audio
    const audioStream = ytdl.downloadFromInfo(info, { 
      format: audioFormat 
    });
    
    audioStream.pipe(res);
    
    audioStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    });
    
  } catch (error) {
    console.error('YouTube audio error:', error);
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
}