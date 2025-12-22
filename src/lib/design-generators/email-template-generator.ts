// Email Template Generator
export interface EmailTemplateInput {
  companyName: string;
  subject: string;
  colorPrimary: string;
  colorSecondary: string;
  imageBase64?: string;
  style?: 'modern' | 'minimal' | 'bold' | 'clean' | 'random';
}

function getRandomEmailStyle(): 'modern' | 'minimal' | 'bold' | 'clean' {
  const styles = ['modern', 'minimal', 'bold', 'clean'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateEmailTemplateSVG(input: EmailTemplateInput): string {
  const { companyName, subject, colorPrimary, colorSecondary, imageBase64 } = input;
  let style = input.style || 'modern';
  
  if (style === 'random' || !style) {
    style = getRandomEmailStyle();
  }

  const width = 600;
  const height = 800;

  if (style === 'modern') {
    return generateModernEmailStyle(width, height, companyName, subject, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'minimal') {
    return generateMinimalEmailStyle(width, height, companyName, subject, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'bold') {
    return generateBoldEmailStyle(width, height, companyName, subject, colorPrimary, colorSecondary, imageBase64);
  } else {
    return generateCleanEmailStyle(width, height, companyName, subject, colorPrimary, colorSecondary, imageBase64);
  }
}

function generateModernEmailStyle(width: number, height: number, companyName: string, subject: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .email-header { font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold; font-size: 28px; letter-spacing: -0.5px; }
      .email-subject { font-family: 'Segoe UI', Arial; font-size: 20px; font-weight: bold; }
      .email-body { font-family: 'Segoe UI', Arial; font-size: 16px; line-height: 1.6; }
      .email-footer { font-family: 'Segoe UI', Arial; font-size: 12px; }
    </style>
    <filter id="shadowEmail">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.2" />
    </filter>
    <linearGradient id="emailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="${width}" height="120" fill="url(#emailGrad)"/>`;
  svg += `<text x="30" y="70" class="email-header" fill="white" filter="url(#shadowEmail)">${companyName}</text>`;

  if (imageBase64) {
    svg += `<image x="100" y="130" width="400" height="180" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<rect y="320" width="${width}" height="50" fill="${colorSecondary}" opacity="0.1"/>`;
  svg += `<text x="30" y="355" class="email-subject" fill="${colorPrimary}">Subject: ${subject}</text>`;
  svg += `<text x="30" y="430" class="email-body" fill="#333">Hello,</text>`;
  svg += `<text x="30" y="480" class="email-body" fill="#333">Thank you for your interest in ${companyName}.</text>`;
  svg += `<text x="30" y="530" class="email-body" fill="#333">We provide exceptional service and support.</text>`;

  svg += `<rect x="150" y="580" width="300" height="50" rx="5" fill="url(#emailGrad)" filter="url(#shadowEmail)"/>`;
  svg += `<text x="300" y="615" class="email-body" fill="white" text-anchor="middle" font-weight="bold">Learn More</text>`;

  svg += `<rect y="${height - 100}" width="${width}" height="100" fill="#f5f5f5"/>`;
  svg += `<text x="30" y="${height - 60}" class="email-footer" fill="#666">© 2025 ${companyName}. All rights reserved.</text>`;
  svg += `<text x="30" y="${height - 35}" class="email-footer" fill="#999">You can update your preferences or unsubscribe.</text>`;

  svg += `</svg>`;
  return svg;
}

function generateMinimalEmailStyle(width: number, height: number, companyName: string, subject: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .email-header { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 900; font-size: 32px; letter-spacing: -1px; }
      .email-subject { font-family: 'Segoe UI', Arial; font-size: 22px; font-weight: bold; }
      .email-body { font-family: 'Segoe UI', Arial; font-size: 16px; line-height: 1.8; }
      .email-footer { font-family: 'Segoe UI', Arial; font-size: 12px; }
    </style>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="10" height="${height}" fill="${colorPrimary}"/>`;

  svg += `<text x="30" y="50" class="email-header" fill="${colorPrimary}">${companyName}</text>`;

  if (imageBase64) {
    svg += `<image x="50" y="70" width="500" height="150" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<text x="30" y="280" class="email-subject" fill="${colorSecondary}">${subject}</text>`;
  svg += `<text x="30" y="340" class="email-body" fill="#555">Hello,</text>`;
  svg += `<text x="30" y="385" class="email-body" fill="#555">Thank you for choosing ${companyName}.</text>`;
  svg += `<text x="30" y="430" class="email-body" fill="#555">We're committed to your success.</text>`;

  svg += `<rect x="30" y="500" width="540" height="50" rx="8" fill="${colorPrimary}"/>`;
  svg += `<text x="300" y="535" class="email-subject" fill="white" text-anchor="middle">Explore Now</text>`;

  svg += `<rect y="${height - 80}" width="${width}" height="80" fill="white" stroke="${colorPrimary}" stroke-width="1"/>`;
  svg += `<text x="30" y="${height - 50}" class="email-footer" fill="#666">© 2025 ${companyName}</text>`;
  svg += `<text x="30" y="${height - 25}" class="email-footer" fill="#999">Unsubscribe | Preferences</text>`;

  svg += `</svg>`;
  return svg;
}

function generateBoldEmailStyle(width: number, height: number, companyName: string, subject: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .email-header { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 900; font-size: 36px; letter-spacing: -2px; }
      .email-subject { font-family: 'Segoe UI', Arial; font-size: 24px; font-weight: bold; }
      .email-body { font-family: 'Segoe UI', Arial; font-size: 17px; line-height: 1.7; }
      .email-footer { font-family: 'Segoe UI', Arial; font-size: 12px; }
    </style>
    <linearGradient id="boldEmailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="url(#boldEmailGrad)"/>`;
  svg += `<rect width="${width}" height="150" fill="white" opacity="0.1"/>`;

  svg += `<text x="30" y="60" class="email-header" fill="white">${companyName}</text>`;

  if (imageBase64) {
    svg += `<image x="30" y="80" width="540" height="150" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<text x="30" y="70" class="email-header" fill="${colorPrimary}">${companyName}</text>`;

  svg += `<text x="30" y="200" class="email-subject" fill="${colorSecondary}">${subject}</text>`;
  svg += `<text x="30" y="260" class="email-body" fill="#333">Hello,</text>`;
  svg += `<text x="30" y="310" class="email-body" fill="#333">We're excited to share with you.</text>`;
  svg += `<text x="30" y="360" class="email-body" fill="#333">Premium solutions await you.</text>`;

  svg += `<rect x="30" y="430" width="540" height="60" rx="8" fill="url(#boldEmailGrad)"/>`;
  svg += `<text x="300" y="470" class="email-subject" fill="white" text-anchor="middle">Get Started Now</text>`;

  svg += `<rect y="${height - 70}" width="${width}" height="70" fill="#f0f0f0"/>`;
  svg += `<text x="30" y="${height - 35}" class="email-footer" fill="#666">© 2025 ${companyName}. All rights reserved.</text>`;

  svg += `</svg>`;
  return svg;
}

function generateCleanEmailStyle(width: number, height: number, companyName: string, subject: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .email-header { font-family: 'Georgia', 'Times New Roman', serif; font-weight: bold; font-size: 26px; }
      .email-subject { font-family: 'Segoe UI', Arial; font-size: 18px; font-weight: bold; }
      .email-body { font-family: 'Segoe UI', Arial; font-size: 15px; line-height: 1.7; }
      .email-footer { font-family: 'Segoe UI', Arial; font-size: 11px; }
    </style>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Elegant header with subtle background
  svg += `<rect width="${width}" height="100" fill="${colorPrimary}" opacity="0.08"/>`;
  svg += `<line x1="0" y1="100" x2="${width}" y2="100" stroke="${colorPrimary}" stroke-width="2"/>`;

  svg += `<text x="30" y="60" class="email-header" fill="${colorPrimary}">${companyName}</text>`;

  if (imageBase64) {
    svg += `<image x="50" y="120" width="500" height="140" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<text x="30" y="310" class="email-subject" fill="${colorPrimary}">${subject}</text>`;
  svg += `<text x="30" y="365" class="email-body" fill="#444">Dear Valued Recipient,</text>`;
  svg += `<text x="30" y="410" class="email-body" fill="#444">We hope this message finds you well.</text>`;
  svg += `<text x="30" y="455" class="email-body" fill="#444">${companyName} is here to serve you.</text>`;

  svg += `<rect x="30" y="520" width="540" height="50" rx="3" fill="${colorSecondary}" opacity="0.2"/>`;
  svg += `<text x="300" y="555" class="email-subject" fill="${colorSecondary}" text-anchor="middle">Visit Our Site</text>`;

  svg += `<rect y="${height - 60}" width="${width}" height="60" fill="#fafafa"/>`;
  svg += `<line x1="0" y1="${height - 60}" x2="${width}" y2="${height - 60}" stroke="${colorPrimary}" stroke-width="1" opacity="0.3"/>`;
  svg += `<text x="30" y="${height - 30}" class="email-footer" fill="#777">© 2025 ${companyName}. All rights reserved. | Unsubscribe</text>`;

  svg += `</svg>`;
  return svg;
}
