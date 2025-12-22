import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase client for server routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Model configurations optimized for professional designs
const PROFESSIONAL_MODELS = {
  'logo': [
    { slug: 'stability-ai/stable-diffusion-3', name: 'Stable Diffusion 3' },
    { slug: 'black-forest-labs/FLUX.1-dev', name: 'FLUX Dev' }
  ],
  'business_card': [
    { slug: 'stability-ai/stable-diffusion-3', name: 'Stable Diffusion 3' },
    { slug: 'black-forest-labs/FLUX.1-dev', name: 'FLUX Dev' }
  ],
  'letterhead': [
    { slug: 'stability-ai/stable-diffusion-3', name: 'Stable Diffusion 3' },
    { slug: 'black-forest-labs/FLUX.1-dev', name: 'FLUX Dev' }
  ],
  'social_media': [
    { slug: 'stability-ai/stable-diffusion-3', name: 'Stable Diffusion 3' },
    { slug: 'black-forest-labs/FLUX.1-dev', name: 'FLUX Dev' }
  ],
  'flyer': [
    { slug: 'stability-ai/stable-diffusion-3', name: 'Stable Diffusion 3' },
    { slug: 'black-forest-labs/FLUX.1-dev', name: 'FLUX Dev' }
  ]
};

export async function POST(req: Request) {
  try {
    const { templateId, companyName, tagline, industry, category, customPrompt } = await req.json();

    console.log('📝 Professional design request:', { templateId, companyName, tagline, industry, category });

    // Use a test user ID for development (no auth requirement initially)
    const userId = 'test-user-' + Date.now();
    console.log('⚠️ Using test user:', userId);

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('professional_design_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('❌ Template not found:', templateError);
      return NextResponse.json({ error: 'Template not found', debug: { templateError } }, { status: 404 });
    }

    console.log('✅ Template found:', template.name);

    // Build prompt
    let prompt = customPrompt || template.prompt_template;
    prompt = prompt
      .replace('{company_name}', companyName)
      .replace('{tagline}', tagline || '')
      .replace('{industry}', industry || 'general');

    // Add professional design directives
    prompt += '. IMPORTANT: Professional quality, high resolution, suitable for commercial use, clean design, modern aesthetic';

    console.log('Generating professional design:', { category, companyName });

    // Use category-specific models
    const categoryModels = PROFESSIONAL_MODELS[category as keyof typeof PROFESSIONAL_MODELS] || PROFESSIONAL_MODELS['business_card'];
    
    // Create design record
    const { data: design, error: designError } = await supabase
      .from('professional_designs')
      .insert({
        user_id: userId,
        template_id: templateId,
        category: category,
        company_name: companyName,
        tagline: tagline || null,
        industry: industry || null,
        prompt_used: prompt,
        status: 'pending',
        model_used: categoryModels[0].slug
      })
      .select()
      .single();

    if (designError || !design) {
      console.error('Failed to create design record:', designError);
      return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
    }

    // Call Replicate to generate image
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ REPLICATE_API_TOKEN not configured');
      return NextResponse.json({ 
        error: 'Replicate API token not configured',
        debug: {
          message: 'Add REPLICATE_API_TOKEN to .env.local'
        }
      }, { status: 500 });
    }

    console.log('🔑 Replicate token configured:', REPLICATE_API_TOKEN.substring(0, 10) + '...');
    console.log('📋 Using models for category', category + ':', categoryModels.map(m => m.slug));

    let imageUrl: string | null = null;
    let usedModel: string | null = null;
    const triedModels: Array<{ model: string; status: string; error?: string }> = [];

    for (const model of categoryModels) {
      console.log(`\n🚀 Attempting model: ${model.slug}`);
      
      try {
        // Get model version
        const metaRes = await fetch(`https://api.replicate.com/v1/models/${model.slug}`, {
          headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
        });

        if (!metaRes.ok) {
          const errorText = await metaRes.text();
          console.error(`❌ Model metadata fetch failed: ${metaRes.status}`, errorText);
          triedModels.push({ model: model.slug, status: 'metadata_fetch_failed', error: errorText });
          continue;
        }

        const meta = await metaRes.json();
        const versionId = meta?.latest_version?.id || meta?.default_version?.id || meta?.versions?.[0]?.id;

        if (!versionId) {
          console.warn(`❌ No version found for ${model.slug}`);
          triedModels.push({ model: model.slug, status: 'no_version_found' });
          continue;
        }

        console.log(`✅ Found version ${versionId} for ${model.slug}`);

        // Create prediction
        const predRes = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${REPLICATE_API_TOKEN}`
          },
          body: JSON.stringify({
            version: versionId,
            input: { prompt }
          })
        });

        if (!predRes.ok) {
          const errorBody = await predRes.text();
          console.error(`❌ Prediction creation failed: ${predRes.status}`, errorBody);
          triedModels.push({ model: model.slug, status: 'prediction_failed', error: errorBody });
          continue;
        }

        const prediction = await predRes.json();
        const predictionId = prediction.id;
        console.log(`⏳ Created prediction: ${predictionId}`);

        // Poll for completion (max 2 minutes)
        let result = prediction;
        let attempts = 0;
        const maxAttempts = 120;

        while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000));

          const pollRes = await fetch(
            `https://api.replicate.com/v1/predictions/${predictionId}`,
            { headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` } }
          );

          if (pollRes.ok) {
            result = await pollRes.json();
            console.log(`  Poll ${attempts + 1}/${maxAttempts}: ${result.status}`);
          }
          attempts++;
        }

        console.log(`✅ Prediction completed with status: ${result.status}`);
        
        if (result.status === 'succeeded' && result.output && result.output.length > 0) {
          imageUrl = result.output[0];
          usedModel = model.name;
          console.log(`🎉 Success! Image URL: ${imageUrl}`);
          triedModels.push({ model: model.slug, status: 'succeeded' });
          break;
        } else {
          console.log(`❌ Prediction did not succeed. Status: ${result.status}, Output:`, result.output);
          triedModels.push({ model: model.slug, status: result.status, error: JSON.stringify(result.output || result.error) });
        }
      } catch (e) {
        console.error(`❌ Error with model ${model.slug}:`, e);
        triedModels.push({ model: model.slug, status: 'exception', error: String(e) });
        continue;
      }
    }

    if (!imageUrl) {
      // Update design with error
      await supabase
        .from('professional_designs')
        .update({ status: 'failed', error_message: 'No available model generated image' })
        .eq('id', design.id);

      console.error('❌ No image generated after trying all models');
      console.error('📊 Tried models:', triedModels);
      
      return NextResponse.json({
        error: 'Failed to generate professional design - all models failed',
        designId: design.id,
        debug: {
          attemptedModels: triedModels,
          category,
          prompt: prompt.substring(0, 100) + '...',
          message: 'Check server logs for detailed errors'
        }
      }, { status: 502 });
    }

    console.log('✅ Design generated successfully:', imageUrl);

    // Update design with generated image
    const { error: updateError } = await supabase
      .from('professional_designs')
      .update({
        image_url: imageUrl,
        model_used: usedModel,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', design.id);

    if (updateError) {
      console.error('Failed to update design:', updateError);
    }

    return NextResponse.json({
      success: true,
      designId: design.id,
      image_url: imageUrl,
      model_used: usedModel,
      template_name: template.name
    });

  } catch (error) {
    console.error('Professional design generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
