const crypto = require('crypto');
const https = require('https');

const DES_KEY = Buffer.from('38346591');
const JIOSAAVN_API = 'https://www.jiosaavn.com/api.php';

function decryptUrl(encryptedUrl) {
  try {
    const decipher = crypto.createDecipheriv('des-ecb', DES_KEY, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedUrl, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    // Replace quality to get 320kbps
    return decrypted.replace('_96.mp4', '_320.mp4').replace('_96_p.mp4', '_320.mp4');
  } catch (e) {
    console.error('Decrypt error:', e.message);
    return null;
  }
}

function getHighResImage(url) {
  if (!url) return '';
  return url.replace('150x150', '500x500').replace('50x50', '500x500');
}

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

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function transformSong(song) {
  let streamUrl = '';
  
  // Decrypt the encrypted media URL to get direct CDN link
  if (song.encrypted_media_url) {
    streamUrl = decryptUrl(song.encrypted_media_url);
  }
  
  // Fallback: transform preview URL
  if (!streamUrl && song.media_preview_url) {
    streamUrl = song.media_preview_url
      .replace('preview.saavncdn.com', 'aac.saavncdn.com')
      .replace(/_96_p\.mp4/, '_320.mp4');
  }

  const durationSec = parseInt(song.duration) || 210;

  return {
    songId: song.id,
    id: song.id,
    title: cleanText(song.song || song.title || 'Unknown'),
    artist: cleanText(song.primary_artists || song.singers || song.music || 'Unknown Artist'),
    album: cleanText(song.album || 'Single'),
    thumbnail: getHighResImage(song.image || ''),
    duration: formatDuration(durationSec),
    durationSec,
    language: song.language || 'hindi',
    globalId: (song.id || '').toLowerCase(),
    streamUrl: streamUrl || '',
    year: song.year || '',
    playCount: song.play_count || '0',
  };
}

function fetchFromJioSaavn(params) {
  return new Promise((resolve, reject) => {
    const url = new URL(JIOSAAVN_API);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    https.get(url.toString(), { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || 'search';
  const query = params.query || params.q || '';
  const id = params.id || '';

  try {
    if (action === 'search') {
      if (!query) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'query required' }) };
      }

      const data = await fetchFromJioSaavn({
        __call: 'search.getResults',
        _format: 'json',
        _marker: '0',
        p: '1',
        q: query,
        n: params.limit || '20',
      });

      if (data && data.results) {
        const songs = data.results
          .filter(s => s.id && (s.encrypted_media_url || s.media_preview_url))
          .map(transformSong)
          .filter(s => s.streamUrl);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, songs }),
        };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, songs: [] }) };

    } else if (action === 'song') {
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
      }

      const data = await fetchFromJioSaavn({
        __call: 'song.getDetails',
        cc: 'in',
        _marker: '0?_marker=0',
        _format: 'json',
        pids: id,
      });

      const songData = data[id] || Object.values(data)[0];
      if (songData) {
        const song = transformSong(songData);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, song }),
        };
      }

      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Song not found' }) };

    } else if (action === 'trending') {
      const queries = ['trending hindi songs 2024', 'latest bollywood hits', 'arijit singh latest'];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];

      const data = await fetchFromJioSaavn({
        __call: 'search.getResults',
        _format: 'json',
        _marker: '0',
        p: '1',
        q: randomQuery,
        n: '15',
      });

      if (data && data.results) {
        const songs = data.results
          .filter(s => s.id && (s.encrypted_media_url || s.media_preview_url))
          .map(transformSong)
          .filter(s => s.streamUrl);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, songs }),
        };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, songs: [] }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };

  } catch (err) {
    console.error('API error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
