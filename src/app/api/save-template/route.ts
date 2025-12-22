// src/app/api/save-template/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const template = await req.json();

    // Insert template into Supabase
    const { data, error } = await supabase
      .from('templates')
      .insert([
        {
          template_id: template.id,
          name: template.name,
          category: template.category,
          thumbnail: template.thumbnail,
          width: template.size.width,
          height: template.size.height,
          svg_content: template.svgContent,
          created_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Template saved successfully',
      templateId: template.id,
      data: data 
    });
  } catch (error: any) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save template' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ templates: [], error: error.message });
    }

    // Transform data to match template format
    const templates = data.map((row: any) => ({
      id: row.template_id,
      name: row.name,
      category: row.category,
      thumbnail: row.thumbnail,
      size: { width: row.width, height: row.height },
      svgContent: row.svg_content,
    }));

    return NextResponse.json({ 
      templates,
      count: templates.length 
    });
  } catch (error: any) {
    console.error('Error reading templates:', error);
    return NextResponse.json({ 
      templates: [],
      error: error.message 
    });
  }
}