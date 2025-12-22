// Poster Generator - Eye-catching promotional poster
export interface PosterInput {
  companyName: string;
  headline: string;
  industry: string;
  colorPrimary: string;
  colorSecondary: string;
  imageBase64?: string;
  style?: 'modern' | 'bold' | 'minimal' | 'artistic' | 'random';
}

function getRandomPosterStyle(): 'modern' | 'bold' | 'minimal' | 'artistic' {
  const styles = ['modern', 'bold', 'minimal', 'artistic'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generatePosterSVG(input: PosterInput): string {
  let style = input.style || 'modern';
  if (style === 'random' || !style) {
    style = getRandomPosterStyle();
  }
  const { companyName, headline, colorPrimary, colorSecondary, imageBase64 } = input;

  // US Poster size: 18x24 inches = 1728x2304px at 96 DPI
  const width = 1728;
  const height = 2304;

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .poster-headline { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 144px; text-anchor: middle; letter-spacing: -2px; }
      .poster-company { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 96px; text-anchor: middle; letter-spacing: -1px; }
      .poster-tagline { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 64px; text-anchor: middle; }
      .poster-cta { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 72px; text-anchor: middle; }
    </style>
    <filter id="shadowPoster">
      <feDropShadow dx="3" dy="3" stdDeviation="5" flood-opacity="0.4" />
    </filter>
    <linearGradient id="posterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
    <clipPath id="posterImageClip">
      <rect x="250" y="600" width="1228" height="600" rx="20" />
    </clipPath>
  </defs>`;

  // Gradient background
  svg += `<rect width="${width}" height="${height}" fill="url(#posterGrad)"/>`;

  // Decorative circles
  svg += `<circle cx="${width * 0.15}" cy="${height * 0.2}" r="200" fill="white" opacity="0.15"/>`;
  svg += `<circle cx="${width * 0.85}" cy="${height * 0.85}" r="300" fill="white" opacity="0.1"/>`;

  // Main headline
  svg += `<text x="${width / 2}" y="${height * 0.35}" class="poster-headline" fill="white" filter="url(#shadowPoster)">${headline}</text>`;

  // Embed image if provided
  if (imageBase64) {
    svg += `<image x="250" y="600" width="1228" height="600" xlink:href="${imageBase64}" clip-path="url(#posterImageClip)" />`;
    svg += `<rect x="250" y="600" width="1228" height="600" rx="20" fill="none" stroke="white" stroke-width="8" opacity="0.6" />`;
  }

  // Company name
  svg += `<text x="${width / 2}" y="${height * 0.8}" class="poster-company" fill="white" opacity="0.95" filter="url(#shadowPoster)">${companyName}</text>`;

  // Divider
  svg += `<line x1="${width * 0.2}" y1="${height * 0.88}" x2="${width * 0.8}" y2="${height * 0.88}" stroke="white" stroke-width="8" opacity="0.6"/>`;

  // Call to action
  svg += `<text x="${width / 2}" y="${height * 1.0}" class="poster-tagline" fill="white" filter="url(#shadowPoster)">Learn More Today</text>`;

  // Footer stripe
  svg += `<rect y="${height - 150}" width="${width}" height="150" fill="white" opacity="0.95"/>`;
  svg += `<text x="${width / 2}" y="${height - 40}" class="poster-tagline" fill="${colorPrimary}">Visit Us Now</text>`;

  svg += `</svg>`;
  return svg;
}
