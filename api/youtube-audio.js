// Vercel Edge Function (runs server-side)
import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // optional: pick a region
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId || !ytdl.validateID(videoId)) {
      return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
    }

    // Get audio stream info
    const info = await ytdl.getInfo(videoId);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    if (!audioFormat) {
      return NextResponse.json({ error: 'No audio found' }, { status: 404 });
    }

    // Stream audio directly from YouTube to client
    const response = await fetch(audioFormat.url);
    const headers = new Headers(response.headers);
    headers.set('Content-Type', audioFormat.mimeType);
    headers.set('Cache-Control', 'public, max-age=3600'); // cache 1 hour

    return new NextResponse(response.body, { headers });
  } catch (err) {
    console.error('Audio fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
  }
}