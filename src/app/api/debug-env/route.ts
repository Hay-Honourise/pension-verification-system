import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showValues = searchParams.get('showValues') === 'true';
    
    const envVars = {
      // B2 Legacy
      B2_KEY_ID: process.env.B2_KEY_ID ? 'SET' : 'MISSING',
      B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? 'SET' : 'MISSING',
      B2_BUCKET_ID: process.env.B2_BUCKET_ID || 'MISSING',
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME || 'MISSING',
      // S3-Compatible (Current)
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'SET' : 'MISSING',
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
      S3_BUCKET: process.env.S3_BUCKET || 'MISSING',
      S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL || 'MISSING',
      S3_ENDPOINT: process.env.S3_ENDPOINT || 'MISSING',
      S3_REGION: process.env.S3_REGION || 'MISSING'
    };

    const actualValues = showValues ? {
      B2_KEY_ID: process.env.B2_KEY_ID,
      B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? '***HIDDEN***' : 'MISSING',
      B2_BUCKET_ID: process.env.B2_BUCKET_ID,
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? '***HIDDEN***' : 'MISSING',
      S3_BUCKET: process.env.S3_BUCKET,
      S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_REGION: process.env.S3_REGION
    } : { message: 'Add ?showValues=true to see actual values' };

    // Extract bucket from S3_PUBLIC_BASE_URL if available
    let bucketFromPublicUrl = null;
    if (process.env.S3_PUBLIC_BASE_URL) {
      const match = process.env.S3_PUBLIC_BASE_URL.match(/\/file\/([^\/]+)/);
      if (match) {
        bucketFromPublicUrl = match[1];
      }
    }

    return NextResponse.json({
      success: true,
      environment: envVars,
      values: actualValues,
      bucketAnalysis: {
        envBucket: process.env.S3_BUCKET,
        bucketFromPublicUrl,
        match: bucketFromPublicUrl === process.env.S3_BUCKET ? 'MATCH' : 'MISMATCH',
        warning: bucketFromPublicUrl && bucketFromPublicUrl !== process.env.S3_BUCKET 
          ? `Bucket mismatch detected! Public URL uses "${bucketFromPublicUrl}" but env uses "${process.env.S3_BUCKET}"`
          : null
      },
      message: "Check if all required environment variables are set correctly"
    });
  } catch (error) {
    console.error("Environment debug error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to check environment variables",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
