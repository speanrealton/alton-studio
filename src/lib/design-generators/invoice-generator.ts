// Invoice Generator - Professional invoice template
export interface InvoiceInput {
  companyName: string;
  industry: string;
  colorPrimary: string;
  colorSecondary: string;
  imageBase64?: string;
  style?: 'modern' | 'minimal' | 'formal' | 'contemporary' | 'random';
}

function getRandomInvoiceStyle(): 'modern' | 'minimal' | 'formal' | 'contemporary' {
  const styles = ['modern', 'minimal', 'formal', 'contemporary'] as const;
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generateInvoiceSVG(input: InvoiceInput): string {
  const { companyName, industry, colorPrimary, colorSecondary, imageBase64 } = input;
  let style = input.style || 'modern';
  
  if (style === 'random' || !style) {
    style = getRandomInvoiceStyle();
  }

  // A4 size
  const width = 2100;
  const height = 2970;

  if (style === 'modern') {
    return generateModernInvoiceStyle(width, height, companyName, industry, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'minimal') {
    return generateMinimalInvoiceStyle(width, height, companyName, industry, colorPrimary, colorSecondary, imageBase64);
  } else if (style === 'formal') {
    return generateFormalInvoiceStyle(width, height, companyName, industry, colorPrimary, colorSecondary, imageBase64);
  } else {
    return generateContemporaryInvoiceStyle(width, height, companyName, industry, colorPrimary, colorSecondary, imageBase64);
  }
}

function generateModernInvoiceStyle(width: number, height: number, companyName: string, industry: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .invoice-title { font-family: 'Segoe UI', 'Arial Black'; font-weight: bold; font-size: 72px; letter-spacing: -1px; }
      .invoice-header { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 48px; }
      .invoice-label { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 36px; }
      .invoice-text { font-family: 'Segoe UI', Arial; font-size: 32px; }
      .invoice-table-header { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 32px; }
    </style>
    <linearGradient id="invoiceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colorPrimary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecondary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="${width}" height="300" fill="url(#invoiceGrad)"/>`;
  svg += `<text x="100" y="200" class="invoice-title" fill="white">${companyName}</text>`;
  
  if (imageBase64) {
    svg += `<image x="1600" y="50" width="350" height="220" xlink:href="${imageBase64}" preserveAspectRatio="xMidYMid slice" />`;
  }

  svg += `<text x="${width - 600}" y="200" class="invoice-header" fill="white">INVOICE</text>`;
  svg += `<text x="100" y="420" class="invoice-label" fill="${colorPrimary}">Bill From:</text>`;
  svg += `<text x="100" y="500" class="invoice-text" fill="#333">${companyName}</text>`;
  svg += `<text x="100" y="570" class="invoice-text" fill="#666">${industry} Industry</text>`;
  svg += `<text x="100" y="640" class="invoice-text" fill="#666">contact@company.com</text>`;
  
  svg += `<text x="1100" y="420" class="invoice-label" fill="${colorPrimary}">Bill To:</text>`;
  svg += `<text x="1100" y="500" class="invoice-text" fill="#333">Client Name</text>`;
  svg += `<text x="1100" y="570" class="invoice-text" fill="#666">Client Address</text>`;
  
  svg += `<text x="100" y="900" class="invoice-label" fill="${colorPrimary}">Invoice #:</text>`;
  svg += `<text x="100" y="1000" class="invoice-text" fill="#333">INV-2025-001</text>`;
  svg += `<text x="1100" y="900" class="invoice-label" fill="${colorPrimary}">Date:</text>`;
  svg += `<text x="1100" y="1000" class="invoice-text" fill="#333">Dec 12, 2025</text>`;
  
  svg += `<line x1="100" y1="1200" x2="${width - 100}" y2="1200" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="100" y="1320" class="invoice-table-header" fill="${colorPrimary}">Description</text>`;
  svg += `<text x="1200" y="1320" class="invoice-table-header" fill="${colorPrimary}">Qty</text>`;
  svg += `<text x="1600" y="1320" class="invoice-table-header" fill="${colorPrimary}">Rate</text>`;
  svg += `<text x="1900" y="1320" class="invoice-table-header" fill="${colorPrimary}">Amount</text>`;
  svg += `<line x1="100" y1="1400" x2="${width - 100}" y2="1400" stroke="${colorSecondary}" stroke-width="2"/>`;
  
  svg += `<text x="100" y="1600" class="invoice-text" fill="#333">Professional Services</text>`;
  svg += `<text x="1200" y="1600" class="invoice-text" fill="#333">1</text>`;
  svg += `<text x="1600" y="1600" class="invoice-text" fill="#333">$1,500.00</text>`;
  svg += `<text x="1900" y="1600" class="invoice-text" fill="#333">$1,500.00</text>`;
  
  svg += `<line x1="100" y1="2200" x2="${width - 100}" y2="2200" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="1600" y="2350" class="invoice-label" fill="${colorPrimary}">Total:</text>`;
  svg += `<text x="1900" y="2350" class="invoice-label" fill="${colorPrimary}">$1,500.00</text>`;
  
  svg += `<rect y="${height - 300}" width="${width}" height="300" fill="${colorSecondary}" opacity="0.1"/>`;
  svg += `<text x="100" y="${height - 150}" class="invoice-text" fill="#666">Thank you for your business!</text>`;

  svg += `</svg>`;
  return svg;
}

function generateMinimalInvoiceStyle(width: number, height: number, companyName: string, industry: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .invoice-title { font-family: 'Segoe UI', 'Arial Black'; font-weight: 900; font-size: 85px; letter-spacing: -2px; }
      .invoice-header { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 50px; }
      .invoice-label { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 34px; }
      .invoice-text { font-family: 'Segoe UI', Arial; font-size: 30px; }
      .invoice-table-header { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 30px; }
    </style>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="100" height="${height}" fill="${colorPrimary}"/>`;
  
  svg += `<text x="300" y="150" class="invoice-title" fill="${colorPrimary}">${companyName}</text>`;
  svg += `<text x="300" y="280" class="invoice-header" fill="${colorSecondary}">INVOICE</text>`;
  
  svg += `<text x="300" y="500" class="invoice-label" fill="${colorPrimary}">FROM</text>`;
  svg += `<text x="300" y="580" class="invoice-text" fill="#333">${companyName}, ${industry}</text>`;
  
  svg += `<text x="1300" y="500" class="invoice-label" fill="${colorPrimary}">TO</text>`;
  svg += `<text x="1300" y="580" class="invoice-text" fill="#333">Client Name</text>`;
  
  svg += `<line x1="300" y1="800" x2="${width - 300}" y2="800" stroke="${colorPrimary}" stroke-width="2"/>`;
  
  svg += `<text x="300" y="1000" class="invoice-label" fill="${colorPrimary}">Invoice #</text>`;
  svg += `<text x="300" y="1100" class="invoice-text" fill="#333">INV-2025-001</text>`;
  
  svg += `<text x="300" y="1400" class="invoice-table-header" fill="${colorPrimary}">Service</text>`;
  svg += `<text x="1200" y="1400" class="invoice-table-header" fill="${colorPrimary}">Amount</text>`;
  
  svg += `<text x="300" y="1700" class="invoice-text" fill="#333">Professional Services</text>`;
  svg += `<text x="1200" y="1700" class="invoice-text" fill="#333">$1,500.00</text>`;
  
  svg += `<line x1="300" y1="2050" x2="${width - 300}" y2="2050" stroke="${colorPrimary}" stroke-width="3"/>`;
  svg += `<text x="1200" y="2250" class="invoice-header" fill="${colorPrimary}">Total: $1,500.00</text>`;

  svg += `</svg>`;
  return svg;
}

function generateFormalInvoiceStyle(width: number, height: number, companyName: string, industry: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .invoice-title { font-family: 'Georgia', 'Times New Roman', serif; font-weight: bold; font-size: 70px; letter-spacing: 1px; }
      .invoice-header { font-family: 'Georgia', serif; font-weight: bold; font-size: 46px; }
      .invoice-label { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 34px; }
      .invoice-text { font-family: 'Segoe UI', Arial; font-size: 32px; }
      .invoice-table-header { font-family: 'Georgia', serif; font-weight: bold; font-size: 31px; }
    </style>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  svg += `<rect width="${width}" height="80" fill="${colorPrimary}"/>`;
  svg += `<rect y="${height - 80}" width="${width}" height="80" fill="${colorPrimary}"/>`;
  
  svg += `<text x="150" y="300" class="invoice-title" fill="${colorPrimary}">${companyName}</text>`;
  svg += `<text x="${width - 800}" y="200" class="invoice-header" fill="${colorSecondary}">INVOICE</text>`;
  
  svg += `<line x1="150" y1="450" x2="${width - 150}" y2="450" stroke="${colorSecondary}" stroke-width="2"/>`;
  
  svg += `<text x="150" y="600" class="invoice-label" fill="${colorPrimary}">Bill From:</text>`;
  svg += `<text x="150" y="680" class="invoice-text" fill="#333">${companyName}</text>`;
  svg += `<text x="150" y="750" class="invoice-text" fill="#666">${industry} Industry</text>`;
  
  svg += `<text x="1250" y="600" class="invoice-label" fill="${colorPrimary}">Bill To:</text>`;
  svg += `<text x="1250" y="680" class="invoice-text" fill="#333">Client Name</text>`;
  
  svg += `<text x="150" y="1000" class="invoice-label" fill="${colorPrimary}">Invoice Number:</text>`;
  svg += `<text x="150" y="1100" class="invoice-text" fill="#333">INV-2025-001</text>`;
  
  svg += `<text x="1250" y="1000" class="invoice-label" fill="${colorPrimary}">Date:</text>`;
  svg += `<text x="1250" y="1100" class="invoice-text" fill="#333">December 12, 2025</text>`;
  
  svg += `<line x1="150" y1="1300" x2="${width - 150}" y2="1300" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="150" y="1450" class="invoice-table-header" fill="${colorPrimary}">Description</text>`;
  svg += `<text x="1250" y="1450" class="invoice-table-header" fill="${colorPrimary}">Amount</text>`;
  svg += `<line x1="150" y1="1550" x2="${width - 150}" y2="1550" stroke="${colorSecondary}" stroke-width="1"/>`;
  
  svg += `<text x="150" y="1750" class="invoice-text" fill="#333">Professional Services</text>`;
  svg += `<text x="1250" y="1750" class="invoice-text" fill="#333">$1,500.00</text>`;
  
  svg += `<line x1="150" y1="2150" x2="${width - 150}" y2="2150" stroke="${colorSecondary}" stroke-width="3"/>`;
  svg += `<text x="1250" y="2300" class="invoice-header" fill="${colorPrimary}">Total: $1,500.00</text>`;
  
  svg += `<text x="150" y="${height - 150}" class="invoice-text" fill="#666">Thank you for your business</text>`;

  svg += `</svg>`;
  return svg;
}

function generateContemporaryInvoiceStyle(width: number, height: number, companyName: string, industry: string, colorPrimary: string, colorSecondary: string, imageBase64?: string): string {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  svg += `<defs>
    <style>
      .invoice-title { font-family: 'Segoe UI', 'Arial Black'; font-weight: 900; font-size: 80px; letter-spacing: -2px; }
      .invoice-header { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 50px; }
      .invoice-label { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 36px; }
      .invoice-text { font-family: 'Segoe UI', Arial; font-size: 32px; }
      .invoice-table-header { font-family: 'Segoe UI', Arial; font-weight: bold; font-size: 32px; }
    </style>
    <linearGradient id="boldInvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorSecondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorPrimary};stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="url(#boldInvGrad)"/>`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  svg += `<text x="150" y="180" class="invoice-title" fill="${colorPrimary}">${companyName}</text>`;
  svg += `<text x="${width - 900}" y="180" class="invoice-header" fill="${colorSecondary}">INVOICE</text>`;
  
  svg += `<line x1="150" y1="300" x2="${width - 150}" y2="300" stroke="url(#boldInvGrad)" stroke-width="4"/>`;
  
  svg += `<text x="150" y="500" class="invoice-label" fill="${colorPrimary}">Bill From:</text>`;
  svg += `<text x="150" y="600" class="invoice-text" fill="#333">${companyName}</text>`;
  svg += `<text x="150" y="670" class="invoice-text" fill="#666">${industry} Industry</text>`;
  
  svg += `<text x="1250" y="500" class="invoice-label" fill="${colorSecondary}">Bill To:</text>`;
  svg += `<text x="1250" y="600" class="invoice-text" fill="#333">Client Name</text>`;
  
  svg += `<text x="150" y="1000" class="invoice-label" fill="${colorPrimary}">Invoice:</text>`;
  svg += `<text x="150" y="1100" class="invoice-text" fill="#333">INV-2025-001</text>`;
  svg += `<text x="1250" y="1000" class="invoice-label" fill="${colorSecondary}">Date:</text>`;
  svg += `<text x="1250" y="1100" class="invoice-text" fill="#333">Dec 12, 2025</text>`;
  
  svg += `<line x1="150" y1="1300" x2="${width - 150}" y2="1300" stroke="${colorPrimary}" stroke-width="3"/>`;
  svg += `<text x="150" y="1450" class="invoice-table-header" fill="${colorPrimary}">Description</text>`;
  svg += `<text x="1300" y="1450" class="invoice-table-header" fill="${colorPrimary}">Amount</text>`;
  
  svg += `<text x="150" y="1750" class="invoice-text" fill="#333">Professional Services</text>`;
  svg += `<text x="1300" y="1750" class="invoice-text" fill="#333">$1,500.00</text>`;
  
  svg += `<line x1="150" y1="2150" x2="${width - 150}" y2="2150" stroke="${colorPrimary}" stroke-width="3"/>`;
  svg += `<rect x="1000" y="2250" width="1000" height="200" rx="10" fill="${colorSecondary}" opacity="0.15"/>`;
  svg += `<text x="1300" y="2380" class="invoice-header" fill="${colorPrimary}">Total: $1,500.00</text>`;

  svg += `</svg>`;
  return svg;
}
