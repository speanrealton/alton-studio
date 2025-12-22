// Social Media Graphics Generator (Instagram Post, LinkedIn, etc.)
export interface SocialMediaInput {
  companyName: string;
  headline: string;
  tagline: string;
  colorPrimary: string;
  colorSecondary: string;
  format: 'instagram' | 'linkedin' | 'facebook' | 'twitter';
  imageBase64?: string;
  style?: 'modern' | 'minimal' | 'bold' | 'creative' | 'random';
}

function getRandomSocialStyle(): 'modern' | 'minimal' | 'bold' | 'creative' {
  const styles = ['modern', 'minimal', 'bold', 'creative'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateSocialMediaSVG(input: SocialMediaInput): string {
  const { companyName, headline, tagline, colorPrimary, colorSecondary, format, imageBase64 } = input;
  let style = input.style || 'modern';
  
  if (style === 'random' || !style) {
    style = getRandomSocialStyle();
  }

  let width = 1080;
  let height = 1080;

  if (format === 'linkedin') {
    width = 1200;
    height = 627;
  } else if (format === 'facebook') {
    width = 1200;
    height = 628;
  } else if (format === 'twitter') {
    width = 1200;
    height = 675;
  }

  if (style === 'modern') {
    return generateModernSocialStyle(width, height, companyName, headline, tagline, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'minimal') {
    return generateMinimalSocialStyle(width, height, companyName, headline, tagline, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'bold') {
    return generateBoldSocialStyle(width, height, companyName, headline, tagline, colorPrimary, colorSecondary, imageBase64);
  } else {
    return generateCreativeSocialStyle(width, height, companyName, headline, tagline, colorPrimary, colorSecondary, imageBase64);
  }
}

function generateModernSocialStyle(width: number, height: number, companyName: string, headline: string, tagline: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .social-headline { font-family: 'Segoe UI', Arial Black, sans-serif; font-weight: bold; font-size: ${width > 1000 ? 72 : 60}px; text-anchor: middle; letter-spacing: -1px; }
      .social-tagline { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 36 : 28}px; text-anchor: middle; }
      .social-company { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 32 : 24}px; text-anchor: middle; font-weight: 600; }
    </style>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3" />
    </filter>
    <clipPath id="imageClip">
      <circle cx="${width - 120}" cy="120" r="100" />
    </clipPath>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="url(#bgGradient)"/>`;
  svg += `<circle cx="${width * 0.2}" cy="${height * 0.15}" r="150" fill="white" opacity="0.15"/>`;
  svg += `<circle cx="${width * 0.85}" cy="${height * 0.8}" r="200" fill="white" opacity="0.1"/>`;

  const centerY = height / 2;
  svg += `<text x="${width / 2}" y="${centerY - 80}" class="social-headline" fill="white" filter="url(#shadow)">${headline}</text>`;
  svg += `<text x="${width / 2}" y="${centerY - 20}" class="social-tagline" fill="white" opacity="0.9" filter="url(#shadow)">${tagline}</text>`;
  svg += `<text x="${width / 2}" y="${centerY + 80}" class="social-company" fill="white" opacity="0.8" filter="url(#shadow)">${companyName}</text>`;

  if (imageBase64) {
    svg += `<image x="${width - 220}" y="20" width="200" height="200" xlink:href="${imageBase64}" clip-path="url(#imageClip)" />`;
    svg += `<circle cx="${width - 120}" cy="120" r="100" fill="none" stroke="white" stroke-width="3" opacity="0.5" />`;
  }

  svg += `</svg>`;
  return svg;
}

function generateMinimalSocialStyle(width: number, height: number, companyName: string, headline: string, tagline: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .social-headline { font-family: 'Segoe UI', Arial Black, sans-serif; font-weight: 900; font-size: ${width > 1000 ? 80 : 68}px; text-anchor: middle; }
      .social-tagline { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 32 : 24}px; text-anchor: middle; }
      .social-company { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 28 : 20}px; text-anchor: middle; font-weight: 600; letter-spacing: 2px; }
    </style>
    <filter id="shadow2">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.2" />
    </filter>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="${width}" height="80" fill="${colorPrimary}"/>`;
  svg += `<text x="${width / 2}" y="50" class="social-company" fill="white" filter="url(#shadow2)">${companyName}</text>`;

  const centerY = height / 2;
  svg += `<text x="${width / 2}" y="${centerY - 40}" class="social-headline" fill="${colorPrimary}" filter="url(#shadow2)">${headline}</text>`;
  svg += `<text x="${width / 2}" y="${centerY + 40}" class="social-tagline" fill="${colorSecondary}" opacity="0.7">${tagline}</text>`;

  if (imageBase64) {
    svg += `<image x="40" y="${height - 160}" width="140" height="140" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
    svg += `<rect x="40" y="${height - 160}" width="140" height="140" fill="none" stroke="${colorPrimary}" stroke-width="2"/>`;
  }

  svg += `</svg>`;
  return svg;
}

function generateBoldSocialStyle(width: number, height: number, companyName: string, headline: string, tagline: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .social-headline { font-family: 'Segoe UI', Arial Black, sans-serif; font-weight: 900; font-size: ${width > 1000 ? 85 : 72}px; text-anchor: middle; letter-spacing: -2px; }
      .social-tagline { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 40 : 32}px; text-anchor: middle; font-weight: bold; }
      .social-company { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 30 : 24}px; text-anchor: middle; font-weight: 600; }
    </style>
    <linearGradient id="boldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorSecondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorPrimary};stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="url(#boldGrad)"/>`;
  svg += `<rect x="0" y="0" width="${width}" height="120" fill="white" opacity="0.1"/>`;

  const centerY = height / 2;
  svg += `<text x="${width / 2}" y="${centerY - 60}" class="social-headline" fill="white" filter="url(#glow)">${headline}</text>`;
  svg += `<text x="${width / 2}" y="${centerY + 20}" class="social-tagline" fill="white">${tagline}</text>`;
  svg += `<text x="${width / 2}" y="${centerY + 90}" class="social-company" fill="white" opacity="0.9">${companyName}</text>`;

  if (imageBase64) {
    svg += `<circle cx="${width * 0.15}" cy="120" r="80" fill="white" opacity="0.2"/>`;
    svg += `<image x="${width * 0.15 - 60}" y="60" width="120" height="120" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" clip-path="url(#circleClip)" />`;
  }

  svg += `</svg>`;
  return svg;
}

function generateCreativeSocialStyle(width: number, height: number, companyName: string, headline: string, tagline: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .social-headline { font-family: 'Segoe UI', Arial Black, sans-serif; font-weight: bold; font-size: ${width > 1000 ? 68 : 56}px; text-anchor: start; }
      .social-tagline { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 32 : 24}px; text-anchor: start; }
      .social-company { font-family: 'Segoe UI', Arial; font-size: ${width > 1000 ? 28 : 20}px; text-anchor: start; font-weight: 600; letter-spacing: 1px; }
    </style>
    <linearGradient id="creativeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="${colorPrimary}" opacity="0.05"/>`;
  
  // Side accent bar
  svg += `<rect x="0" y="0" width="20" height="${height}" fill="url(#creativeGrad)"/>`;

  // Diagonal background elements
  svg += `<polygon points="0,0 ${width * 0.4},0 ${width * 0.6},${height}" fill="${colorSecondary}" opacity="0.08"/>`;

  const contentX = 80;
  const contentY = height / 2 - 60;
  
  svg += `<text x="${contentX}" y="${contentY}" class="social-company" fill="${colorPrimary}">${companyName}</text>`;
  svg += `<text x="${contentX}" y="${contentY + 70}" class="social-headline" fill="${colorPrimary}">${headline}</text>`;
  svg += `<text x="${contentX}" y="${contentY + 130}" class="social-tagline" fill="${colorSecondary}" opacity="0.8">${tagline}</text>`;

  if (imageBase64) {
    svg += `<image x="${width - 200}" y="${height - 220}" width="200" height="200" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
    svg += `<rect x="${width - 200}" y="${height - 220}" width="200" height="200" fill="none" stroke="url(#creativeGrad)" stroke-width="4"/>`;
  }

  svg += `</svg>`;
  return svg;
}
