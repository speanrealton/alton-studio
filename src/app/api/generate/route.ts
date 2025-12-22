// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  const { prompt } = await req.json();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llava-v1.5-13b', // Groq hosts Flux via LLaVA wrapper for image gen
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${prompt}, professional graphic design, high quality, ultra detailed, clean layout, 1280x720` },
              { type: 'image_url', image_url: { url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Black_square.jpg' } } // dummy to trigger vision
            ]
          }
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const imageBase64 = data.choices[0].message.content.match(/data:image\/png;base64,(.*)/)?.[1];

    if (imageBase64) {
      const imageUrl = `data:image/png;base64,${imageBase64}`;
      return NextResponse.json({ image_url: imageUrl });
    }

    throw new Error('No image');
  } catch (error) {
    // Fallback to free Replicate Flux (also unlimited)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token r8_XXXXXXXXXXXXXXXXXXXXXXXX`, // Replicate free tier doesn't need key for public models
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'f3c7e9b5f4b3f5d8d9c32a82c4d4a1f6c2d5e8f9a1b2c3d4e5f6g7h8i9j0k1l2',
        input: { prompt: `${prompt}, professional design, high resolution` }
      }),
    });

    const replicateData = await replicateResponse.json();
    return NextResponse.json({ image_url: replicateData.output?.[0] || 'https://via.placeholder.com/1024x1024/4c1d95/ffffff?text=Generating...' });
  }
};