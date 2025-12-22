// src/app/api/freepik-search/route.ts
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  try {
    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ results: [] });
    }

    const apiKey = process.env.FREEPK_API_KEY;
    
    if (!apiKey) {
      console.error('FREEPK_API_KEY is not set');
      return NextResponse.json({ results: [] });
    }

    const url = `https://api.freepik.com/v1/resources?term=${encodeURIComponent(query.trim())}&limit=48&page=1&locale=en-US&filters[content_type][]=vector&filters[content_type][]=photo&filters[content_type][]=psd`;

    console.log('Fetching from Freepik:', url);

    const res = await fetch(url, {
      headers: { 
        'Accept': 'application/json',
        'X-Freepik-API-Key': apiKey
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Freepik API error:', res.status, errorText);
      return NextResponse.json({ results: [], error: `API returned ${res.status}` });
    }

    const data = await res.json();
    console.log('Freepik response:', data);

    if (!data.data || !Array.isArray(data.data)) {
      console.error('Unexpected API response structure:', data);
      return NextResponse.json({ results: [] });
    }

    const results = data.data
      .map((item: any) => ({
        id: item.id,
        preview: item.image?.source?.url || item.image?.large || item.image?.medium || item.image?.small || item.thumbnail?.url || null,
      }))
      .filter((item: any) => item.preview);

    console.log(`Returning ${results.length} results`);
    return NextResponse.json({ results });
    
  } catch (err) {
    console.error('Search failed:', err);
    return NextResponse.json({ results: [], error: String(err) });
  }
};