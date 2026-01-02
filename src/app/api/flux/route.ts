import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Direct inline config to avoid JSON import issues in server routes
const aiModels = {
  "defaultModel": "prompthero/realistic-vision-v2.0",
  "candidateModels": [
    { "slug": "prompthero/realistic-vision-v2.0", "name": "Realistic Vision v2.0", "paid": false },
    { "slug": "black-forest-labs/FLUX.1-dev", "name": "FLUX Dev", "paid": false },
    { "slug": "prompthero/openjourney-v4", "name": "OpenJourney v4", "paid": true },
    { "slug": "stability-ai/stable-diffusion-2-1", "name": "Stable Diffusion 2.1", "paid": true },
    { "slug": "stability-ai/stable-diffusion-3", "name": "Stable Diffusion 3", "paid": true }
  ]
};

// Simple in-memory cache for resolved model version IDs to avoid fetching metadata every request.
const modelVersionCache = new Map<string, string>();

// Short-term cache to avoid reattempting models that just failed with 402 or 429.
const memFailureCache = new Map<string, { status: number | string; details?: string; until: number }>();

// Redis client (optional). If REDIS_URL is configured we use it for short-lived
// failure caching so instances share state; otherwise fall back to in-memory map.
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    // ioredis accepts connection string
    redisClient = new Redis(process.env.REDIS_URL);
  } catch (e) {
    console.warn('Redis init failed, falling back to in-memory cache', e);
    redisClient = null;
  }
}

const CACHE_TTL_402_MS = 1000 * 60 * 60; // 1 hour
const CACHE_TTL_429_MS = 1000 * 30; // 30 seconds

const CACHE_TTL_402_S = Math.floor(CACHE_TTL_402_MS / 1000);
const CACHE_TTL_429_S = Math.floor(CACHE_TTL_429_MS / 1000);

async function getFailureCache(modelSlug: string) {
  if (redisClient) {
    try {
      const raw = await redisClient.get(`model_failure:${modelSlug}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Redis failure cache read error, falling back to memory', e);
      return memFailureCache.get(modelSlug) || null;
    }
  }
  return memFailureCache.get(modelSlug) || null;
}

async function setFailureCache(modelSlug: string, value: { status: number | string; details?: string }, ttlSeconds: number) {
  if (redisClient) {
    try {
      await redisClient.set(`model_failure:${modelSlug}`, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (e) {
      console.warn('Redis failure cache write error, falling back to memory', e);
    }
  }
  memFailureCache.set(modelSlug, { ...value, until: Date.now() + ttlSeconds * 1000 });
}

export async function POST(req: Request) {
  const { prompt, selectedModel, excludePaidModels = false } = await req.json();

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API token not configured' },
      { status: 500 }
    );
  }

    try {
    console.log('Creating prediction with prompt:', prompt);
    const config = aiModels;
    console.log('Using aiModels config with', config?.candidateModels?.length || 0, 'models');

    // Candidate models (slugs) derived from config, with optional paid-model filtering
    const candidateModels = (config?.candidateModels || [])
      .filter((m: any) => { if (!excludePaidModels) return true; return !m.paid; })
      .map((m: any) => (m.slug ? m.slug : m));
    
    console.log('Candidate models after filtering:', candidateModels, 'excludePaidModels:', excludePaidModels);

    let createRes: Response | null = null;
    let usedModel: string | null = null;
    let usedVersionId: string | null = null;

    const triedModels: any[] = [];
    // Filter out models that are in the transient failure cache unless explicitly chosen by the user
    const modelsToTryRaw = selectedModel ? [selectedModel, ...candidateModels.filter((m: string) => m !== selectedModel)] : candidateModels;
    const modelsToTry: string[] = [];
    for (const m of modelsToTryRaw) {
      const fc = await getFailureCache(m) as any;
      // Respect user's explicit selection: if they selected this model explicitly, still try it
      // If fc exists, it's either a mem entry with an 'until' timestamp or a Redis entry (present while TTL active). In both cases skip unless the user explicitly selected it.
      if (fc && ((fc.until && fc.until > Date.now()) || !fc.until) && m !== selectedModel) {
        // Skip this model for now; surface it as a skipped attempt
        triedModels.push({ model: m, status: 'cached', details: `Skipped due to recent failure (status: ${fc.status})` });
        continue;
      }
      modelsToTry.push(m);
    }

    if (modelsToTry.length === 0) {
      const msg = modelsToTryRaw.length === 0 ? 'No candidate models found in config' : 'All models in failure cache or filtered out';
      console.warn(msg, 'modelsToTryRaw:', modelsToTryRaw, 'triedModels:', triedModels);
      return NextResponse.json({ 
        error: msg, 
        triedModels, 
        debug: { 
          configLoaded: !!config?.candidateModels,
          totalCandidateModels: config?.candidateModels?.length || 0,
          candidateModels, 
          modelsToTryRaw,
          excludePaidModels
        } 
      }, { status: 400 });
    }
    for (const modelSlug of modelsToTry) {
      try {
        // Fetch model metadata to discover an available version id. Use the in-memory cache if possible.
        let versionId = modelVersionCache.get(modelSlug);
        if (!versionId) {
          const metaRes = await fetch(`https://api.replicate.com/v1/models/${modelSlug}`, {
            headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
          });

          if (!metaRes.ok) {
            console.warn(`Model ${modelSlug} metadata fetch failed:`, await metaRes.text());
            continue; // try next model
          }

          const meta = await metaRes.json();
          versionId = meta?.latest_version?.id || meta?.default_version?.id || (meta?.versions?.[0] && meta.versions[0].id);
          if (!versionId) {
            console.warn(`Model ${modelSlug} has no version id, skipping.`);
            continue;
          }
          modelVersionCache.set(modelSlug, versionId);
        }
        if (!versionId) {
          console.warn(`Model ${modelSlug} has no version id, skipping.`);
          continue;
        }

        // Create the prediction using the discovered version
        usedModel = modelSlug;
        usedVersionId = versionId;

        // Helper to POST a prediction and optionally retry on 429 (rate limit)
        const postPrediction = async () => {
          return fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            },
            body: JSON.stringify({
              version: usedVersionId,
              input: {
                prompt: prompt,
              },
            }),
          });
        };

        // Allow a few small retry attempts for 429 responses to handle transient rate-limits
        const max429Retries = 3;
        let attempt = 0;
        createRes = await postPrediction();
        while (createRes && createRes.status === 429 && attempt < max429Retries) {
          attempt++;
          const waitTimeMs = 1000 * Math.pow(2, attempt - 1); // exp backoff 1s, 2s, 4s
          console.warn(`Model ${modelSlug} returned 429 - retry ${attempt}/${max429Retries} after ${waitTimeMs}ms`);
          await new Promise((r) => setTimeout(r, waitTimeMs));
          createRes = await postPrediction();
        }

        // If billing required (402), log it, cache, and try next model
        if (createRes && createRes.status === 402) {
          const details = await createRes.text();
          triedModels.push({ model: usedModel, version: usedVersionId, status: 402, details });
          await setFailureCache(usedModel, { status: 402, details }, CACHE_TTL_402_S);
          console.warn(`Model ${usedModel} returned 402 - requires billing, skipping.`);
          createRes = null;
          usedModel = null;
          usedVersionId = null;
          continue; // try next candidate
        }

        // If rate limited (429) after retries, cache and skip model
        if (createRes && createRes.status === 429) {
          const details = await createRes.text();
          triedModels.push({ model: usedModel, version: usedVersionId, status: 429, details });
          await setFailureCache(usedModel, { status: 429, details }, CACHE_TTL_429_S);
          console.warn(`Model ${usedModel} returned 429 - rate limited, skipping.`);
          createRes = null;
          usedModel = null;
          usedVersionId = null;
          continue; // try next candidate
        }

        // If unauthorized (401), return helpful message (token issue)
        if (createRes && createRes.status === 401) {
          const body = await createRes.text();
          console.error('Replicate authorization error:', body);
          return NextResponse.json({ error: 'Replicate API token invalid or unauthorized', details: body }, { status: 401 });
        }

        // If forbidden (403), the model is restricted to some users, skip it and continue
        if (createRes && createRes.status === 403) {
          triedModels.push({ model: usedModel, version: usedVersionId, status: 403, details: await createRes.text() });
          console.warn(`Model ${usedModel} returned 403 - forbidden, skipping.`);
          createRes = null;
          usedModel = null;
          usedVersionId = null;
          continue;
        }

        // If we got a 422, try a couple alternate input shapes that some models require
        if (createRes && createRes.status === 422) {
          const altPayloads = [
            { version: usedVersionId, input: { text: prompt } },
            { version: usedVersionId, input: { prompt: prompt, width: 1024, height: 768 } },
            { version: usedVersionId, input: { prompt: prompt, steps: 20 } },
          ];

              for (const payload of altPayloads) {
            try {
              const tryRes = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                },
                body: JSON.stringify(payload),
              });

              const bodyText = await tryRes.text();
              console.warn(`Retry using alternative payload ${JSON.stringify(payload.input)} -> status ${tryRes.status}`);
              console.warn('Response:', bodyText);
              if (tryRes.ok) {
                createRes = tryRes; // use this
                break;
              }
            } catch (e) {
              console.warn('Alt payload attempt failed', e);
            }
          }
        }

      } catch (e) {
        console.warn(`Attempt to use model ${modelSlug} failed:`, e);
        continue;
      }

      if (createRes) break;
    }

    if (!createRes) {
      // If we failed to get a createRes, surface helpful reasons where possible
      return NextResponse.json({ error: 'No available model could be used', triedModels }, { status: 502 });
    }

    const responseText = await createRes.text();
    console.log('Replicate response status:', createRes.status);
    console.log('Replicate response body:', responseText);

    if (!createRes.ok) {
      return NextResponse.json(
        { 
          error: `Replicate error ${createRes.status}`,
          model: usedModel,
          version: usedVersionId,
          details: responseText,
          triedModels,
        },
        { status: createRes.status }
      );
    }

    const prediction = JSON.parse(responseText);
    const predictionId = prediction.id;

    console.log('Created prediction:', predictionId);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120;

    while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));

      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          },
        }
      );

      if (pollRes.status === 429) {
        console.warn(`Poll returned 429 for prediction ${predictionId}, waiting 2s before retry`);
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
        continue;
      }
      if (pollRes.ok) {
        result = await pollRes.json();
        console.log(`Poll attempt ${attempts}: status=${result.status}`);
      } else {
        console.warn('Poll response not ok', pollRes.status, await pollRes.text());
      }

      attempts++;
    }

    console.log('Final result status:', result.status);

    if (result.status === 'succeeded' && result.output && result.output.length > 0) {
      return NextResponse.json({
        image_url: result.output[0],
        model: usedModel,
        version: usedVersionId,
      });
    }

    if (result.status === 'failed') {
      console.error('Prediction failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Prediction failed', triedModels },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Unexpected status: ${result.status}`, triedModels },
      { status: 500 }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}