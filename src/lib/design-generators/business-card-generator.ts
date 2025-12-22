// Professional Business Card Generator - 14,400+ Unique Designs
// 20 base designs × 4 color treatments × 3 typography weights × 2 positions × 30 fonts = 14,400+ combinations

export interface BusinessCardInput {
  companyName: string;
  tagline: string;
  industry: string;
  colorPrimary: string;
  colorSecondary: string;
  email?: string;
  phone?: string;
  imageBase64?: string;
  ownerName?: string;
  ownerTitle?: string;
  address?: string;
  website?: string;
}

interface DesignVariation {
  baseStyle: number;
  colorTreatment: number;
  typographyWeight: number;
  elementPosition: number;
  fontFamily: number;
}

// Generate a unique design variation
function getDesignVariation(seed?: number): DesignVariation {
  const s = seed || Math.random();
  return {
    baseStyle: Math.floor(s * 20), // 20 base designs
    colorTreatment: Math.floor((s * 1000) % 4), // 4 color treatments
    typographyWeight: Math.floor((s * 10000) % 3), // 3 typography weights
    elementPosition: Math.floor((s * 100000) % 2), // 2 positioning variants
    fontFamily: Math.floor((s * 1000000) % 30), // 30 font combinations
  };
}

// 30 Professional Font Combinations (Modern & Classic)
function getFontFamily(index: number): {title: string, body: string} {
  const fonts = [
    { title: "'Poppins', sans-serif", body: "'Poppins', sans-serif" },
    { title: "'Montserrat', sans-serif", body: "'Montserrat', sans-serif" },
    { title: "'Roboto', sans-serif", body: "'Roboto', sans-serif" },
    { title: "'Open Sans', sans-serif", body: "'Open Sans', sans-serif" },
    { title: "'Lato', sans-serif", body: "'Lato', sans-serif" },
    { title: "'Raleway', sans-serif", body: "'Raleway', sans-serif" },
    { title: "'Oswald', sans-serif", body: "'Open Sans', sans-serif" },
    { title: "'Playfair Display', serif", body: "'Lato', sans-serif" },
    { title: "'Merriweather', serif", body: "'Open Sans', sans-serif" },
    { title: "'Ubuntu', sans-serif", body: "'Ubuntu', sans-serif" },
    { title: "'Nunito', sans-serif", body: "'Nunito', sans-serif" },
    { title: "'Work Sans', sans-serif", body: "'Work Sans', sans-serif" },
    { title: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    { title: "'Quicksand', sans-serif", body: "'Quicksand', sans-serif" },
    { title: "'Source Sans Pro', sans-serif", body: "'Source Sans Pro', sans-serif" },
    { title: "'PT Sans', sans-serif", body: "'PT Sans', sans-serif" },
    { title: "'Barlow', sans-serif", body: "'Barlow', sans-serif" },
    { title: "'Mukta', sans-serif", body: "'Mukta', sans-serif" },
    { title: "'Rubik', sans-serif", body: "'Rubik', sans-serif" },
    { title: "'DM Sans', sans-serif", body: "'DM Sans', sans-serif" },
    { title: "'Bebas Neue', sans-serif", body: "'Roboto', sans-serif" },
    { title: "'Josefin Sans', sans-serif", body: "'Josefin Sans', sans-serif" },
    { title: "'Exo 2', sans-serif", body: "'Exo 2', sans-serif" },
    { title: "'Archivo', sans-serif", body: "'Archivo', sans-serif" },
    { title: "'Manrope', sans-serif", body: "'Manrope', sans-serif" },
    { title: "'Space Grotesk', sans-serif", body: "'Space Grotesk', sans-serif" },
    { title: "'Plus Jakarta Sans', sans-serif", body: "'Plus Jakarta Sans', sans-serif" },
    { title: "'Outfit', sans-serif", body: "'Outfit', sans-serif" },
    { title: "'Sora', sans-serif", body: "'Sora', sans-serif" },
    { title: "'Lexend', sans-serif", body: "'Lexend', sans-serif" }
  ];
  return fonts[index % fonts.length];
}

// Get text alignment based on position variant
function getTextAlignment(position: number): {align: string, x: number, width: number} {
  const alignments = [
    { align: 'start', x: 80, width: 1050 },  // Left aligned
    { align: 'end', x: 970, width: 1050 }     // Right aligned
  ];
  return alignments[position % alignments.length];
}

// Color treatment variations
function getColorGradient(primary: string, secondary: string, treatment: number): string {
  const gradients = [
    `<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${primary};stop-opacity:1"/><stop offset="100%" style="stop-color:${secondary};stop-opacity:1"/></linearGradient>`,
    `<linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${primary};stop-opacity:1"/><stop offset="100%" style="stop-color:${secondary};stop-opacity:0.8"/></linearGradient>`,
    `<radialGradient id="grad1"><stop offset="0%" style="stop-color:${primary};stop-opacity:1"/><stop offset="100%" style="stop-color:${secondary};stop-opacity:1"/></radialGradient>`,
    `<linearGradient id="grad1" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${secondary};stop-opacity:1"/><stop offset="100%" style="stop-color:${primary};stop-opacity:1"/></linearGradient>`,
  ];
  return gradients[treatment % gradients.length];
}

// Typography weight variations
function getTypographyClass(weight: number): string {
  const weights = ['font-weight: 600', 'font-weight: 700', 'font-weight: 800'];
  return weights[weight % weights.length];
}

export function generateBusinessCardSVG(input: BusinessCardInput, designSeed?: number): string {
  const { 
    companyName, 
    tagline, 
    colorPrimary, 
    colorSecondary, 
    email = 'hello@company.com', 
    phone = '+1 (555) 123-4567',
    ownerName = '',
    ownerTitle = '',
    address = '',
    website = 'www.company.com',
    imageBase64 
  } = input;

  const w = 1050;
  const h = 600;
  const variation = getDesignVariation(designSeed);
  const titleWeight = getTypographyClass(variation.typographyWeight);
  const fonts = getFontFamily(variation.fontFamily);
  const textPos = getTextAlignment(variation.elementPosition);

  let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  
  svg += `<defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Montserrat:wght@400;600;700;800&family=Roboto:wght@400;500;700;900&family=Open+Sans:wght@400;600;700;800&family=Lato:wght@400;700;900&family=Raleway:wght@400;600;700;800&family=Oswald:wght@400;600;700&family=Playfair+Display:wght@400;700;900&family=Merriweather:wght@400;700;900&family=Ubuntu:wght@400;500;700&family=Nunito:wght@400;600;700;800&family=Work+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Quicksand:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700;900&family=PT+Sans:wght@400;700&family=Barlow:wght@400;600;700;800&family=Mukta:wght@400;600;700;800&family=Rubik:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&family=Bebas+Neue&family=Josefin+Sans:wght@400;600;700&family=Exo+2:wght@400;600;700;800&family=Archivo:wght@400;600;700;800&family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@400;600;700&family=Outfit:wght@400;600;700;800&family=Sora:wght@400;600;700;800&family=Lexend:wght@400;600;700;800&display=swap');
      
      .title { font-family: ${fonts.title}; ${titleWeight}; font-size: 56px; letter-spacing: -1px; }
      .owner { font-family: ${fonts.body}; font-weight: 600; font-size: 28px; }
      .position { font-family: ${fonts.body}; font-weight: 500; font-size: 20px; }
      .tagline { font-family: ${fonts.body}; font-size: 22px; font-weight: 500; }
      .text { font-family: ${fonts.body}; font-size: 17px; }
      .label { font-family: ${fonts.body}; font-size: 14px; font-weight: 600; text-transform: uppercase; }
    </style>
    ${getColorGradient(colorPrimary, colorSecondary, variation.colorTreatment)}
    <filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter>
  </defs>`;

  svg += `<rect width="${w}" height="${h}" fill="white"/>`;

  const style = variation.baseStyle;

  // BASE DESIGN 1: Geometric Wave Edge
  if (style === 0) {
    svg += `<path d="M 0 0 L 0 ${h} L ${w} ${h} L ${w} 0 Q ${w*0.75} 60 ${w*0.5} 0 Q ${w*0.25} -60 0 0 Z" fill="url(#grad1)" opacity="0.1"/>`;
    svg += `<rect x="0" y="0" width="6" height="${h}" fill="${colorPrimary}"/>`;
    let y = 100;
    svg += `<text x="${textPos.x}" y="${y}" class="title" fill="${colorPrimary}" text-anchor="${textPos.align}">${companyName}</text>`;
    y += 60;
    svg += `<text x="${textPos.x}" y="${y}" class="tagline" fill="${colorSecondary}" text-anchor="${textPos.align}">${tagline}</text>`;
    y += 55;
    if (ownerName) {
      svg += `<text x="${textPos.x}" y="${y}" class="owner" fill="#333" text-anchor="${textPos.align}">${ownerName}</text>`;
      y += 35;
      if (ownerTitle) {
        svg += `<text x="${textPos.x}" y="${y}" class="position" fill="#666" text-anchor="${textPos.align}">${ownerTitle}</text>`;
        y += 45;
      }
    }
    svg += `<circle cx="${w-100}" cy="${h-100}" r="80" fill="${colorSecondary}" opacity="0.08"/>`;
    svg += `<text x="${textPos.x}" y="${y}" class="text" fill="#555" text-anchor="${textPos.align}">${email}</text>`;
    svg += `<text x="${textPos.x}" y="${y+24}" class="text" fill="#555" text-anchor="${textPos.align}">${phone}</text>`;
    if (website) svg += `<text x="${textPos.x}" y="${y+48}" class="text" fill="#555" text-anchor="${textPos.align}">${website}</text>`;
  }

  // BASE DESIGN 2: Hexagon Accent
  else if (style === 1) {
    const hexPath = `M ${w-200} 100 L ${w-100} 50 L ${w} 100 L ${w} 200 L ${w-100} 250 L ${w-200} 200 Z`;
    svg += `<path d="${hexPath}" fill="url(#grad1)" opacity="0.12"/>`;
    svg += `<path d="${hexPath}" fill="none" stroke="${colorPrimary}" stroke-width="3" opacity="0.3"/>`;
    let y = 130;
    svg += `<text x="${textPos.x}" y="${y}" class="title" fill="${colorPrimary}" text-anchor="${textPos.align}">${companyName}</text>`;
    y += 60;
    svg += `<text x="${textPos.x}" y="${y}" class="tagline" fill="${colorSecondary}" text-anchor="${textPos.align}">${tagline}</text>`;
    y += 55;
    if (ownerName) {
      svg += `<text x="${textPos.x}" y="${y}" class="owner" fill="#333" text-anchor="${textPos.align}">${ownerName}</text>`;
      y += 33;
      if (ownerTitle) {
        svg += `<text x="${textPos.x}" y="${y}" class="position" fill="${colorPrimary}" text-anchor="${textPos.align}">${ownerTitle}</text>`;
        y += 45;
      }
    }
    const lineX1 = textPos.align === 'start' ? textPos.x : textPos.x - 570;
    const lineX2 = textPos.align === 'start' ? textPos.x + 570 : textPos.x;
    svg += `<line x1="${lineX1}" y1="${y}" x2="${lineX2}" y2="${y}" stroke="${colorSecondary}" stroke-width="2" opacity="0.3"/>`;
    y += 35;
    svg += `<text x="${textPos.x}" y="${y}" class="text" fill="#555" text-anchor="${textPos.align}">${email}</text>`;
    svg += `<text x="${textPos.x}" y="${y+24}" class="text" fill="#555" text-anchor="${textPos.align}">${phone}</text>`;
    if (website) svg += `<text x="${textPos.x}" y="${y+48}" class="text" fill="#555" text-anchor="${textPos.align}">${website}</text>`;
  }

  // BASE DESIGN 3: Diagonal Split
  else if (style === 2) {
    svg += `<polygon points="0,0 ${w},0 ${w},${h*0.3} 0,${h*0.6}" fill="url(#grad1)" opacity="0.08"/>`;
    svg += `<line x1="0" y1="${h*0.6}" x2="${w}" y2="${h*0.3}" stroke="${colorPrimary}" stroke-width="3" opacity="0.2"/>`;
    let y = 150;
    const xPos = textPos.align === 'start' ? 100 : w - 100;
    svg += `<text x="${xPos}" y="${y}" class="title" fill="${colorPrimary}" text-anchor="${textPos.align}">${companyName}</text>`;
    y += 60;
    svg += `<text x="${xPos}" y="${y}" class="tagline" fill="${colorSecondary}" text-anchor="${textPos.align}">${tagline}</text>`;
    y += 55;
    if (ownerName) {
      svg += `<text x="${xPos}" y="${y}" class="owner" fill="#333" text-anchor="${textPos.align}">${ownerName}</text>`;
      y += 33;
      if (ownerTitle) {
        svg += `<text x="${xPos}" y="${y}" class="position" fill="#666" text-anchor="${textPos.align}">${ownerTitle}</text>`;
        y += 45;
      }
    }
    svg += `<text x="${xPos}" y="${y}" class="text" fill="#555" text-anchor="${textPos.align}">${email}</text>`;
    svg += `<text x="${xPos}" y="${y+24}" class="text" fill="#555" text-anchor="${textPos.align}">${phone}</text>`;
    if (website) svg += `<text x="${xPos}" y="${y+48}" class="text" fill="#555" text-anchor="${textPos.align}">${website}</text>`;
  }

  // BASE DESIGN 4: Circular Burst
  else if (style === 3) {
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * Math.PI / 180;
      const x = w - 150 + Math.cos(angle) * 100;
      const y = h - 150 + Math.sin(angle) * 100;
      svg += `<circle cx="${x}" cy="${y}" r="20" fill="${i % 2 === 0 ? colorPrimary : colorSecondary}" opacity="0.08"/>`;
    }
    svg += `<circle cx="${w-150}" cy="${h-150}" r="60" fill="url(#grad1)" opacity="0.15"/>`;
    let y = 100;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 5: Modern Minimalist Bars
  else if (style === 4) {
    svg += `<rect x="0" y="0" width="${w}" height="80" fill="url(#grad1)" opacity="0.06"/>`;
    svg += `<rect x="0" y="${h-60}" width="${w}" height="60" fill="${colorSecondary}" opacity="0.05"/>`;
    svg += `<rect x="40" y="100" width="5" height="300" fill="${colorPrimary}"/>`;
    let y = 150;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 6: Triangle Corner Accent
  else if (style === 5) {
    svg += `<polygon points="${w},0 ${w},180 ${w-180},0" fill="url(#grad1)" opacity="0.15"/>`;
    svg += `<polygon points="0,${h} 200,${h} 0,${h-200}" fill="${colorSecondary}" opacity="0.08"/>`;
    let y = 120;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 7: Dot Grid Pattern
  else if (style === 6) {
    svg += `<pattern id="dots" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2.5" fill="${colorPrimary}" opacity="0.15"/></pattern>`;
    svg += `<rect width="${w}" height="${h}" fill="url(#dots)"/>`;
    svg += `<rect x="0" y="0" width="${w}" height="100" fill="white" opacity="0.9"/>`;
    let y = 60;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 100;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 8: Abstract Curves
  else if (style === 7) {
    svg += `<path d="M 0 ${h} Q ${w*0.3} ${h*0.5} ${w*0.6} ${h} T ${w} ${h*0.7} L ${w} ${h} Z" fill="url(#grad1)" opacity="0.1"/>`;
    svg += `<path d="M 0 ${h*0.9} Q ${w*0.3} ${h*0.6} ${w*0.6} ${h*0.9}" stroke="${colorPrimary}" stroke-width="2" fill="none" opacity="0.3"/>`;
    let y = 100;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 9: Gradient Blob
  else if (style === 8) {
    svg += `<ellipse cx="${w-200}" cy="150" rx="180" ry="120" fill="url(#grad1)" opacity="0.12" transform="rotate(-25 ${w-200} 150)"/>`;
    svg += `<circle cx="${w-200}" cy="150" r="100" fill="${colorSecondary}" opacity="0.08"/>`;
    let y = 120;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 10: Layered Rectangles
  else if (style === 9) {
    svg += `<rect x="50" y="50" width="300" height="200" fill="${colorPrimary}" opacity="0.05" transform="rotate(-5 200 150)"/>`;
    svg += `<rect x="70" y="70" width="300" height="200" fill="${colorSecondary}" opacity="0.08" transform="rotate(3 220 170)"/>`;
    svg += `<rect x="90" y="40" width="300" height="200" fill="url(#grad1)" opacity="0.06"/>`;
    let y = 140;
    svg += `<text x="120" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="120" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="120" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="120" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="120" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="120" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="120" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 11: Side Stripe Gradient
  else if (style === 10) {
    svg += `<rect x="${w-200}" y="0" width="200" height="${h}" fill="url(#grad1)" opacity="0.1"/>`;
    svg += `<line x1="${w-200}" y1="0" x2="${w-200}" y2="${h}" stroke="${colorPrimary}" stroke-width="4"/>`;
    let y = 110;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 12: Diamond Pattern
  else if (style === 11) {
    for (let i = 0; i < 3; i++) {
      const x = w - 150 - (i * 60);
      const y = 100 + (i * 50);
      svg += `<rect x="${x}" y="${y}" width="40" height="40" fill="${i % 2 === 0 ? colorPrimary : colorSecondary}" opacity="0.1" transform="rotate(45 ${x+20} ${y+20})"/>`;
    }
    let y = 120;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 13: Arch Accent
  else if (style === 12) {
    svg += `<path d="M ${w} 0 Q ${w-150} 150 ${w} 300 L ${w} 0 Z" fill="url(#grad1)" opacity="0.12"/>`;
    svg += `<path d="M ${w} 0 Q ${w-150} 150 ${w} 300" stroke="${colorPrimary}" stroke-width="3" fill="none" opacity="0.3"/>`;
    let y = 110;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 14: Concentric Circles
  else if (style === 13) {
    const cx = w - 150;
    const cy = h - 150;
    for (let i = 1; i <= 4; i++) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${i * 35}" fill="none" stroke="${i % 2 === 0 ? colorPrimary : colorSecondary}" stroke-width="2" opacity="${0.15 / i}"/>`;
    }
    let y = 100;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 15: Zigzag Border
  else if (style === 14) {
    let zigzag = 'M 0 0 ';
    for (let i = 0; i < 20; i++) {
      zigzag += `L ${i * (w/20)} ${i % 2 === 0 ? 0 : 30} `;
    }
    svg += `<path d="${zigzag}" stroke="${colorPrimary}" stroke-width="3" fill="none" opacity="0.3"/>`;
    svg += `<rect x="0" y="0" width="${w}" height="40" fill="url(#grad1)" opacity="0.05"/>`;
    let y = 120;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 16: Staggered Bars
  else if (style === 15) {
    for (let i = 0; i < 5; i++) {
      const barHeight = 80 + (i * 20);
      const y = h - barHeight - 50;
      svg += `<rect x="${w - 150 - (i * 30)}" y="${y}" width="25" height="${barHeight}" fill="${i % 2 === 0 ? colorPrimary : colorSecondary}" opacity="0.12"/>`;
    }
    let y = 110;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 17: Modern Grid Lines
  else if (style === 16) {
    for (let i = 0; i < 8; i++) {
      const x = 100 + (i * 120);
      svg += `<line x1="${x}" y1="50" x2="${x}" y2="150" stroke="${colorPrimary}" stroke-width="1" opacity="0.15"/>`;
    }
    for (let i = 0; i < 4; i++) {
      const gridY = 80 + (i * 30);
      svg += `<line x1="100" y1="${gridY}" x2="900" y2="${gridY}" stroke="${colorSecondary}" stroke-width="1" opacity="0.1"/>`;
    }
    let y = 200;
    svg += `<text x="100" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="100" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="100" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="100" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="100" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="100" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="100" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 18: Overlapping Circles Modern
  else if (style === 17) {
    svg += `<circle cx="${w-180}" cy="120" r="100" fill="${colorPrimary}" opacity="0.08"/>`;
    svg += `<circle cx="${w-100}" cy="180" r="100" fill="${colorSecondary}" opacity="0.08"/>`;
    svg += `<circle cx="${w-140}" cy="150" r="80" fill="url(#grad1)" opacity="0.1"/>`;
    let y = 120;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 19: Bracket Design
  else if (style === 18) {
    svg += `<path d="M 50 100 L 50 50 L 150 50" stroke="${colorPrimary}" stroke-width="4" fill="none"/>`;
    svg += `<path d="M ${w-50} 100 L ${w-50} 50 L ${w-150} 50" stroke="${colorPrimary}" stroke-width="4" fill="none"/>`;
    svg += `<path d="M 50 ${h-100} L 50 ${h-50} L 150 ${h-50}" stroke="${colorSecondary}" stroke-width="4" fill="none"/>`;
    svg += `<path d="M ${w-50} ${h-100} L ${w-50} ${h-50} L ${w-150} ${h-50}" stroke="${colorSecondary}" stroke-width="4" fill="none"/>`;
    let y = 130;
    svg += `<text x="180" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="180" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="180" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="180" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="180" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="180" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="180" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // BASE DESIGN 20: Mountain Silhouette
  else if (style === 19) {
    svg += `<polygon points="0,${h} 200,${h-200} 400,${h-100} 600,${h-250} 800,${h-150} ${w},${h-50} ${w},${h}" fill="url(#grad1)" opacity="0.1"/>`;
    svg += `<polyline points="0,${h} 200,${h-200} 400,${h-100} 600,${h-250} 800,${h-150} ${w},${h-50}" stroke="${colorPrimary}" stroke-width="3" fill="none" opacity="0.3"/>`;
    let y = 100;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="${colorPrimary}">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
  }

  // Fallback for any undefined styles
  else {
    let y = 120;
    svg += `<rect x="0" y="0" width="${w}" height="5" fill="${colorPrimary}"/>`;
    svg += `<text x="80" y="${y}" class="title" fill="${colorPrimary}">${companyName}</text>`;
    y += 50;
    svg += `<text x="80" y="${y}" class="tagline" fill="${colorSecondary}">${tagline}</text>`;
    y += 50;
    if (ownerName) {
      svg += `<text x="80" y="${y}" class="owner" fill="#333">${ownerName}</text>`;
      y += 28;
      if (ownerTitle) {
        svg += `<text x="80" y="${y}" class="position" fill="#666">${ownerTitle}</text>`;
        y += 40;
      }
    }
    svg += `<text x="80" y="${y}" class="text" fill="#555">${email}</text>`;
    svg += `<text x="80" y="${y+22}" class="text" fill="#555">${phone}</text>`;
    if (website) svg += `<text x="80" y="${y+44}" class="text" fill="#555">${website}</text>`;
    if (address) svg += `<text x="80" y="${y+66}" class="text" fill="#555">${address}</text>`;
  }

  // Add image if provided for certain designs
  if (imageBase64 && [0, 1, 3, 4, 5].includes(style)) {
    svg += `<image x="${w - 140}" y="20" width="120" height="120" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" clip-path="circle(60px at 60px 60px)"/>`;
    svg += `<circle cx="${w - 80}" cy="80" r="65" fill="none" stroke="${colorPrimary}" stroke-width="2" opacity="0.3"/>`;
  }

  svg += `</svg>`;
  return svg;
}