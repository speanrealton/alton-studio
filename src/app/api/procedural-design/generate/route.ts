import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateLogoSVG } from '@/lib/design-generators/logo-generator';
import { generateBusinessCardSVG } from '@/lib/design-generators/business-card-generator';
import { generateSocialMediaSVG } from '@/lib/design-generators/social-media-generator';
import { generateFlyerSVG } from '@/lib/design-generators/flyer-generator';
import { generateLetterheadSVG } from '@/lib/design-generators/letterhead-generator';
import { generateEmailTemplateSVG } from '@/lib/design-generators/email-template-generator';
import { generateInvoiceSVG } from '@/lib/design-generators/invoice-generator';
import { generateResumeSVG } from '@/lib/design-generators/resume-generator';
import { generatePosterSVG } from '@/lib/design-generators/poster-generator';
import { generateProductLabelSVG } from '@/lib/design-generators/product-label-generator';

// Direct Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface ProceduralDesignRequest {
  category: 'logo' | 'business_card' | 'letterhead' | 'social_media' | 'flyer' | 'email' | 'invoice' | 'resume' | 'poster' | 'product_label';
  companyName: string;
  tagline: string;
  industry: string;
  colorPrimary: string;
  colorSecondary: string;
  email?: string;
  phone?: string;
  format?: string;
  imageBase64?: string;
  ownerName?: string;
  ownerTitle?: string;
  address?: string;
  website?: string;
}

// Convert SVG to data URL
function svgToDataURL(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

// Generate SVG based on category
function generateDesignSVG(request: ProceduralDesignRequest): string {
  const { category, companyName, tagline, industry, colorPrimary, colorSecondary } = request;

  console.log(`🎨 Generating ${category} design for ${companyName}`);

  switch (category) {
    case 'logo':
      return generateLogoSVG({
        companyName,
        industry,
        colorPrimary,
        colorSecondary,
        style: 'random',
        imageBase64: request.imageBase64
      });

    case 'business_card':
      return generateBusinessCardSVG({
        companyName,
        tagline,
        industry,
        colorPrimary,
        colorSecondary,
        email: request.email || 'hello@company.com',
        phone: request.phone || '+1 (555) 123-4567',
        ownerName: request.ownerName || '',
        ownerTitle: request.ownerTitle || '',
        address: request.address || '',
        website: request.website || '',
        imageBase64: request.imageBase64
      });

    case 'letterhead':
      return generateLetterheadSVG({
        companyName,
        tagline,
        address: `${industry} Industry, City, Country`,
        phone: request.phone || '+1 (555) 123-4567',
        email: request.email || 'hello@company.com',
        website: 'www.company.com',
        colorPrimary,
        colorSecondary,
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'social_media':
      return generateSocialMediaSVG({
        companyName,
        headline: companyName,
        tagline,
        colorPrimary,
        colorSecondary,
        format: (request.format || 'instagram') as 'instagram' | 'linkedin' | 'facebook' | 'twitter',
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'flyer':
      return generateFlyerSVG({
        companyName,
        headline: `Welcome to ${companyName}`,
        description: `${tagline}. Professional solutions for the ${industry} industry.`,
        colorPrimary,
        colorSecondary,
        callToAction: 'Contact Us Today',
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'email':
      return generateEmailTemplateSVG({
        companyName,
        subject: tagline || 'Important Update',
        colorPrimary,
        colorSecondary,
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'invoice':
      return generateInvoiceSVG({
        companyName,
        industry,
        colorPrimary,
        colorSecondary,
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'resume':
      return generateResumeSVG({
        companyName,
        industry,
        colorPrimary,
        colorSecondary,
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'poster':
      return generatePosterSVG({
        companyName,
        headline: tagline || companyName,
        industry,
        colorPrimary,
        colorSecondary,
        imageBase64: request.imageBase64,
        style: 'random'
      });

    case 'product_label':
      return generateProductLabelSVG({
        productName: tagline || 'Premium Product',
        companyName,
        colorPrimary,
        colorSecondary,
        imageBase64: request.imageBase64,
        style: 'random'
      });

    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

export async function POST(req: Request) {
  try {
    const request: ProceduralDesignRequest = await req.json();

    console.log('📝 Procedural design request:', {
      category: request.category,
      companyName: request.companyName,
      colors: { primary: request.colorPrimary, secondary: request.colorSecondary }
    });

    // Validate input
    if (!request.companyName || !request.category) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, category' },
        { status: 400 }
      );
    }

    // Generate SVG
    const svg = generateDesignSVG(request);
    const dataUrl = svgToDataURL(svg);

    // Save to Supabase
    const userId = 'test-user-' + Date.now();
    const { data: design, error: designError } = await supabase
      .from('professional_designs')
      .insert({
        user_id: userId,
        category: request.category,
        company_name: request.companyName,
        tagline: request.tagline,
        industry: request.industry,
        prompt_used: `Procedural ${request.category} design`,
        image_url: dataUrl,
        model_used: 'procedural-generator',
        status: 'completed'
      })
      .select()
      .single();

    if (designError) {
      console.error('Failed to save design:', designError);
      return NextResponse.json(
        { 
          success: true,
          image_url: dataUrl,
          model_used: 'procedural-generator',
          note: 'Design generated but not saved to database'
        }
      );
    }

    console.log('✅ Design generated and saved successfully');

    return NextResponse.json({
      success: true,
      designId: design?.id,
      image_url: dataUrl,
      model_used: 'procedural-generator',
      category: request.category,
      format: 'svg'
    });

  } catch (error) {
    console.error('❌ Procedural design generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate design',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
