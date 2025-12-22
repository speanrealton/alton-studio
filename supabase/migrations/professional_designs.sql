-- Professional Design Templates Table
CREATE TABLE IF NOT EXISTS professional_design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'business_card', 'letterhead', 'logo', 'flyer', 'social_media'
  description TEXT,
  thumbnail_url TEXT,
  base_prompt TEXT NOT NULL,
  default_colors JSONB, -- ["#667eea", "#764ba2"]
  default_fonts JSONB, -- {"heading": "Poppins", "body": "Inter"}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated Professional Designs
CREATE TABLE IF NOT EXISTS professional_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES professional_design_templates(id),
  company_name TEXT NOT NULL,
  tagline TEXT,
  industry TEXT,
  brand_colors JSONB,
  brand_fonts JSONB,
  ai_prompt TEXT,
  image_url TEXT,
  pdf_url TEXT,
  json_design JSONB,
  model_used TEXT, -- 'flux', 'stable_diffusion', etc.
  generation_time_ms INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Professional Design Settings (Brand Kit)
CREATE TABLE IF NOT EXISTS professional_design_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  industry TEXT,
  primary_color TEXT DEFAULT '#667eea',
  secondary_color TEXT DEFAULT '#764ba2',
  accent_color TEXT DEFAULT '#ff6b6b',
  font_heading TEXT DEFAULT 'Poppins',
  font_body TEXT DEFAULT 'Inter',
  logo_url TEXT,
  brand_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default templates
INSERT INTO professional_design_templates (name, category, description, base_prompt, default_colors, default_fonts)
VALUES
  (
    'Modern Business Card',
    'business_card',
    'Sleek, minimal business card design',
    'Create a professional modern business card design with {company_name} and {tagline}. Style: minimalist, clean, professional. Format: horizontal business card (3.5x2 inches)',
    '["#667eea", "#764ba2", "#ffffff"]'::jsonb,
    '{"heading": "Poppins", "body": "Inter"}'::jsonb
  ),
  (
    'Corporate Letterhead',
    'letterhead',
    'Professional letterhead with company branding',
    'Design a corporate letterhead for {company_name} in the {industry} industry. Include: company name, tagline, and professional layout. Style: corporate, clean, trustworthy',
    '["#1a202c", "#667eea", "#f7fafc"]'::jsonb,
    '{"heading": "Montserrat", "body": "Open Sans"}'::jsonb
  ),
  (
    'Modern Logo',
    'logo',
    'Contemporary logo design',
    'Create a modern, professional logo for {company_name}. Industry: {industry}. Description: {tagline}. Style: contemporary, minimalist, memorable',
    '["#667eea", "#764ba2"]'::jsonb,
    '{"heading": "Poppins"}'::jsonb
  ),
  (
    'Social Media Kit',
    'social_media',
    'Consistent social media graphics',
    'Design cohesive social media graphics for {company_name}. Include: profile header and post templates. Brand: {tagline}. Style: engaging, professional, on-brand',
    '["#667eea", "#764ba2", "#ff6b6b", "#4ecdc4"]'::jsonb,
    '{"heading": "Poppins", "body": "Inter"}'::jsonb
  ),
  (
    'Professional Flyer',
    'flyer',
    'Eye-catching promotional flyer',
    'Create a professional promotional flyer for {company_name}. Industry: {industry}. Purpose: {tagline}. Style: professional, eye-catching, action-oriented',
    '["#667eea", "#764ba2", "#ff6b6b"]'::jsonb,
    '{"heading": "Montserrat", "body": "Open Sans"}'::jsonb
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_professional_designs_user_id ON professional_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_designs_template_id ON professional_designs(template_id);
CREATE INDEX IF NOT EXISTS idx_professional_design_settings_user_id ON professional_design_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON professional_design_templates(category);
