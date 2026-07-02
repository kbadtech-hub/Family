import { NextRequest, NextResponse } from 'next/server';
import { filterAndWarn } from '@/lib/bad-words-filter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const result = filterAndWarn(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Filter API error:', error);
    return NextResponse.json({ error: 'Filter failed' }, { status: 500 });
  }
}
