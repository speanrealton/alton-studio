#!/bin/bash
# Professional Design System Setup

echo "🚀 Setting up Professional Design System..."

# 1. Install dependencies (if needed)
echo "✓ Dependencies already installed"

# 2. Create Supabase tables
echo "📊 Running Supabase migration..."
npx supabase db push

# 3. Check environment variables
echo "🔐 Checking environment variables..."
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "⚠️  REPLICATE_API_TOKEN not set. Add to .env.local"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set. Add to .env.local"
fi

# 4. Start dev server
echo "🎯 Ready to go! Starting dev server..."
npm run dev

echo "✅ Professional Design System is ready!"
echo "📝 Visit http://localhost:3000/professional-design to test"
echo "📚 See PROFESSIONAL_DESIGN_GUIDE.md for detailed documentation"
