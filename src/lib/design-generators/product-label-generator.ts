// Product Label Generator - Professional product packaging labels
export interface ProductLabelInput {
  productName: string;
  companyName: string;
  colorPrimary: string;
  colorSecondary: string;
  imageBase64?: string;
  style?: 'elegant' | 'bold' | 'minimal' | 'playful' | 'random';
}

function getRandomProductLabelStyle(): 'elegant' | 'bold' | 'minimal' | 'playful' {
  const styles = ['elegant', 'bold', 'minimal', 'playful'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateProductLabelSVG(input: ProductLabelInput): string {
  let style = input.style || 'elegant';
  if (style === 'random' || !style) {
    style = getRandomProductLabelStyle();
  }
  const { productName, companyName, colorPrimary, colorSecondary, imageBase64 } = input;

  // Standard label size: 4x3 inches = 1200x900px at 300 DPI
  const width = 1200;
  const height = 900;

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .label-product { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 72px; text-anchor: middle; letter-spacing: -1px; }
      .label-company { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 48px; text-anchor: middle; }
      .label-text { font-family: 'Segoe UI', Arial; font-size: 32px; text-anchor: middle; }
    </style>
    <filter id="shadowLabel">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3" />
    </filter>
    <linearGradient id="labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
    <clipPath id="labelImageClip">
      <circle cx="150" cy="350" r="80" />
    </clipPath>
  </defs>`;

  // Background with border
  svg += `<rect width="${width}" height="${height}" fill="white" stroke="${colorPrimary}" stroke-width="8"/>`;

  // Top accent bar with gradient
  svg += `<rect width="${width}" height="100" fill="url(#labelGrad)"/>`;

  // Company name in top bar
  svg += `<text x="${width / 2}" y="70" class="label-company" fill="white" filter="url(#shadowLabel)">${companyName}</text>`;

  // Embed logo/image if provided
  if (imageBase64) {
    svg += `<image x="70" y="270" width="160" height="160" xlink:href="${imageBase64}" clip-path="url(#labelImageClip)" />`;
    svg += `<circle cx="150" cy="350" r="80" fill="none" stroke="${colorPrimary}" stroke-width="4" opacity="0.6" />`;
  }

  // Product name
  svg += `<text x="${width / 2}" y="350" class="label-product" fill="${colorPrimary}" filter="url(#shadowLabel)">${productName}</text>`;

  // Decorative circles
  svg += `<circle cx="100" cy="550" r="60" fill="${colorSecondary}" opacity="0.3"/>`;
  svg += `<circle cx="${width - 100}" cy="550" r="60" fill="${colorSecondary}" opacity="0.3"/>`;

  // Quality badge with gradient
  svg += `<circle cx="${width / 2}" cy="650" r="80" fill="url(#labelGrad)" opacity="0.3"/>`;
  svg += `<text x="${width / 2}" y="670" class="label-text" fill="${colorPrimary}" font-weight="bold">Premium</text>`;

  // Bottom info
  svg += `<line x1="50" y1="800" x2="${width - 50}" y2="800" stroke="${colorSecondary}" stroke-width="2"/>`;
  svg += `<text x="${width / 2}" y="860" class="label-text" fill="#666">www.company.com</text>`;

  svg += `</svg>`;
  return svg;
}
