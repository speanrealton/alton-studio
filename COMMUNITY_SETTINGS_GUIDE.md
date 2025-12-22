# Community Settings Feature Guide

## Overview
The Community Settings feature allows users to customize their community page experience in real-time. Users can change layouts, toggle sections, adjust sorting, and manage notification preferences all from a dedicated settings modal.

## Features Implemented

### 1. **Settings Button/Icon** 
- Located in the top navbar of the community page
- Gear icon (⚙️) next to the dark mode toggle
- Click to open the settings modal
- Real-time feedback with visual indication

### 2. **Layout View Options**
- **Grid Layout**: Displays circles and posts in a responsive grid (2 columns on desktop)
- **List Layout**: Shows posts in a traditional list format for sequential reading
- Changes apply immediately when switching between views
- Respects the layout preference when displaying content

### 3. **Customizable Sections**
- **Show Trending Circles**: Toggle visibility of trending circles section
- **Show Latest Posts**: Toggle visibility of latest posts section
- Allows users to customize their page layout to focus on what matters to them

### 4. **Notification Preferences**
- Toggle community notifications on/off
- Syncs with the notification system
- Preference is stored and persisted across sessions

### 5. **Post Sorting Options**
- **Latest First** (default): Most recent posts appear first
- **Trending First**: Posts sorted by engagement (likes/comments)
- **Oldest First**: Chronological order from oldest to newest
- Changes apply in real-time to the feed

### 6. **Posts Per Page Slider**
- Adjustable range: 5 to 50 posts per page
- Default: 10 posts
- Allows users to control how many posts load initially
- Reduces scrolling for those who prefer compact feeds

### 7. **Settings Persistence**
- **Local Storage**: All settings saved to browser localStorage for instant retrieval
- **Database Sync**: Settings also sync to Supabase when user is authenticated
- **Offline Support**: Settings work even if database sync fails
- **Auto-save**: Settings save automatically when user clicks "Save Settings"

## How to Use

### Opening Settings
1. Click the gear icon (⚙️) in the top-right navbar of the community page
2. The settings modal will slide in from the center of the screen

### Changing Layout
1. Open Settings
2. Click either the "Grid" or "List" button to switch layouts
3. The change applies immediately to posts display

### Toggling Sections
1. Open Settings
2. Click the toggle switches for:
   - Show Trending Circles
   - Show Latest Posts
   - Enable Notifications
3. Sections appear/disappear based on your preferences

### Adjusting Sort Order
1. Open Settings
2. Click the "Sort Posts By" dropdown
3. Select your preferred sorting method
4. Posts re-order automatically

### Setting Posts Per Page
1. Open Settings
2. Drag the "Posts Per Page" slider (5-50)
3. The number below the slider shows the current value
4. Preview takes effect after saving

### Saving & Resetting
- **Save Settings**: Click "Save Settings" to apply all changes
- **Reset Defaults**: Click "Reset Defaults" to restore original settings
- **Auto-Load**: Settings load automatically on next page visit

## Technical Implementation

### State Management
```typescript
- layoutView: 'grid' | 'list'
- showTrendingCircles: boolean
- showLatestPosts: boolean
- postsPerPage: number (5-50)
- sortBy: 'latest' | 'trending' | 'oldest'
- enableNotifications: boolean
```

### Storage Methods
1. **localStorage**: For immediate client-side access
   - Key: `communityLayoutView`
   - Key: `communityShowTrending`
   - Key: `communityShowLatest`
   - Key: `communityPostsPerPage`
   - Key: `communitySortBy`
   - Key: `communityEnableNotifications`

2. **Supabase Database**: For authenticated users
   - Table: `community_settings`
   - Stores user_id, all preference fields, timestamps
   - Row-level security enabled
   - Auto-timestamp on updates

### Real-Time Sync
- Changes apply immediately to the UI
- Database sync happens asynchronously
- If sync fails, localStorage serves as fallback
- No user-facing errors if database sync fails

### Responsive Design
- Modal works on all screen sizes
- Mobile-optimized with proper padding and spacing
- Toggles have proper touch targets (44px minimum)
- Slider is mobile-friendly

## Database Schema

### community_settings Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- layout_view: TEXT ('grid' or 'list')
- show_trending_circles: BOOLEAN
- show_latest_posts: BOOLEAN
- posts_per_page: INTEGER (5-50)
- sort_by: TEXT ('latest', 'trending', 'oldest')
- enable_notifications: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP (auto-updated)
```

### Security
- Row-level security (RLS) enabled
- Users can only read/update their own settings
- Timestamps auto-managed by database triggers

## UI/UX Features

### Visual Feedback
- Active toggle switches highlight in purple
- Selected buttons show purple background
- Smooth animations when opening/closing modal
- Success notification after saving

### Accessibility
- Clear labels for all settings
- Proper color contrast in dark/light modes
- Large touch targets for mobile
- Keyboard-friendly controls

### Information
- Info box explaining persistence
- Helpful tooltips on hover (settings button)
- Clear section headers with icons
- Visual distinction between settings groups

## Performance Optimization

1. **Lazy Loading**: Post rendering optimized with `slice()` for postsPerPage limit
2. **Conditional Rendering**: Sections only render if their toggle is enabled
3. **Memoization**: Fetch function optimized to prevent infinite loops
4. **Responsive Images**: Uses Next.js Image component where applicable

## Future Enhancement Possibilities

1. **Community-Specific Settings**: Different settings per circle
2. **Content Filters**: Filter by post type, media, date range
3. **Theme Customization**: Font size, accent colors, spacing
4. **Advanced Sorting**: By engagement rate, reply count, etc.
5. **Saved Views**: Save multiple setting presets
6. **Export Settings**: Share or backup settings
7. **Analytics**: Track which settings are most used

## Troubleshooting

### Settings Not Saving
- Check browser localStorage is enabled
- Ensure user is authenticated for database sync
- Check browser console for errors
- Try clearing localStorage and resetting defaults

### Layout Not Changing
- Refresh the page
- Verify layout setting is saved in localStorage
- Check for JavaScript errors in console
- Ensure CSS classes are properly loaded

### Notifications Not Working
- Verify enableNotifications is true
- Check notifications page for blocked notifications
- Ensure user is authenticated
- Check browser notification permissions

## Integration Points

- **Community Page**: Main display logic
- **Authentication System**: User identification for settings storage
- **Notification System**: Uses notification preference
- **Database**: Supabase for persistence
- **Local Storage**: Browser caching for performance
- **UI Components**: Lucide icons, Framer Motion animations, Tailwind CSS

## File Structure

```
src/app/community/
├── page.tsx (main file with all settings logic)

supabase/migrations/
└── community_settings.sql (database schema)
```

---

**Last Updated**: December 20, 2025
**Status**: ✅ Fully Implemented
