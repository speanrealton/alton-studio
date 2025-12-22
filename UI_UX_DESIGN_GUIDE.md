# Design Studio - UI/UX Features Guide

## 🎨 Modern Dark Theme Components

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Design Studio                                            │
│  Professional designs tailored to each template type         │
└─────────────────────────────────────────────────────────────┘
```
- Sticky at top (z-50)
- Gradient text for logo
- Backdrop blur effect
- Subtle border separator

### Design Type Selection Grid
```
SELECT DESIGN TYPE

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│   💼    │   🎨    │   📱    │   📄    │   📧    │
│Business │  Logo   │ Social  │ Flyer   │Letter   │
│ Card    │         │ Media   │         │ head    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```
- 5 columns on desktop, 2-3 on mobile
- Cards highlight on selection (blue gradient)
- Hover effects with border color change
- Description text visible on each

### Form Layout - Two Column

**Left Column (2/3 width):**
1. Design Type Info Card (gradient background)
   - Icon + Title + Description
   - Auto-updates when design selected

2. Required Information Section
   - Fields only show if required for design type
   - Larger padding for clarity
   - Focus ring on all inputs

3. Optional Contact Details Section
   - Collapsed unless relevant
   - Grid layout for compact display
   - Smaller font for secondary info

4. Colors & Image Section (2 columns)
   - Large circular color picker (56x56px)
   - Hex value displayed next to color
   - Image upload area with drag-drop support

5. Error Alert (when needed)
   - Red themed with icon
   - Clear error message
   - Only shows if validation fails

6. Generate Button
   - Blue gradient background
   - Glow effect on hover
   - Disabled state when fields incomplete
   - Spinner during generation

**Right Column (1/3 width):**
- Live Preview Panel (sticky)
- Preview area (aspect-square)
- Download button (green gradient)
- Stays visible while scrolling

### Color Palette
```
Background:    #010a1a (slate-950)
Secondary:     #0f172a (slate-900)
Borders:       #1e293b (slate-700)
Text Primary:  #ffffff (white)
Text Secondary:#cbd5e1 (slate-300)
Accent:        #3b82f6 (blue-500)
Success:       #22c55e (green-500)
Error:         #ef4444 (red-500)
```

### Typography System
```
Page Title:    32px (text-3xl) Bold
Section Head:  16px (text-base) Bold
Labels:        14px (text-sm) Medium
Input Text:    16px (base) Regular
Help Text:     12px (text-xs) Regular
```

### Spacing Grid
```
Padding:       p-6 (24px) for cards
Gap:           gap-6 (24px) between sections
Border Radius: rounded-xl (12px) for cards
             rounded-lg (8px) for inputs
```

### Interactive States

**Button States:**
```
Normal:   bg-blue-600 cursor-pointer
Hover:    bg-blue-700 shadow-lg
Active:   bg-blue-800
Disabled: bg-slate-600 cursor-not-allowed
```

**Input States:**
```
Default:  border-slate-700 bg-slate-900/60
Focus:    border-transparent ring-2 ring-blue-500
Error:    border-red-500
Success:  text-green-400
```

**Card States:**
```
Normal:   bg-slate-800/50 border-slate-700
Selected: bg-blue-600 border-blue-400
Hover:    bg-slate-700/50 border-slate-600
```

### Animation System
```
Smooth transitions:    300ms ease-in-out
Spin animation:        Loading spinner
Pulse animation:       Background elements
Delay pulse:           2000ms stagger
```

### Responsive Breakpoints
```
Mobile (< 768px):
- Single column layout
- Design type grid: 2 columns
- Stacked form sections

Tablet (768px - 1024px):
- 2 column layout (form + preview stacked)
- Design type grid: 3 columns
- Color/Image side-by-side

Desktop (> 1024px):
- 3 column layout (form | form | preview)
- Design type grid: 5 columns
- Sticky preview panel
```

## ✨ Key Visual Features

### Glassmorphism Effects
- Backdrop blur on all cards
- Semi-transparent backgrounds
- Colored borders for definition

### Gradient Accents
- Blue gradient: Primary actions
- Green gradient: Success/download
- Subtle background gradients

### Shadow System
```
Default:     shadow-none
Card:        shadow-md (default)
Button:      shadow-lg on hover
Blue glow:   shadow-blue-500/30
```

### Animated Background
- Blue and purple circles
- Mix-blend-multiply for depth
- 10% opacity for subtlety
- Staggered pulse animations

## 🎯 User Experience Flow

```
1. LAND ON PAGE
   ↓
   See gradient header & design grid
   Feel modern, professional

2. SELECT DESIGN TYPE
   ↓
   Card highlights with blue gradient
   Info card shows design details
   Form sections appear/disappear

3. FILL REQUIRED FIELDS
   ↓
   Only see what's needed
   Clear labels & icons
   Real-time validation

4. CUSTOMIZE
   ↓
   Pick colors with large picker
   Upload image if needed
   See live preview update

5. GENERATE
   ↓
   Spinner shows progress
   Preview updates in sidebar
   Download button appears

6. ITERATE
   ↓
   Change colors, settings
   Regenerate design
   Download when happy
```

## 🔧 Implementation Details

### CSS Classes Used
- `backdrop-blur-xl`: Header glass effect
- `bg-linear-to-br`: Gradient backgrounds
- `ring-2 ring-blue-500`: Focus state
- `shadow-lg shadow-blue-500/30`: Colored shadows
- `animate-spin`: Loading indicator
- `animate-pulse`: Background animation
- `mix-blend-multiply`: Color blending
- `delay-2000`: Staggered animations

### Conditional Rendering
```typescript
// Only show required fields section if design has required fields
{config.requiredFields.length > 0 && (
  <div>Required Information</div>
)}

// Only show optional contact section if applicable
{(config.optionalFields.includes('ownerName') || 
  config.optionalFields.includes('phone') || ...) && (
  <div>Contact Details</div>
)}
```

### State Management
- `category`: Current design type selected
- `companyName, tagline, industry`: Required fields
- `ownerName, title, phone, email, address, website`: Optional contact fields
- `colorPrimary, colorSecondary`: Colors
- `imageBase64`: Uploaded image
- `generatedImage`: Result SVG
- `loading, error`: Status states

## 📱 Mobile Optimization

- Full-width on small screens
- Single column form
- Sticky header for navigation
- Touch-friendly button sizes (48px minimum)
- Compact color picker labels
- Horizontal scroll for design grid (when needed)

## ♿ Accessibility Features

- Semantic HTML (labels with inputs)
- Focus indicators on all interactive elements
- Color not only cue for status
- Error messages associated with inputs
- Title attributes on interactive elements
- Proper heading hierarchy (h1, h3)
- Alt text on images
- ARIA labels where needed

## 🎬 Animations & Transitions

| Element | Animation | Duration | Effect |
|---------|-----------|----------|--------|
| Cards | Fade + Slide | 300ms | Smooth appearance |
| Buttons | Glow expand | 300ms | Interactive feedback |
| Spinner | Rotate | Infinite | Loading indicator |
| Background | Pulse | 4s + 2s delay | Ambient effect |
| Links | Color change | 300ms | Hover feedback |

---

**Color Consistency**: Blue for primary actions, Green for success, Red for errors
**Spacing Consistency**: All sections use 24px (p-6) padding
**Border Consistency**: All cards use rounded-xl (12px) radius
