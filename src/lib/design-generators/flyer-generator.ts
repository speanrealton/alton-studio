// Flyer Generator - Print-ready design
export interface FlyerInput {
  companyName: string;
  headline: string;
  description: string;
  colorPrimary: string;
  colorSecondary: string;
  callToAction: string;
  imageBase64?: string;
  style?: 'modern' | 'minimal' | 'bold' | 'classic' | 'random';
}

function getRandomFlyerStyle(): 'modern' | 'minimal' | 'bold' | 'classic' {
  const styles = ['modern', 'minimal', 'bold', 'classic'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateFlyerSVG(input: FlyerInput): string {
  const { companyName, headline, description, colorPrimary, colorSecondary, callToAction, imageBase64 } = input;
  let style = input.style || 'modern';
  
  if (style === 'random' || !style) {
    style = getRandomFlyerStyle();
  }

  // A4 size: 210mm x 297mm = 2480 x 3508px at 300 DPI
  const width = 2480;
  const height = 3508;

  if (style === 'modern') {
    return generateModernFlyerStyle(width, height, companyName, headline, description, colorPrimary, colorSecondary, callToAction, imageBase64);
  } else if (style === 'minimal') {
    return generateMinimalFlyerStyle(width, height, companyName, headline, description, colorPrimary, colorSecondary, callToAction, imageBase64);
  } else if (style === 'bold') {
    return generateBoldFlyerStyle(width, height, companyName, headline, description, colorPrimary, colorSecondary, callToAction, imageBase64);
  } else {
    return generateClassicFlyerStyle(width, height, companyName, headline, description, colorPrimary, colorSecondary, callToAction, imageBase64);
  }
}

function generateModernFlyerStyle(width: number, height: number, companyName: string, headline: string, description: string, colorPrimary: string, colorSecondary: string, callToAction: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .flyer-title { font-family: 'Segoe UI', 'Arial Black', Arial; font-weight: bold; font-size: 120px; letter-spacing: -2px; }
      .flyer-headline { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 80px; letter-spacing: -1px; }
      .flyer-desc { font-family: 'Segoe UI', Arial; font-size: 48px; line-height: 1.4; }
      .flyer-cta { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 72px; text-anchor: middle; letter-spacing: -1px; }
    </style>
    <filter id="shadow">
      <feDropShadow dx="3" dy="3" stdDeviation="4" flood-opacity="0.4" />
    </filter>
    <linearGradient id="flyerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="${width}" height="400" fill="url(#flyerGrad)"/>`;
  svg += `<text x="${width / 2}" y="250" class="flyer-title" fill="white" text-anchor="middle" filter="url(#shadow)">${companyName}</text>`;

  svg += `<text x="150" y="700" class="flyer-headline" fill="${colorPrimary}" filter="url(#shadow)">${headline}</text>`;

  const descLines = description.match(/.{1,60}/g) || [];
  const descY = 1000;
  descLines.slice(0, 4).forEach((line: string, idx: number) => {
    svg += `<text x="150" y="${descY + idx * 80}" class="flyer-desc" fill="#333">${line}</text>`;
  });

  if (imageBase64) {
    svg += `<image x="1800" y="1200" width="600" height="600" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
    svg += `<rect x="1800" y="1200" width="600" height="600" fill="none" stroke="${colorPrimary}" stroke-width="8" />`;
  }

  svg += `<rect y="${height - 600}" width="${width}" height="600" fill="${colorSecondary}"/>`;
  svg += `<text x="${width / 2}" y="${height - 200}" class="flyer-cta" fill="white" filter="url(#shadow)">${callToAction}</text>`;

  svg += `<circle cx="${width * 0.1}" cy="${height * 0.3}" r="200" fill="${colorSecondary}" opacity="0.1"/>`;
  svg += `<circle cx="${width * 0.9}" cy="${height * 0.7}" r="250" fill="${colorPrimary}" opacity="0.05"/>`;

  svg += `</svg>`;
  return svg;
}

function generateMinimalFlyerStyle(width: number, height: number, companyName: string, headline: string, description: string, colorPrimary: string, colorSecondary: string, callToAction: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .flyer-title { font-family: 'Segoe UI', 'Arial Black', Arial; font-weight: 900; font-size: 140px; letter-spacing: -3px; }
      .flyer-headline { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 90px; }
      .flyer-desc { font-family: 'Segoe UI', Arial; font-size: 50px; line-height: 1.6; }
      .flyer-cta { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 80px; text-anchor: middle; }
    </style>
    <filter id="minimalShadow">
      <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.2" />
    </filter>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="300" height="${height}" fill="${colorPrimary}"/>`;

  svg += `<text x="350" y="400" class="flyer-title" fill="${colorPrimary}" filter="url(#minimalShadow)">${headline}</text>`;
  svg += `<text x="350" y="650" class="flyer-headline" fill="${colorSecondary}">${companyName}</text>`;

  const descLines = description.match(/.{1,50}/g) || [];
  const descStartY = 1000;
  descLines.slice(0, 3).forEach((line: string, idx: number) => {
    svg += `<text x="350" y="${descStartY + idx * 90}" class="flyer-desc" fill="#555">${line}</text>`;
  });

  if (imageBase64) {
    svg += `<image x="350" y="${height - 1200}" width="500" height="1100" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<text x="${width / 2}" y="${height - 300}" class="flyer-cta" fill="white" filter="url(#minimalShadow)">${callToAction}</text>`;
  svg += `<rect y="${height - 500}" width="${width}" height="500" fill="${colorPrimary}"/>`;

  svg += `</svg>`;
  return svg;
}

function generateBoldFlyerStyle(width: number, height: number, companyName: string, headline: string, description: string, colorPrimary: string, colorSecondary: string, callToAction: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .flyer-title { font-family: 'Segoe UI', 'Arial Black', Arial; font-weight: 900; font-size: 160px; letter-spacing: -4px; text-transform: uppercase; }
      .flyer-headline { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 100px; }
      .flyer-desc { font-family: 'Segoe UI', Arial; font-size: 52px; line-height: 1.5; }
      .flyer-cta { font-family: 'Segoe UI', 'Arial Black'; font-weight: 900; font-size: 90px; text-anchor: middle; letter-spacing: -2px; }
    </style>
    <linearGradient id="boldFlyerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
    <filter id="boldShadow">
      <feDropShadow dx="4" dy="4" stdDeviation="5" flood-opacity="0.5" />
    </filter>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="url(#boldFlyerGrad)"/>`;
  svg += `<rect width="${width}" height="600" fill="white" opacity="0.05"/>`;

  svg += `<text x="150" y="500" class="flyer-headline" fill="white" filter="url(#boldShadow)">${companyName}</text>`;
  svg += `<text x="150" y="1000" class="flyer-title" fill="white" filter="url(#boldShadow)">${headline}</text>`;

  const descLines = description.match(/.{1,55}/g) || [];
  const descStartY = 1500;
  descLines.slice(0, 3).forEach((line: string, idx: number) => {
    svg += `<text x="150" y="${descStartY + idx * 100}" class="flyer-desc" fill="white" opacity="0.95">${line}</text>`;
  });

  if (imageBase64) {
    svg += `<image x="${width - 800}" y="500" width="700" height="700" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<rect y="${height - 600}" width="${width}" height="600" fill="white"/>`;
  svg += `<text x="${width / 2}" y="${height - 180}" class="flyer-cta" fill="${colorPrimary}" filter="url(#boldShadow)">${callToAction}</text>`;

  svg += `</svg>`;
  return svg;
}

function generateClassicFlyerStyle(width: number, height: number, companyName: string, headline: string, description: string, colorPrimary: string, colorSecondary: string, callToAction: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .flyer-title { font-family: 'Georgia', 'Times New Roman', serif; font-weight: bold; font-size: 110px; letter-spacing: -1px; }
      .flyer-headline { font-family: 'Georgia', serif; font-weight: bold; font-size: 85px; }
      .flyer-desc { font-family: 'Segoe UI', Arial; font-size: 48px; line-height: 1.5; }
      .flyer-cta { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 70px; text-anchor: middle; letter-spacing: 1px; }
    </style>
    <filter id="classicShadow">
      <feDropShadow dx="3" dy="3" stdDeviation="3" flood-opacity="0.3" />
    </filter>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Top and bottom decorative borders
  svg += `<rect width="${width}" height="80" fill="${colorPrimary}"/>`;
  svg += `<rect y="${height - 80}" width="${width}" height="80" fill="${colorPrimary}"/>`;

  // Center dividing line
  svg += `<rect x="400" y="400" width="${width - 800}" height="4" fill="${colorSecondary}"/>`;

  svg += `<text x="200" y="350" class="flyer-title" fill="${colorPrimary}" filter="url(#classicShadow)">${companyName}</text>`;
  svg += `<text x="200" y="850" class="flyer-headline" fill="${colorSecondary}">${headline}</text>`;

  const descLines = description.match(/.{1,60}/g) || [];
  const descStartY = 1300;
  descLines.slice(0, 4).forEach((line: string, idx: number) => {
    svg += `<text x="200" y="${descStartY + idx * 90}" class="flyer-desc" fill="#444">${line}</text>`;
  });

  if (imageBase64) {
    svg += `<image x="${width - 1000}" y="900" width="900" height="900" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
    svg += `<rect x="${width - 1000}" y="900" width="900" height="900" fill="none" stroke="${colorPrimary}" stroke-width="6"/>`;
  }

  svg += `<rect y="${height - 1000}" width="${width}" height="920" fill="${colorSecondary}" opacity="0.05"/>`;
  svg += `<text x="${width / 2}" y="${height - 350}" class="flyer-cta" fill="${colorPrimary}" filter="url(#classicShadow)">${callToAction}</text>`;

  svg += `</svg>`;
  return svg;
}
