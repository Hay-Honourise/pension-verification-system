import { NextRequest, NextResponse } from 'next/server';
import { authenticate, getUploadUrl, uploadFile } from '@/lib/backblaze';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Backblaze B2 connection...');
    
    // Check environment variables
    const envVars = {
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Missing',
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      S3_BUCKET: process.env.S3_BUCKET ? 'Set' : 'Missing',
      S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL ? 'Set' : 'Missing',
    };
    
    console.log('Environment variables status:', envVars);
    
    // Test authentication
    const authResult = await authenticate();
    
    // Test getting upload URL
    const uploadUrlResult = await getUploadUrl();
    
    // Test a small file upload
    const testBuffer = Buffer.from('test file content');
    const testFileName = `test/test-${Date.now()}.txt`;
    const uploadResult = await uploadFile(testBuffer, testFileName, 'text/plain');
    
    return NextResponse.json({
      success: true,
      message: 'Backblaze B2 connection and upload test successful',
      environment: envVars,
      auth: {
        hasToken: !!authResult.authToken,
        downloadUrl: authResult.downloadUrl,
        apiUrl: authResult.apiUrl
      },
      uploadUrl: {
        hasUrl: !!uploadUrlResult.uploadUrl,
        hasToken: !!uploadUrlResult.authorizationToken
      },
      testUpload: {
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        contentType: uploadResult.contentType
      }
    });
    
  } catch (error: any) {
    console.error('Backblaze B2 test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Backblaze B2 connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      environment: {
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Missing',
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
        S3_BUCKET: process.env.S3_BUCKET ? 'Set' : 'Missing',
        S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL ? 'Set' : 'Missing',
      }
    }, { status: 500 });
  }
}
