// Minimal test endpoint
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[test-endpoint] POST called');
  return NextResponse.json({ success: true, test: 'ok' });
}

export async function GET() {
  console.log('[test-endpoint] GET called');
  return NextResponse.json({ success: true, test: 'ok' });
}
