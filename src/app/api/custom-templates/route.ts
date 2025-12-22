import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Custom templates data - keep existing hardcoded ones as fallback
const CUSTOM_TEMPLATES = [];

export async function GET() {
  try {
    // Load uploaded templates from the save-template API
    let uploadedTemplates = [];
    try {
      const response = await fetch('http://localhost:3000/api/save-template');
      const data = await response.json();
      uploadedTemplates = data.templates || [];
    } catch (err) {
      console.log('No uploaded templates found');
    }

    // Read templates from public/templates/json
    let fileTemplates: any[] = [];
    try {
      const templatesDir = path.join(process.cwd(), 'public', 'templates', 'json');
      if (fs.existsSync(templatesDir)) {
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
        files.forEach((file) => {
          try {
            const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
                const parsed = JSON.parse(content);
                // Determine thumbnail: explicit -> preview -> file png if it exists -> fallback to a known public image
                let thumbnail = parsed.thumbnail || parsed.preview || `/templates/json/${file.replace('.json','')}.png`;
                try {
                  const pngPath = path.join(templatesDir, file.replace('.json','') + '.png');
                  if (!fs.existsSync(pngPath)) {
                    // fallback to a safe public image to avoid 404s
                    thumbnail = parsed.thumbnail || parsed.preview || '/image1.jpg';
                  }
                } catch (e) {
                  thumbnail = parsed.thumbnail || parsed.preview || '/image1.jpg';
                }
                // Map to expected API shape
                fileTemplates.push({
                  id: parsed.id || file.replace('.json',''),
                  name: parsed.name || 'Template',
                  category: parsed.category || 'Custom',
                  thumbnail,
                  size: parsed.size || { width: parsed.data?.width || 800, height: parsed.data?.height || 600 },
                  data: parsed.data || parsed.snapshot || parsed,
                });
          } catch (inner) {
            console.warn('Failed to parse template file', file, inner);
          }
        });
      }
    } catch (fsErr) {
      console.warn('Error reading templates directory:', fsErr);
    }

    // Combine templates from files, uploaded ones, and any fallback hardcoded ones
    const allTemplates = [...fileTemplates, ...uploadedTemplates, ...CUSTOM_TEMPLATES];

    return NextResponse.json({ 
      templates: allTemplates,
      success: true 
    });
  } catch (error) {
    console.error('Error in custom-templates API:', error);
    return NextResponse.json(
      { templates: CUSTOM_TEMPLATES, success: false, error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}