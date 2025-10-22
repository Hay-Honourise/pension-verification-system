import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const envVars = {
      B2_KEY_ID: process.env.B2_KEY_ID ? 'SET' : 'MISSING',
      B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? 'SET' : 'MISSING',
      B2_BUCKET_ID: process.env.B2_BUCKET_ID || 'MISSING',
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME || 'MISSING'
    };

    const actualValues = {
      B2_KEY_ID: process.env.B2_KEY_ID,
      B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? '***HIDDEN***' : 'MISSING',
      B2_BUCKET_ID: process.env.B2_BUCKET_ID,
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME
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
