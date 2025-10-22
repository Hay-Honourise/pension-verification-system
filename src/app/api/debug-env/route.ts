import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const envVars = {
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'SET' : 'MISSING',
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
      S3_BUCKET: process.env.S3_BUCKET || 'MISSING',
      S3_REGION: process.env.S3_REGION || 'MISSING',
      S3_ENDPOINT: process.env.S3_ENDPOINT || 'MISSING'
    };

    const actualValues = {
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? '***HIDDEN***' : 'MISSING',
      S3_BUCKET: process.env.S3_BUCKET,
      S3_REGION: process.env.S3_REGION,
      S3_ENDPOINT: process.env.S3_ENDPOINT
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
      values: actualValues,
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
