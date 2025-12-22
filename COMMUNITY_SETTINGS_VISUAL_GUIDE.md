# Community Settings - Visual Reference Guide

## Settings Modal Layout

```
┌─────────────────────────────────────────┐
│ ⚙️  Community Settings            X     │
├─────────────────────────────────────────┤
│                                         │
│  📐 LAYOUT VIEW                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ ▦▦▦ Grid │  │ ≡ List   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  📊 TRENDING CIRCLES                   │
│  ▦▦▦▦ Toggle  ●━━━━━━━━━━━━━━ OFF     │
│                                         │
│  ⚡ LATEST POSTS                       │
│  ▦▦▦▦ Toggle  ●━━━━━━━━━━━━━━ ON      │
│                                         │
│  🔔 ENABLE NOTIFICATIONS                │
│  ▦▦▦▦ Toggle  ●━━━━━━━━━━━━━━ ON      │
│                                         │
│  SORT POSTS BY                          │
│  ┌─────────────────────────────┐       │
│  │ Latest First ▼              │       │
│  └─────────────────────────────┘       │
│                                         │
│  POSTS PER PAGE: 10                     │
│  ├─────────●─────────┤                 │
│  5         10        50                 │
│                                         │
│  ℹ️  Your preferences are saved...    │
│                                         │
├─────────────────────────────────────────┤
│  [Reset Defaults]  [Save Settings]     │
└─────────────────────────────────────────┘
```

## Navbar Position

```
┌────────────────────────────────────────────────────┐
│ 🔍 Search...    ⚙️  🌙  🔔  👤 Account            │
│                 ↑                                   │
│              Settings Button                       │
└────────────────────────────────────────────────────┘
```

## Grid Layout View

```
Post 1        Post 2
━━━━━━━━━    ━━━━━━━━━
[Image]       [Image]
[Reactions]   [Reactions]

Post 3        Post 4
━━━━━━━━━    ━━━━━━━━━
[Image]       [Image]
[Reactions]   [Reactions]
```

## List Layout View

```
👤 Author 1
📝 Post content text here...
[Image preview]
❤️ 234  💬 12  📌  📤

👤 Author 2
📝 Post content text here...
[Image preview]
❤️ 156  💬 8  📌  📤

👤 Author 3
📝 Post content text here...
[Image preview]
❤️ 89  💬 5  📌  📤
```

## Toggle Switch Behavior

### OFF State
```
┌──────────────────┐
│ Label      ●    │
│            🔘    │ (Gray/Light)
└──────────────────┘
```

### ON State
```
┌──────────────────┐
│ Label         ● │
│               🔘  │ (Purple)
└──────────────────┘
```

## Slider Control

### Posts Per Page Slider

```
Min (5)        Mid (10)        Max (50)
  |              ●               |
  ├──────────────●───────────────┤
  5             10              50

After Drag:
  |              |      ●        |
  ├──────────────●───────────────┤
  5             20              50
  
Display: "Posts Per Page: 20"
```

## Settings State Indicators

### Active Button
```
┌──────────────┐
│ ■ Grid       │ ← Purple border & bg
└──────────────┘
```

### Inactive Button
```
┌──────────────┐
│ □ List       │ ← Gray border
└──────────────┘
```

## Notification After Save

```
┌─────────────────────────────┐
│ ✓ Settings Saved            │
│ Your community preferences  │
│ have been updated           │  ← Auto-hides after 2s
│                         X   │
└─────────────────────────────┘
```

## Data Flow Diagram

```
User Interaction
      ↓
┌─────────────────┐
│ Update Local    │
│ State           │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Apply Changes   │ (Instant)
│ to UI           │
└────────┬────────┘
         ↓
    [User sees change]
         ↓
┌─────────────────┐
│ Save Settings   │
│ Button Clicked  │
└────────┬────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
[Local]    [Database]
Storage    (Async)
    │         │
    └────┬────┘
         ↓
    Success
    Notification
```

## Storage Strategy

```
┌─────────────────────────────────────────┐
│          User Settings                  │
├─────────────────────────────────────────┤
│                                         │
│  📱 Local Storage (Instant)            │
│  ├── layoutView: 'grid'                │
│  ├── showTrendingCircles: true        │
│  ├── showLatestPosts: true             │
│  ├── postsPerPage: 10                  │
│  ├── sortBy: 'latest'                  │
│  └── enableNotifications: true         │
│                                         │
│  ☁️  Cloud Storage (Supabase)          │
│  ├── user_id: UUID                     │
│  ├── (same fields as above)            │
│  ├── created_at: timestamp             │
│  └── updated_at: timestamp             │
│                                         │
│  ⚡ Real-time Sync                    │
│  When user is logged in                │
│                                         │
└─────────────────────────────────────────┘
```

## User Journey

### First Time
```
1. Click ⚙️ Settings
   ↓
2. Modal opens
   ↓
3. See default settings
   ↓
4. Customize as desired
   ↓
5. Click "Save Settings"
   ↓
6. See "✓ Settings Saved"
   ↓
7. Feed updates immediately
```

### Return Visit
```
1. Visit community page
   ↓
2. Your settings load from localStorage
   ↓
3. Feed displays with your preferences
   ↓
4. (Database syncs in background if logged in)
```

### Multi-Device (Logged In)
```
Device A: Save Settings
   ↓
Database Updated
   ↓
Device B: Visit Community
   ↓
Load from Database
   ↓
Same settings appear!
```

## Accessibility Features

```
┌──────────────────────────────────────┐
│ Accessibility Support                │
├──────────────────────────────────────┤
│                                      │
│ ✓ Keyboard Navigation                │
│   Tab through all controls           │
│   Enter/Space to activate            │
│                                      │
│ ✓ Screen Reader Compatible           │
│   aria-label on all buttons          │
│   aria-pressed for toggles           │
│   aria-checked for switches          │
│                                      │
│ ✓ Color Contrast                     │
│   WCAG AAA compliant                 │
│   Dark mode support                  │
│                                      │
│ ✓ Touch Friendly                     │
│   44px+ touch targets                │
│   Mobile optimized                   │
│                                      │
│ ✓ Semantic HTML                      │
│   Proper heading hierarchy           │
│   Label associations                 │
│                                      │
└──────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────┐
│ Performance Features                │
├─────────────────────────────────────┤
│                                     │
│ 📉 Reduced Rendering                │
│    Only show enabled sections       │
│    Posts sliced to per-page limit   │
│                                     │
│ ⚡ Lazy Loading                     │
│    Load only visible content        │
│    Cache settings locally           │
│                                     │
│ 🎬 Smooth Animations                │
│    GPU-accelerated (Framer Motion) │
│    60fps transitions                │
│                                     │
│ 🔄 Efficient State                  │
│    Memoized fetch function          │
│    Prevent unnecessary re-renders   │
│                                     │
└─────────────────────────────────────┘
```

## Error Handling

```
User Action
   ↓
Try Database Update
   │
   ├─ Success → Update Complete
   │
   └─ Failure → Fallback to localStorage
                 Show generic success
                 (Data still persisted locally)
```

## Settings Impact Matrix

```
Setting          Grid    List    Posts  Sort   Toggle
─────────────────────────────────────────────────────
Layout View      ✓✓      ✓✓      ✓      ✓      ✓
Sort Order       ✓       ✓       ✓      ✓✓     ✓
Posts/Page       ✓       ✓       ✓✓     ✓      ✓
Show/Hide        ✓✓      ✓✓      ✓      ✓      ✓✓
─────────────────────────────────────────────────────
Legend: ✓ = affects, ✓✓ = main effect
```

---

**Visual Reference Guide for Community Settings**
**Version 1.0 | December 20, 2025**
