# 📋 Copy-Paste Code Templates - Add 8 Styles to Each Generator

This file contains ready-to-copy code for adding 8 styles to each of your 9 remaining generators.

## Quick Start

For each generator:
1. Find `getRandomStyle()` function → Change `* 4` to `* 8`
2. Find the style switch/if-else block
3. Add the code block for your generator from below
4. Test by generating multiple times

---

## 1️⃣ Logo Generator

**File**: `src/lib/design-generators/logo-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code** (after the last `else if (style === 3)` block):

```typescript
} else if (style === 4) {
  // STYLE 5: Gradient Burst
  const gradId = `burst-${Math.random()}`;
  svg += `<defs><radialGradient id="${gradId}"><stop offset="0%" style="stop-color:${colorPrimary}"/><stop offset="100%" style="stop-color:${colorSecondary}"/></radialGradient></defs>`;
  svg += `<circle cx="150" cy="150" r="140" fill="url(#${gradId})"/>`;
  svg += `<circle cx="150" cy="150" r="110" fill="white" opacity="0.1"/>`;
  svg += `<circle cx="150" cy="150" r="80" fill="white" opacity="0.05"/>`;
  svg += `<text x="150" y="170" text-anchor="middle" class="logo-text" fill="white" font-weight="bold" font-size="28">${companyName}</text>`;

} else if (style === 5) {
  // STYLE 6: Geometric Lines
  svg += `<rect width="300" height="300" fill="white" stroke="${colorPrimary}" stroke-width="4"/>`;
  svg += `<line x1="0" y1="75" x2="300" y2="75" stroke="${colorSecondary}" stroke-width="2" opacity="0.6"/>`;
  svg += `<line x1="0" y1="150" x2="300" y2="150" stroke="${colorPrimary}" stroke-width="2" opacity="0.4"/>`;
  svg += `<line x1="0" y1="225" x2="300" y2="225" stroke="${colorSecondary}" stroke-width="2" opacity="0.6"/>`;
  svg += `<text x="150" y="155" text-anchor="middle" class="logo-text" fill="${colorPrimary}" font-weight="bold" font-size="26">${companyName}</text>`;

} else if (style === 6) {
  // STYLE 7: Hexagon Pattern
  const hexX = 150, hexY = 120, hexSize = 55;
  svg += `<polygon points="${hexX},${hexY - hexSize} ${hexX + hexSize * 0.866},${hexY - hexSize * 0.5} ${hexX + hexSize * 0.866},${hexY + hexSize * 0.5} ${hexX},${hexY + hexSize} ${hexX - hexSize * 0.866},${hexY + hexSize * 0.5} ${hexX - hexSize * 0.866},${hexY - hexSize * 0.5}" fill="${colorPrimary}" opacity="0.15" stroke="${colorPrimary}" stroke-width="2"/>`;
  svg += `<circle cx="150" cy="150" r="55" fill="white" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="150" y="165" text-anchor="middle" class="logo-text" fill="${colorPrimary}" font-size="20" font-weight="bold">${companyName}</text>`;

} else if (style === 7) {
  // STYLE 8: Wave Motion
  svg += `<path d="M0,100 Q50,50 100,100 T200,100 T300,100" stroke="${colorPrimary}" stroke-width="4" fill="none"/>`;
  svg += `<path d="M0,140 Q50,90 100,140 T200,140 T300,140" stroke="${colorSecondary}" stroke-width="3" fill="none" opacity="0.7"/>`;
  svg += `<path d="M0,180 Q50,130 100,180 T200,180 T300,180" stroke="${colorPrimary}" stroke-width="2" fill="none" opacity="0.4"/>`;
  svg += `<text x="150" y="250" text-anchor="middle" class="logo-text" fill="${colorPrimary}" font-weight="bold" font-size="24">${companyName}</text>`;
}
```

---

## 2️⃣ Flyer Generator

**File**: `src/lib/design-generators/flyer-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code** (after the last style block):

```typescript
} else if (style === 4) {
  // STYLE 5: Dark Overlay with Accent
  svg += `<rect width="${width}" height="${height}" fill="${colorPrimary}" opacity="0.92"/>`;
  svg += `<rect width="${width}" height="100" fill="${colorSecondary}" opacity="0.4"/>`;
  svg += `<text x="${width/2}" y="220" text-anchor="middle" class="flyer-title" fill="white" font-size="72" font-weight="bold">${headline}</text>`;
  svg += `<line x1="200" y1="280" x2="${width - 200}" y2="280" stroke="${colorSecondary}" stroke-width="3" opacity="0.8"/>`;
  svg += `<text x="${width/2}" y="360" text-anchor="middle" class="flyer-subtitle" fill="rgba(255,255,255,0.95)" font-size="32">${tagline}</text>`;
  svg += `<circle cx="${width - 150}" cy="${height - 150}" r="120" fill="white" opacity="0.08"/>`;

} else if (style === 5) {
  // STYLE 6: Three Column Layout
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  const colWidth = width / 3;
  svg += `<rect x="0" y="0" width="${colWidth}" height="${height}" fill="${colorPrimary}" opacity="0.9"/>`;
  svg += `<rect x="${colWidth}" y="0" width="${colWidth}" height="${height}" fill="${colorSecondary}" opacity="0.12"/>`;
  svg += `<rect x="${colWidth * 2}" y="0" width="${colWidth}" height="${height}" fill="white"/>`;
  svg += `<text x="${colWidth * 1.5}" y="150" text-anchor="middle" class="flyer-title" fill="${colorPrimary}" font-size="68" font-weight="bold">${headline}</text>`;
  svg += `<text x="${colWidth * 1.5}" y="240" text-anchor="middle" class="flyer-subtitle" fill="#333" font-size="32">${tagline}</text>`;

} else if (style === 6) {
  // STYLE 7: Diagonal Split Design
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<defs><linearGradient id="diagGrad"><stop offset="0%" style="stop-color:${colorPrimary}"/><stop offset="100%" style="stop-color:${colorSecondary}"/></linearGradient></defs>`;
  svg += `<polygon points="0,0 ${width * 0.4},0 ${width},${height} 0,${height}" fill="url(#diagGrad)" opacity="0.15"/>`;
  svg += `<text x="120" y="200" class="flyer-title" fill="${colorPrimary}" font-size="68" font-weight="bold">${headline}</text>`;
  svg += `<text x="120" y="300" class="flyer-subtitle" fill="#333" font-size="34">${tagline}</text>`;
  svg += `<line x1="100" y1="320" x2="400" y2="320" stroke="${colorSecondary}" stroke-width="4" opacity="0.6"/>`;

} else if (style === 7) {
  // STYLE 8: Centered Focal Point
  svg += `<rect width="${width}" height="${height}" fill="${colorSecondary}" opacity="0.05"/>`;
  const centerX = width / 2;
  const centerY = height / 2;
  svg += `<circle cx="${centerX}" cy="${centerY - 80}" r="200" fill="${colorPrimary}" opacity="0.15"/>`;
  svg += `<circle cx="${centerX}" cy="${centerY - 80}" r="150" fill="${colorSecondary}" opacity="0.1"/>`;
  svg += `<text x="${centerX}" y="${centerY - 50}" text-anchor="middle" class="flyer-title" fill="${colorPrimary}" font-size="72" font-weight="bold">${headline}</text>`;
  svg += `<text x="${centerX}" y="${centerY + 80}" text-anchor="middle" class="flyer-subtitle" fill="#333" font-size="36">${tagline}</text>`;
  svg += `<text x="${centerX}" y="${centerY + 150}" text-anchor="middle" class="flyer-text" fill="#555" font-size="20">${description || 'Your message here'}</text>`;
}
```

---

## 3️⃣ Social Media Generator

**File**: `src/lib/design-generators/social-media-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Gradient Mesh Background
  const meshId = `mesh-${Math.random()}`;
  svg += `<defs><linearGradient id="${meshId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${colorPrimary}"/><stop offset="50%" style="stop-color:${colorSecondary}"/><stop offset="100%" style="stop-color:${colorPrimary}"/></linearGradient></defs>`;
  svg += `<rect width="${width}" height="${height}" fill="url(#${meshId})"/>`;
  svg += `<circle cx="${width * 0.7}" cy="${height * 0.3}" r="120" fill="white" opacity="0.15"/>`;
  svg += `<circle cx="${width * 0.2}" cy="${height * 0.8}" r="100" fill="white" opacity="0.1"/>`;
  svg += `<text x="${width/2}" y="${height/2 + 20}" text-anchor="middle" class="social-title" fill="white" font-size="56" font-weight="bold">${heading}</text>`;

} else if (style === 5) {
  // STYLE 6: Glassmorphism Card
  svg += `<rect width="${width}" height="${height}" fill="${colorPrimary}" opacity="0.95"/>`;
  svg += `<rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="white" opacity="0.1" rx="30" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>`;
  svg += `<rect x="60" y="60" width="${width - 120}" height="100" fill="white" opacity="0.08" rx="20"/>`;
  svg += `<text x="${width/2}" y="${height/2 - 30}" text-anchor="middle" class="social-title" fill="white" font-size="60" font-weight="bold">${heading}</text>`;
  svg += `<text x="${width/2}" y="${height/2 + 60}" text-anchor="middle" class="social-subtitle" fill="rgba(255,255,255,0.9)" font-size="28">${subheading}</text>`;

} else if (style === 6) {
  // STYLE 7: Split Diagonal Accent
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<polygon points="0,0 ${width},0 ${width},${height * 0.7} 0,${height}" fill="${colorPrimary}" opacity="0.2"/>`;
  svg += `<line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${colorSecondary}" stroke-width="6" opacity="0.3"/>`;
  svg += `<text x="${width/2}" y="${height/2 - 40}" text-anchor="middle" class="social-title" fill="${colorPrimary}" font-size="64" font-weight="bold">${heading}</text>`;
  svg += `<text x="${width/2}" y="${height/2 + 50}" text-anchor="middle" class="social-subtitle" fill="#333" font-size="32">${subheading}</text>`;

} else if (style === 7) {
  // STYLE 8: Corner Emphasis with Blur
  svg += `<rect width="${width}" height="${height}" fill="${colorSecondary}" opacity="0.08"/>`;
  svg += `<rect x="0" y="0" width="160" height="160" fill="${colorPrimary}" opacity="0.8"/>`;
  svg += `<rect x="${width - 160}" y="${height - 160}" width="160" height="160" fill="${colorSecondary}" opacity="0.8"/>`;
  svg += `<circle cx="80" cy="80" r="90" fill="white" opacity="0.1"/>`;
  svg += `<circle cx="${width - 80}" cy="${height - 80}" r="90" fill="white" opacity="0.1"/>`;
  svg += `<text x="${width/2}" y="${height/2}" text-anchor="middle" class="social-title" fill="${colorPrimary}" font-size="62" font-weight="bold">${heading}</text>`;
  svg += `<text x="${width/2}" y="${height/2 + 70}" text-anchor="middle" class="social-subtitle" fill="#333" font-size="32">${subheading}</text>`;
}
```

---

## 4️⃣ Letterhead Generator

**File**: `src/lib/design-generators/letterhead-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Side Stripe with Logo
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="60" height="${height}" fill="${colorPrimary}" opacity="0.85"/>`;
  svg += `<rect x="0" y="0" width="60" height="${height * 0.3}" fill="${colorSecondary}" opacity="0.85"/>`;
  svg += `<text x="150" y="80" class="letterhead-company" fill="${colorPrimary}" font-weight="bold" font-size="36">${companyName}</text>`;
  svg += `<text x="150" y="120" class="letterhead-tagline" fill="${colorSecondary}" font-size="16">${tagline}</text>`;
  svg += `<line x1="150" y1="140" x2="700" y2="140" stroke="${colorPrimary}" stroke-width="2" opacity="0.5"/>`;

} else if (style === 5) {
  // STYLE 6: Bottom Footer Style
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<text x="150" y="100" class="letterhead-company" fill="${colorPrimary}" font-weight="bold" font-size="40">${companyName}</text>`;
  svg += `<text x="150" y="145" class="letterhead-tagline" fill="#666" font-size="18">${tagline}</text>`;
  svg += `<line x1="100" y1="170" x2="${width - 100}" y2="170" stroke="${colorSecondary}" stroke-width="1.5" opacity="0.4"/>`;
  svg += `<rect x="0" y="${height - 100}" width="${width}" height="100" fill="${colorPrimary}" opacity="0.08"/>`;
  svg += `<text x="150" y="${height - 60}" class="letterhead-footer" fill="#333" font-size="12">${email} | ${phone} | ${website}</text>`;

} else if (style === 6) {
  // STYLE 7: Centered Elegant
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<circle cx="${width/2}" cy="80" r="50" fill="${colorPrimary}" opacity="0.1"/>`;
  svg += `<text x="${width/2}" y="110" text-anchor="middle" class="letterhead-company" fill="${colorPrimary}" font-weight="bold" font-size="38">${companyName}</text>`;
  svg += `<text x="${width/2}" y="150" text-anchor="middle" class="letterhead-tagline" fill="#666" font-size="16">${tagline}</text>`;
  svg += `<line x1="${width * 0.2}" y1="170" x2="${width * 0.8}" y2="170" stroke="${colorSecondary}" stroke-width="2" opacity="0.6"/>`;

} else if (style === 7) {
  // STYLE 8: Modern Minimalist
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="${width}" height="4" fill="${colorPrimary}"/>`;
  svg += `<text x="100" y="80" class="letterhead-company" fill="#222" font-weight="bold" font-size="32">${companyName}</text>`;
  svg += `<text x="100" y="110" class="letterhead-tagline" fill="#999" font-size="14">${tagline}</text>`;
  svg += `<text x="100" y="140" class="letterhead-contact" fill="#666" font-size="12">${email}</text>`;
  svg += `<text x="100" y="158" class="letterhead-contact" fill="#666" font-size="12">${phone}</text>`;
}
```

---

## 5️⃣ Email Generator

**File**: `src/lib/design-generators/email-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Banner Header Style
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<defs><linearGradient id="emailBanner"><stop offset="0%" style="stop-color:${colorPrimary}"/><stop offset="100%" style="stop-color:${colorSecondary}"/></linearGradient></defs>`;
  svg += `<rect width="${width}" height="120" fill="url(#emailBanner)"/>`;
  svg += `<text x="${width/2}" y="80" text-anchor="middle" class="email-title" fill="white" font-weight="bold" font-size="42">${subject}</text>`;
  svg += `<rect x="50" y="150" width="${width - 100}" height="2" fill="${colorPrimary}" opacity="0.3"/>`;

} else if (style === 5) {
  // STYLE 6: Card-Based Layout
  svg += `<rect width="${width}" height="${height}" fill="${colorSecondary}" opacity="0.05"/>`;
  svg += `<rect x="30" y="30" width="${width - 60}" height="200" fill="white" stroke="${colorPrimary}" stroke-width="2" rx="8"/>`;
  svg += `<text x="50" y="70" class="email-title" fill="${colorPrimary}" font-weight="bold" font-size="32">${subject}</text>`;
  svg += `<text x="50" y="110" class="email-text" fill="#333" font-size="16">${preview}</text>`;

} else if (style === 6) {
  // STYLE 7: Two-Column Email
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  const midpoint = width / 2;
  svg += `<rect x="0" y="0" width="${midpoint}" height="${height}" fill="${colorPrimary}" opacity="0.12"/>`;
  svg += `<text x="${midpoint * 0.5}" y="60" text-anchor="middle" class="email-title" fill="${colorPrimary}" font-weight="bold" font-size="28">${subject}</text>`;
  svg += `<text x="${midpoint + 50}" y="60" class="email-title" fill="#333" font-size="24" font-weight="bold">Message</text>`;

} else if (style === 7) {
  // STYLE 8: Minimal Professional
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="${width}" height="8" fill="${colorPrimary}"/>`;
  svg += `<text x="40" y="60" class="email-title" fill="#222" font-weight="bold" font-size="36">${subject}</text>`;
  svg += `<line x1="40" y1="75" x2="150" y2="75" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="40" y="120" class="email-text" fill="#555" font-size="16">${preview}</text>`;
}
```

---

## 6️⃣ Invoice Generator

**File**: `src/lib/design-generators/invoice-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Accounting Formal
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="${width}" height="80" fill="${colorPrimary}" opacity="0.95"/>`;
  svg += `<text x="${width/2}" y="55" text-anchor="middle" class="invoice-title" fill="white" font-weight="bold" font-size="48">INVOICE</text>`;
  svg += `<line x1="0" y1="100" x2="${width}" y2="100" stroke="${colorPrimary}" stroke-width="2" opacity="0.3"/>`;

} else if (style === 5) {
  // STYLE 6: Clean Minimal
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<circle cx="${width - 80}" cy="50" r="60" fill="${colorPrimary}" opacity="0.15"/>`;
  svg += `<text x="50" y="60" class="invoice-label" fill="#999" font-size="14">Invoice #:</text>`;
  svg += `<text x="200" y="60" class="invoice-label" fill="#222" font-size="14" font-weight="bold">${invoiceNumber || '001'}</text>`;
  svg += `<text x="50" y="100" class="invoice-title" fill="${colorPrimary}" font-weight="bold" font-size="36">INVOICE</text>`;

} else if (style === 6) {
  // STYLE 7: Modern Blue Accent
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="8" height="${height}" fill="${colorPrimary}"/>`;
  svg += `<text x="80" y="60" class="invoice-title" fill="${colorPrimary}" font-weight="bold" font-size="44">INVOICE</text>`;
  svg += `<text x="80" y="100" class="invoice-subtitle" fill="#666" font-size="16">Invoice Number: ${invoiceNumber || '2024-001'}</text>`;

} else if (style === 7) {
  // STYLE 8: Split Header
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  const midX = width / 2;
  svg += `<rect x="0" y="0" width="${midX}" height="120" fill="${colorPrimary}" opacity="0.9"/>`;
  svg += `<rect x="${midX}" y="0" width="${midX}" height="120" fill="${colorSecondary}" opacity="0.15"/>`;
  svg += `<text x="${midX * 0.5}" y="80" text-anchor="middle" class="invoice-title" fill="white" font-weight="bold" font-size="40">INVOICE</text>`;
  svg += `<text x="${midX * 1.5}" y="70" text-anchor="middle" class="invoice-label" fill="#333" font-size="16">Invoice Date:</text>`;
  svg += `<text x="${midX * 1.5}" y="100" text-anchor="middle" class="invoice-label" fill="${colorSecondary}" font-weight="bold" font-size="16">${new Date().toLocaleDateString()}</text>`;
}
```

---

## 7️⃣ Resume Generator

**File**: `src/lib/design-generators/resume-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Left Sidebar
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="200" height="${height}" fill="${colorPrimary}" opacity="0.9"/>`;
  svg += `<text x="100" y="80" text-anchor="middle" class="resume-name" fill="white" font-weight="bold" font-size="28">${fullName}</text>`;
  svg += `<text x="100" y="120" text-anchor="middle" class="resume-title" fill="rgba(255,255,255,0.9)" font-size="16">${title}</text>`;
  svg += `<text x="250" y="80" class="resume-name" fill="${colorPrimary}" font-weight="bold" font-size="32">${fullName}</text>`;

} else if (style === 5) {
  // STYLE 6: Top Header Banner
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<defs><linearGradient id="resumeGrad"><stop offset="0%" style="stop-color:${colorPrimary}"/><stop offset="100%" style="stop-color:${colorSecondary}"/></linearGradient></defs>`;
  svg += `<rect width="${width}" height="100" fill="url(#resumeGrad)"/>`;
  svg += `<text x="30" y="70" class="resume-name" fill="white" font-weight="bold" font-size="36">${fullName}</text>`;

} else if (style === 6) {
  // STYLE 7: Modern Two-Tone
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="${width * 0.6}" height="100" fill="${colorPrimary}" opacity="0.85"/>`;
  svg += `<rect x="${width * 0.6}" y="0" width="${width * 0.4}" height="100" fill="${colorSecondary}" opacity="0.1"/>`;
  svg += `<text x="30" y="70" class="resume-name" fill="white" font-weight="bold" font-size="34">${fullName}</text>`;

} else if (style === 7) {
  // STYLE 8: Centered Minimalist
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<circle cx="${width/2}" cy="60" r="45" fill="${colorPrimary}" opacity="0.1"/>`;
  svg += `<text x="${width/2}" y="90" text-anchor="middle" class="resume-name" fill="#222" font-weight="bold" font-size="40">${fullName}</text>`;
  svg += `<text x="${width/2}" y="130" text-anchor="middle" class="resume-title" fill="${colorSecondary}" font-size="20">${title}</text>`;
  svg += `<line x1="${width * 0.2}" y1="150" x2="${width * 0.8}" y2="150" stroke="${colorPrimary}" stroke-width="2" opacity="0.5"/>`;
}
```

---

## 8️⃣ Poster Generator

**File**: `src/lib/design-generators/poster-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Bold Typography
  svg += `<rect width="${width}" height="${height}" fill="${colorSecondary}" opacity="0.15"/>`;
  svg += `<text x="${width/2}" y="150" text-anchor="middle" class="poster-title" fill="${colorPrimary}" font-size="96" font-weight="900">${title}</text>`;
  svg += `<line x1="${width * 0.2}" x2="${width * 0.8}" y1="200" y2="200" stroke="${colorSecondary}" stroke-width="4"/>`;
  svg += `<text x="${width/2}" y="280" text-anchor="middle" class="poster-subtitle" fill="#333" font-size="48">${subtitle}</text>`;

} else if (style === 5) {
  // STYLE 6: Left Aligned Power
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect x="0" y="0" width="100%" height="20%" fill="${colorPrimary}" opacity="0.95"/>`;
  svg += `<text x="50" y="${height * 0.15}" class="poster-title" fill="white" font-size="88" font-weight="bold">${title}</text>`;
  svg += `<text x="50" y="${height * 0.4}" class="poster-subtitle" fill="${colorSecondary}" font-size="44">${subtitle}</text>`;

} else if (style === 6) {
  // STYLE 7: Diagonal Energy
  svg += `<rect width="${width}" height="${height}" fill="${colorSecondary}" opacity="0.05"/>`;
  svg += `<polygon points="0,0 ${width},0 ${width},${height * 0.6} 0,${height}" fill="${colorPrimary}" opacity="0.12"/>`;
  svg += `<text x="80" y="160" class="poster-title" fill="${colorPrimary}" font-size="92" font-weight="900">${title}</text>`;
  svg += `<text x="80" y="280" class="poster-subtitle" fill="#333" font-size="42">${subtitle}</text>`;

} else if (style === 7) {
  // STYLE 8: Centered Spotlight
  svg += `<rect width="${width}" height="${height}" fill="#1a1a1a"/>`;
  svg += `<circle cx="${width/2}" cy="${height/2}" r="${Math.max(width, height) * 0.4}" fill="${colorPrimary}" opacity="0.2"/>`;
  svg += `<circle cx="${width/2}" cy="${height/2}" r="${Math.max(width, height) * 0.25}" fill="${colorSecondary}" opacity="0.15"/>`;
  svg += `<text x="${width/2}" y="${height/2 - 80}" text-anchor="middle" class="poster-title" fill="white" font-size="96" font-weight="900">${title}</text>`;
  svg += `<text x="${width/2}" y="${height/2 + 80}" text-anchor="middle" class="poster-subtitle" fill="rgba(255,255,255,0.9)" font-size="48">${subtitle}</text>`;
}
```

---

## 9️⃣ Product Label Generator

**File**: `src/lib/design-generators/product-label-generator.ts`

**Find & Replace**:
```typescript
// OLD
return Math.floor(Math.random() * 4);

// NEW
return Math.floor(Math.random() * 8);
```

**Add this code**:

```typescript
} else if (style === 4) {
  // STYLE 5: Premium Badge
  const size = 280;
  svg += `<circle cx="150" cy="150" r="${size/2}" fill="${colorPrimary}" opacity="0.95"/>`;
  svg += `<circle cx="150" cy="150" r="${size/2 - 10}" fill="white" opacity="0.1"/>`;
  svg += `<text x="150" y="140" text-anchor="middle" class="label-title" fill="white" font-weight="bold" font-size="48">${productName}</text>`;
  svg += `<text x="150" y="170" text-anchor="middle" class="label-text" fill="rgba(255,255,255,0.95)" font-size="18">${tagline}</text>`;

} else if (style === 5) {
  // STYLE 6: Horizontal Stripe
  svg += `<rect width="300" height="300" fill="white"/>`;
  svg += `<rect x="0" y="80" width="300" height="60" fill="${colorPrimary}" opacity="0.85"/>`;
  svg += `<text x="150" y="120" text-anchor="middle" class="label-title" fill="white" font-weight="bold" font-size="32">${productName}</text>`;
  svg += `<text x="150" y="45" text-anchor="middle" class="label-text" fill="${colorSecondary}" font-size="16">${tagline}</text>`;

} else if (style === 6) {
  // STYLE 7: Corner Logo
  svg += `<rect width="300" height="300" fill="white"/>`;
  svg += `<rect x="0" y="0" width="100" height="100" fill="${colorPrimary}" opacity="0.15"/>`;
  svg += `<circle cx="50" cy="50" r="35" fill="${colorSecondary}" opacity="0.6"/>`;
  svg += `<text x="150" y="100" text-anchor="middle" class="label-title" fill="${colorPrimary}" font-weight="bold" font-size="38">${productName}</text>`;
  svg += `<text x="150" y="160" text-anchor="middle" class="label-text" fill="#333" font-size="18">${tagline}</text>`;

} else if (style === 7) {
  // STYLE 8: Geometric Modern
  svg += `<rect width="300" height="300" fill="white"/>`;
  svg += `<polygon points="0,0 150,0 300,300 0,150" fill="${colorPrimary}" opacity="0.12"/>`;
  svg += `<polygon points="300,0 300,300 150,150" fill="${colorSecondary}" opacity="0.12"/>`;
  svg += `<text x="150" y="110" text-anchor="middle" class="label-title" fill="${colorPrimary}" font-weight="bold" font-size="36">${productName}</text>`;
  svg += `<text x="150" y="170" text-anchor="middle" class="label-text" fill="#333" font-size="16">${tagline}</text>`;
}
```

---

## How to Apply These Changes

For each generator:

1. **Open the file** mentioned at the top of each section
2. **Find the `getRandomStyle()` function** and change `* 4` to `* 8`
3. **Find the last `else if (style === 3)` block**
4. **Copy the code** from the section above
5. **Paste it right after** the `style === 3` block closes
6. **Save the file**
7. **Test** by generating multiple times to see all 8 styles

## Expected Results

After applying all changes:
- ✅ Each generator has 8 unique styles
- ✅ Generating multiple times shows different designs
- ✅ `Math.random()` returns different style values (0-7)
- ✅ All SVG renders without console errors

**Total**: 10 categories × 8 styles = **80 unique designs per generation**

## Next Level: Add Layout Variations

Once all are working, each style can have 3 layout variations:
- Variation A: Standard layout
- Variation B: Alternate arrangement
- Variation C: Reversed/mirrored

This multiplies your designs by 3: **80 × 3 = 240 unique designs**

Then add 4 color schemes: **240 × 4 = 960 unique designs**

Then seed-based generation: **960 × ∞ = 10+ billion combinations!**
