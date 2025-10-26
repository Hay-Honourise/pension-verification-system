import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [debug/token] Starting token debug...');
    
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      console.log('❌ No bearer token found');
      return NextResponse.json({ 
        error: 'No bearer token found',
        debug: 'Check if Authorization header is present'
      }, { status: 401 });
    }

    console.log('🔑 Bearer token length:', bearer.length);
    console.log('🔑 Bearer token (first 50 chars):', bearer.substring(0, 50) + '...');

    const token = verifyToken(bearer);
    
    if (!token) {
      console.log('❌ Token verification failed');
      return NextResponse.json({ 
        error: 'Token verification failed',
        debug: 'Token is invalid or expired'
      }, { status: 401 });
    }

    console.log('✅ Token verified successfully');
    console.log('🔍 Token payload:', token);

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        role: token.role,
        email: token.email,
        pensionId: token.pensionId,
        type: typeof token.id,
        hasId: !!token.id,
        idIsNumber: !isNaN(Number(token.id))
      },
      debug: {
        tokenLength: bearer.length,
        tokenType: typeof token,
        tokenKeys: Object.keys(token)
      }
    });
    
  } catch (err) {
    console.error('❌ [debug/token] error:', err);
    return NextResponse.json({ 
      error: 'Debug failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
