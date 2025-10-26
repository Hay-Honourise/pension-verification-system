import { NextRequest, NextResponse } from 'next/server';
import { testS3Connection } from '@/lib/backblaze';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Backblaze B2 connection...');
    
    const result = await testS3Connection();
    
    console.log('📊 Test result:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Backblaze test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
