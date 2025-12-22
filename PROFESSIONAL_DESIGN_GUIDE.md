# Professional Design System - Implementation Guide

## Overview
Your Alton Studio now has an integrated professional design generation system powered by Supabase + Replicate AI.

## Features

### 1. **Design Categories**
- Business Cards
- Letterheads
- Logos
- Social Media Graphics
- Promotional Flyers

### 2. **Smart Model Selection**
Each category uses optimized AI models:
- **Logo**: FLUX Pro + Realistic Vision
- **Business Card**: OpenJourney + FLUX
- **Letterhead**: Stable Diffusion 2.1 + FLUX
- **Social Media**: FLUX Dev + OpenJourney
- **Flyer**: FLUX + Stable Diffusion 3

### 3. **Design Customization**
Users provide:
- Company Name
- Tagline / Slogan
- Industry
- Design Category

AI generates designs tailored to business use.

## Database Schema

### `professional_design_templates`
Stores design templates with:
- Name, Category, Description
- Base prompt templates
- Default colors and fonts

### `professional_designs`
Tracks generated designs:
- User ID, Template ID
- Input data (company name, industry, etc.)
- Generated image URL
- PDF export URL (future)
- Generation status (pending/completed/failed)

### `professional_design_settings`
User brand kits (optional):
- Company colors
- Preferred fonts
- Logo URL
- Brand description

## How It Works

1. **User selects category** → Loads category-specific templates
2. **User enters company info** → AI generates professional prompt
3. **Backend calls Replicate** → Uses category-optimized model
4. **Image stored in Supabase** → Accessible for download/sharing
5. **Design metadata saved** → Track generation history

## API Routes

### `POST /api/professional-design/generate`
Generates a professional design.

**Request:**
```json
{
  "templateId": "uuid",
  "companyName": "Acme Corp",
  "tagline": "Innovation First",
  "industry": "Technology",
  "category": "business_card"
}
```

**Response:**
```json
{
  "success": true,
  "designId": "uuid",
  "image_url": "https://...",
  "model_used": "FLUX Pro"
}
```

### `GET /api/professional-design/templates?category=business_card`
Fetches templates for a category.

## Next Steps

### 1. Run Supabase Migration
```bash
supabase db push
```

This creates:
- `professional_design_templates` table
- `professional_designs` table
- `professional_design_settings` table
- Default template data

### 2. Test Professional Design Page
Navigate to `/professional-design` and generate a test design.

### 3. Add PDF Export (Optional)
Add to `src/lib/pdfExport.ts`:
```typescript
import jsPDF from 'jspdf';

export async function generatePDF(imageUrl: string, fileName: string) {
  const pdf = new jsPDF();
  pdf.addImage(imageUrl, 'JPEG', 0, 0, 210, 297);
  pdf.save(fileName);
}
```

### 4. Add Brand Kit Management
Create `/professional-design/brand-kit` page for users to:
- Set company colors
- Configure fonts
- Upload logos
- Store brand guidelines

## Environment Variables

Ensure you have:
```
REPLICATE_API_TOKEN=<your_token>
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## Cost Optimization

1. **Cache generated designs** → Don't regenerate similar requests
2. **Use cheaper models** → Start with free tier models, upgrade if needed
3. **Rate limiting** → Prevent abuse with user quotas
4. **Scheduled cleanup** → Delete old failed generation attempts

## Future Enhancements

1. **PDF Export** → Direct PDF download
2. **Brand Kit** → User can save their design preferences
3. **Batch Generation** → Generate multiple designs at once
4. **Design Editing** → Edit AI-generated designs in studio
5. **Team Collaboration** → Share designs with team members
6. **Design History** → View all generated designs
7. **Performance Metrics** → Track which models/prompts work best

## Troubleshooting

### "No models available"
- Check `REPLICATE_API_TOKEN` is set
- Verify Replicate account has credits
- Check model slugs are correct

### Design generation timeout
- Increase `maxAttempts` in `/api/professional-design/generate/route.ts`
- Use faster models (FLUX instead of Stable Diffusion 3)

### Supabase connection errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Run migration: `supabase db push`
- Check Supabase Studio for table creation

## Support

For issues:
1. Check `/api/professional-design/generate` response for `debug` field
2. Review Supabase Studio for data persistence
3. Check browser console for client-side errors
4. Review server logs for generation errors
