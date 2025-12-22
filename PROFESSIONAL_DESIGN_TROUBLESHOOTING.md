## ✅ Professional Design System - Troubleshooting Checklist

### 1. **Setup Database** (REQUIRED)
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy-paste the SQL from the message above (all the CREATE TABLE statements)
- [ ] Click "Run"
- [ ] Verify 5 templates are created in `professional_design_templates`

### 2. **Check Environment Variables** (CRITICAL)
Create `.env.local` with:
```
REPLICATE_API_TOKEN=your_replicate_token_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Verify:
- [ ] `REPLICATE_API_TOKEN` is set
- [ ] `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

### 3. **Test the System**
```bash
npm run dev
```

Navigate to: `http://localhost:3000/professional-design`

Test:
- [ ] Page loads and shows categories
- [ ] Categories change templates
- [ ] Can type company name
- [ ] Can click "Generate Design"
- [ ] Check browser console for errors (F12)
- [ ] Check server console for logs

### 4. **If Generation Fails**

**Check server logs for:**
```
✅ Fetched X templates
❌ No image generated after trying all models
🔐 Check Replicate API token and account credits
```

**Common errors:**

| Error | Fix |
|-------|-----|
| `Replicate API token not configured` | Add `REPLICATE_API_TOKEN` to `.env.local` |
| `No candidate models found in config` | Check SQL was executed in Supabase |
| `Failed to fetch templates` | Verify Supabase URL and keys in `.env.local` |
| `All models in failure cache` | Wait 30-60 seconds, then try again |
| `402 Insufficient credit` | Add billing to Replicate account |
| `429 Rate limited` | Wait, then retry (backoff handling in place) |

### 5. **Debug Mode**

Open browser F12 (DevTools) and check Console:

Should see:
```
📤 Sending request to /api/professional-design/generate
📥 Response: { success: true, image_url: "...", ... }
```

If you see errors, the message will tell you what's wrong.

### 6. **Database Verification**

Go to Supabase Studio → Tables:
- [ ] `professional_design_templates` has 5 rows
- [ ] `professional_designs` exists (empty until you generate)
- [ ] `professional_design_settings` exists (empty)

### 7. **Quick Fix: Test with cURL**

In terminal, test the templates endpoint:
```bash
curl "http://localhost:3000/api/professional-design/templates?category=business_card"
```

Should return JSON with templates.

### 8. **Still Not Working?**

1. **Clear cache:**
   ```bash
   rm -r .next
   npm run dev
   ```

2. **Reinstall deps:**
   ```bash
   rm -r node_modules package-lock.json
   npm install
   npm run dev
   ```

3. **Check logs:**
   - Server console should show: `✅ Template found` and `✅ Design generated successfully`
   - If not, scroll up in server output for `❌` errors

4. **Test templates endpoint directly:**
   - Open in browser: `http://localhost:3000/api/professional-design/templates`
   - Should return JSON array with templates

### 9. **Replicate Account Check**

Go to https://replicate.com:
- [ ] Logged in
- [ ] Account has API token
- [ ] Account has credits or billing enabled
- [ ] Models you're trying exist (check model page)

### 10. **Last Resort**

If still stuck, check:
1. Supabase table exists: `SELECT * FROM professional_design_templates LIMIT 1;` in SQL editor
2. Replicate token works: Test on replicate.com directly
3. Network: Check if browser can reach Supabase and Replicate
