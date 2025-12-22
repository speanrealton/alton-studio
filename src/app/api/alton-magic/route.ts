// src/app/api/alton-magic/route.ts
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  const { prompt } = await req.json();

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "b21c2818c53f1d96b3f4b9f7f1d52d925c5e2b3d1f5a6e8c5d7b9e2f1a3c4d5", // Flux.1-schnell public version
        input: {
          prompt: `${prompt}, professional graphic design, ultra detailed, high quality, clean layout, African aesthetic`,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          guidance_scale: 3.5,
          num_inference_steps: 28,
        },
      }),
    });

    const data = await response.json();

    // Poll for result (Replicate is async)
    let result = data;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(r => setTimeout(r, 1000));
      const poll = await fetch(result.urls.get);
      result = await poll.json();
    }

    const imageUrl = result.output?.[0] || 'https://via.placeholder.com/1024x1024/1a0033/ffffff?text=Alton+Magic';

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    return NextResponse.json({ image_url: 'https://via.placeholder.com/1024x1024/1a0033/ffffff?text=Try+Again' });
  }
};