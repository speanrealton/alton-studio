// Resume/CV Generator
export interface ResumeInput {
  companyName: string;
  industry: string;
  colorPrimary: string;
  colorSecondary: string;
  imageBase64?: string;
  style?: 'classic' | 'modern' | 'minimal' | 'creative' | 'random';
}

function getRandomResumeStyle(): 'classic' | 'modern' | 'minimal' | 'creative' {
  const styles = ['classic', 'modern', 'minimal', 'creative'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateResumeSVG(input: ResumeInput): string {
  let style = input.style || 'classic';
  if (style === 'random' || !style) {
    style = getRandomResumeStyle();
  }
  const { companyName, industry, colorPrimary, colorSecondary, imageBase64 } = input;

  // A4 size
  const width = 2100;
  const height = 2970;

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .resume-name { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 64px; letter-spacing: -1px; }
      .resume-title { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 48px; }
      .resume-section { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 40px; }
      .resume-text { font-family: 'Segoe UI', Arial; font-size: 32px; }
      .resume-subtitle { font-family: 'Segoe UI', Arial; font-size: 28px; font-style: italic; }
    </style>
    <filter id="shadowRes">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.2" />
    </filter>
    <linearGradient id="resumeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:0.05" />
    </linearGradient>
    <clipPath id="resumeImageClip">
      <circle cx="250" cy="250" r="150" />
    </clipPath>
  </defs>`;

  // White background
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;

  // Left sidebar with gradient
  svg += `<rect width="500" height="${height}" fill="url(#resumeGrad)"/>`;

  // Profile picture if provided
  if (imageBase64) {
    svg += `<image x="100" y="100" width="300" height="300" xlink:href="${imageBase64}" clip-path="url(#resumeImageClip)" />`;
  }

  // Name
  svg += `<text x="150" y="500" class="resume-name" fill="${colorPrimary}" filter="url(#shadowRes)">${companyName}</text>`;

  // Professional title
  svg += `<text x="150" y="650" class="resume-subtitle" fill="${colorSecondary}">${industry} Professional</text>`;

  // Contact info
  svg += `<text x="600" y="200" class="resume-text" fill="#333">contact@company.com</text>`;
  svg += `<text x="600" y="300" class="resume-text" fill="#333">(555) 123-4567</text>`;
  svg += `<text x="600" y="400" class="resume-text" fill="#333">linkedin.com/in/profile</text>`;

  // Professional Summary section
  svg += `<line x1="600" y1="550" x2="1900" y2="550" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="600" y="700" class="resume-section" fill="${colorPrimary}">PROFESSIONAL SUMMARY</text>`;
  svg += `<text x="600" y="850" class="resume-text" fill="#333">Results-driven professional with expertise in ${industry}.</text>`;
  svg += `<text x="600" y="950" class="resume-text" fill="#333">Proven track record of delivering high-quality solutions.</text>`;

  // Experience section
  svg += `<line x1="600" y1="1150" x2="1900" y2="1150" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="600" y="1300" class="resume-section" fill="${colorPrimary}">EXPERIENCE</text>`;

  svg += `<text x="600" y="1500" class="resume-title" fill="#333">Senior Professional</text>`;
  svg += `<text x="600" y="1600" class="resume-text" fill="${colorSecondary}">${companyName} | 2023 - Present</text>`;
  svg += `<text x="600" y="1750" class="resume-text" fill="#666">• Led successful projects and initiatives</text>`;
  svg += `<text x="600" y="1850" class="resume-text" fill="#666">• Managed cross-functional teams effectively</text>`;

  // Skills section
  svg += `<line x1="600" y1="2050" x2="1900" y2="2050" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="600" y="2200" class="resume-section" fill="${colorPrimary}">SKILLS</text>`;
  svg += `<text x="600" y="2350" class="resume-text" fill="#333">Project Management • Team Leadership • Strategic Planning</text>`;
  svg += `<text x="600" y="2450" class="resume-text" fill="#333">Problem Solving • Communication • Data Analysis</text>`;

  svg += `</svg>`;
  return svg;
}
