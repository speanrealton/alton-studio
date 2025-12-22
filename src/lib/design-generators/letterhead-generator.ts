// Letterhead Generator
export interface LetterheadInput {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  colorPrimary: string;
  colorSecondary: string;
  imageBase64?: string;
  style?: 'classic' | 'modern' | 'minimal' | 'professional' | 'random';
}

function getRandomLetterheadStyle(): 'classic' | 'modern' | 'minimal' | 'professional' {
  const styles = ['classic', 'modern', 'minimal', 'professional'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateLetterheadSVG(input: LetterheadInput): string {
  const { companyName, tagline, address, phone, email, website, colorPrimary, colorSecondary, imageBase64 } = input;
  let style = input.style || 'classic';
  
  if (style === 'random' || !style) {
    style = getRandomLetterheadStyle();
  }

  // A4 size: 210mm x 297mm = 2480 x 3508px at 300 DPI
  const width = 2480;
  const height = 3508;

  if (style === 'classic') {
    return generateClassicLetterheadStyle(width, height, companyName, tagline, address, phone, email, website, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'modern') {
    return generateModernLetterheadStyle(width, height, companyName, tagline, address, phone, email, website, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'minimal') {
    return generateMinimalLetterheadStyle(width, height, companyName, tagline, address, phone, email, website, colorPrimary, colorSecondary, imageBase64);
  } else {
    return generateProfessionalLetterheadStyle(width, height, companyName, tagline, address, phone, email, website, colorPrimary, colorSecondary, imageBase64);
  }
}

function generateClassicLetterheadStyle(width: number, height: number, companyName: string, tagline: string, address: string, phone: string, email: string, website: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .letterhead-company { font-family: 'Segoe UI', 'Arial Black', Arial; font-weight: bold; font-size: 96px; letter-spacing: -2px; }
      .letterhead-tagline { font-family: 'Segoe UI', Arial; font-size: 40px; font-style: italic; }
      .letterhead-contact { font-family: 'Segoe UI', Arial; font-size: 32px; }
    </style>
    <filter id="shadowLetterhead">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.2" />
    </filter>
    <linearGradient id="letterheadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:0.05" />
    </linearGradient>
    <clipPath id="logoPic">
      <circle cx="400" cy="300" r="150" />
    </clipPath>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="60" height="${height}" fill="url(#letterheadGrad)"/>`;

  const logoX = 400;
  const logoY = 300;

  if (imageBase64) {
    svg += `<image x="250" y="150" width="300" height="300" xlink:href="${imageBase64}" clip-path="url(#logoPic)" />`;
    svg += `<circle cx="${logoX}" cy="${logoY}" r="150" fill="none" stroke="${colorPrimary}" stroke-width="6" opacity="0.6" />`;
  } else {
    svg += `<circle cx="${logoX}" cy="${logoY}" r="150" fill="${colorPrimary}" opacity="0.1"/>`;
    svg += `<circle cx="${logoX}" cy="${logoY}" r="100" fill="${colorSecondary}" opacity="0.2"/>`;
  }

  svg += `<text x="${logoX + 400}" y="${logoY - 40}" class="letterhead-company" fill="${colorPrimary}" filter="url(#shadowLetterhead)">${companyName}</text>`;
  svg += `<text x="${logoX + 400}" y="${logoY + 60}" class="letterhead-tagline" fill="${colorSecondary}">${tagline}</text>`;
  svg += `<line x1="200" y1="700" x2="${width - 200}" y2="700" stroke="${colorSecondary}" stroke-width="4"/>`;

  const contactStartY = 900;
  const contactSpacing = 120;
  svg += `<text x="400" y="${contactStartY}" class="letterhead-contact" fill="#333">📍 ${address}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing}" class="letterhead-contact" fill="#333">📞 ${phone}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 2}" class="letterhead-contact" fill="#333">✉️  ${email}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 3}" class="letterhead-contact" fill="#333">🌐 ${website}</text>`;

  svg += `<rect y="${height - 200}" width="${width}" height="200" fill="url(#letterheadGrad)" opacity="0.7"/>`;
  svg += `</svg>`;
  return svg;
}

function generateModernLetterheadStyle(width: number, height: number, companyName: string, tagline: string, address: string, phone: string, email: string, website: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .letterhead-company { font-family: 'Segoe UI', 'Arial Black', Arial; font-weight: 900; font-size: 110px; letter-spacing: -3px; }
      .letterhead-tagline { font-family: 'Segoe UI', Arial; font-size: 36px; }
      .letterhead-contact { font-family: 'Segoe UI', Arial; font-size: 30px; }
    </style>
    <linearGradient id="modernLetterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="${width}" height="500" fill="url(#modernLetterGrad)"/>`;

  if (imageBase64) {
    svg += `<image x="400" y="100" width="280" height="280" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<text x="850" y="320" class="letterhead-company" fill="white">${companyName}</text>`;
  svg += `<text x="850" y="400" class="letterhead-tagline" fill="white" opacity="0.9">${tagline}</text>`;

  const contactStartY = 900;
  const contactSpacing = 110;
  svg += `<text x="400" y="${contactStartY}" class="letterhead-contact" fill="${colorPrimary}">${address}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing}" class="letterhead-contact" fill="${colorSecondary}">${phone}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 2}" class="letterhead-contact" fill="${colorPrimary}">${email}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 3}" class="letterhead-contact" fill="${colorSecondary}">${website}</text>`;

  svg += `<line x1="400" y1="${height - 400}" x2="${width - 400}" y2="${height - 400}" stroke="${colorPrimary}" stroke-width="3" opacity="0.3"/>`;
  svg += `</svg>`;
  return svg;
}

function generateMinimalLetterheadStyle(width: number, height: number, companyName: string, tagline: string, address: string, phone: string, email: string, website: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .letterhead-company { font-family: 'Segoe UI', 'Arial Black', Arial; font-weight: 900; font-size: 120px; letter-spacing: -4px; }
      .letterhead-tagline { font-family: 'Segoe UI', Arial; font-size: 34px; }
      .letterhead-contact { font-family: 'Segoe UI', Arial; font-size: 28px; }
    </style>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="80" height="${height}" fill="${colorPrimary}"/>`;

  if (imageBase64) {
    svg += `<image x="400" y="150" width="200" height="200" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<text x="750" y="350" class="letterhead-company" fill="${colorPrimary}">${companyName}</text>`;
  svg += `<text x="750" y="430" class="letterhead-tagline" fill="${colorSecondary}">${tagline}</text>`;

  const contactStartY = 800;
  const contactSpacing = 100;
  svg += `<text x="400" y="${contactStartY}" class="letterhead-contact" fill="#555">${address}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing}" class="letterhead-contact" fill="#555">${phone}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 2}" class="letterhead-contact" fill="#555">${email}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 3}" class="letterhead-contact" fill="#555">${website}</text>`;

  svg += `</svg>`;
  return svg;
}

function generateProfessionalLetterheadStyle(width: number, height: number, companyName: string, tagline: string, address: string, phone: string, email: string, website: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .letterhead-company { font-family: 'Georgia', 'Times New Roman', serif; font-weight: bold; font-size: 100px; letter-spacing: 1px; }
      .letterhead-tagline { font-family: 'Georgia', serif; font-size: 38px; }
      .letterhead-contact { font-family: 'Segoe UI', Arial; font-size: 32px; }
    </style>
    <filter id="profShadow">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.15" />
    </filter>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Top and bottom elegant borders
  svg += `<rect width="${width}" height="60" fill="${colorPrimary}"/>`;
  svg += `<rect y="${height - 60}" width="${width}" height="60" fill="${colorPrimary}"/>`;

  const logoX = 600;
  const logoY = 350;

  if (imageBase64) {
    svg += `<image x="${logoX - 100}" y="${logoY - 100}" width="200" height="200" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
    svg += `<rect x="${logoX - 100}" y="${logoY - 100}" width="200" height="200" fill="none" stroke="${colorSecondary}" stroke-width="4"/>`;
  } else {
    svg += `<rect x="${logoX - 80}" y="${logoY - 80}" width="160" height="160" fill="${colorPrimary}" opacity="0.08"/>`;
  }

  svg += `<text x="1000" y="320" class="letterhead-company" fill="${colorPrimary}" filter="url(#profShadow)">${companyName}</text>`;
  svg += `<text x="1000" y="420" class="letterhead-tagline" fill="${colorSecondary}">${tagline}</text>`;

  svg += `<line x1="300" y1="650" x2="${width - 300}" y2="650" stroke="${colorSecondary}" stroke-width="3"/>`;

  const contactStartY = 1000;
  const contactSpacing = 130;
  svg += `<text x="400" y="${contactStartY}" class="letterhead-contact" fill="#333">${address}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing}" class="letterhead-contact" fill="#333">${phone}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 2}" class="letterhead-contact" fill="#333">${email}</text>`;
  svg += `<text x="400" y="${contactStartY + contactSpacing * 3}" class="letterhead-contact" fill="#333">${website}</text>`;

  svg += `</svg>`;
  return svg;
}
