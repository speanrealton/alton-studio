# Quote System - Supabase Migration Guide

## Issue Fixed
The `respondToQuote` error was caused by missing columns in the `quote_requests` table. The following columns were not present:
- `status` (to track pending/quoted/accepted states)
- `quoted_price` (to store the printer's quote price)
- `printer_notes` (to store additional notes from the printer)
- `delivery_time` (to store estimated delivery time)

## Steps to Fix

### 1. Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**

### 2. Run the Migration
Copy and paste the contents of `supabase/migrations/quote_requests.sql` and execute it.

The migration will:
- ✅ Create the `quote_requests` table with all required columns (if it doesn't exist)
- ✅ Add missing columns to existing table (if it already exists)
- ✅ Create necessary indexes for performance
- ✅ Set up Row-Level Security (RLS) policies
- ✅ Enable real-time subscriptions

### 3. Verify It Worked
After running the migration:
1. Go to **Database** → **Tables** in Supabase
2. Click on `quote_requests` table
3. Verify these columns exist:
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `printer_id` (UUID, foreign key to printers)
   - `service_type` (TEXT)
   - `quantity` (INTEGER)
   - `description` (TEXT)
   - `status` (TEXT) ← This is the important one
   - `quoted_price` (DECIMAL)
   - `printer_notes` (TEXT)
   - `delivery_time` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### 4. Test the Fix
1. Go back to your application
2. Open the printer dashboard
3. Click on a pending quote
4. Enter price, delivery time, and notes
5. Click "Send Quote"
6. Should see success message now! ✅

## What Changed in Code

The error handling in `respondToQuote` function now:
- Logs the actual error details: `console.error('Error updating quote request:', error)`
- Shows the error message to user: `Error sending quote: [actual error message]`
- This helps diagnose future issues quickly

## Real-Time Features Enabled
The migration also enables real-time subscriptions so:
- ✅ Client receives printer's quote response instantly
- ✅ Printer sees client messages in Messages tab instantly
- ✅ No need to refresh the page
