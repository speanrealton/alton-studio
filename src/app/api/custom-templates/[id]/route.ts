import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const templatesDir = path.join(process.cwd(), 'public', 'templates', 'json');
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json({ error: 'Templates directory not found', templates: [], success: false }, { status: 404 });
    }

    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
        const parsed = JSON.parse(content);
        const templateId = parsed.id || file.replace('.json', '');
        if (templateId === id) {
          const result = {
            id: parsed.id || templateId,
            name: parsed.name || 'Template',
            category: parsed.category || 'Custom',
            thumbnail: parsed.thumbnail || parsed.preview || `/templates/json/${file.replace('.json','')}.png`,
            size: parsed.size || { width: parsed.data?.width || 800, height: parsed.data?.height || 600 },
            data: parsed.data || parsed.snapshot || parsed,
          };
          return NextResponse.json({ template: result, success: true });
        }
      } catch (err) {
        // continue
      }
    }

    return NextResponse.json({ error: 'Template not found', success: false }, { status: 404 });
  } catch (error) {
    console.error('Error fetching template by id:', error);
    return NextResponse.json({ error: 'Server error', success: false }, { status: 500 });
  }
}
