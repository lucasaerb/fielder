import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real implementation, you would:
    // 1. Authenticate the request
    // 2. Call OpenAI's API to generate an ephemeral key
    // 3. Return the key
    
    // For now, we'll return a mock key for development
    return NextResponse.json({ key: 'ek_test_mock_key' });
  } catch (error) {
    console.error('Error generating ephemeral key:', error);
    return NextResponse.json(
      { error: 'Failed to generate ephemeral key' },
      { status: 500 }
    );
  }
} 