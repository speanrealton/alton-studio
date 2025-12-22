import { NextResponse } from 'next/server';
import aiModels from '../../../../config/ai-models.json';

export async function GET() {
  return NextResponse.json(aiModels);
}
