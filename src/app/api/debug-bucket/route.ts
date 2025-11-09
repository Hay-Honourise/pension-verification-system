import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({
        error: "Missing url parameter",
        usage: "Add ?url=<your-file-url> to test bucket extraction",
        example: "?url=https://f003.backblazeb2.com/file/pensionVerification/pensioners/1/idCard-123.jpg"
      }, { status: 400 });
    }

    // Extract bucket from URL
    const backblazePattern = /https?:\/\/[^\/]+\/file\/([^\/]+)\/(.+)/;
    const match = fileUrl.match(backblazePattern);

    const envBucket = process.env.S3_BUCKET;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    
    // Extract bucket from S3_PUBLIC_BASE_URL if available
    let bucketFromPublicUrl = null;
    if (publicBaseUrl) {
      const publicMatch = publicBaseUrl.match(/\/file\/([^\/]+)/);
      if (publicMatch) {
        bucketFromPublicUrl = publicMatch[1];
      }
    }

    const result = {
      input: {
        fileUrl,
      },
      extraction: match ? {
        success: true,
        bucketFromUrl: match[1],
        keyFromUrl: match[2],
        fullMatch: match[0]
      } : {
        success: false,
        message: "URL does not match Backblaze B2 pattern",
        pattern: "https://f003.backblazeb2.com/file/{bucket}/{key}"
      },
      environment: {
        S3_BUCKET: envBucket || "MISSING",
        S3_PUBLIC_BASE_URL: publicBaseUrl || "MISSING",
        bucketFromPublicUrl
      },
      analysis: match ? {
        bucketMatch: match[1] === envBucket ? "MATCH" : "MISMATCH",
        bucketFromUrlMatchesEnv: match[1] === envBucket,
        bucketFromUrlMatchesPublicUrl: match[1] === bucketFromPublicUrl,
        recommendation: match[1] !== envBucket 
          ? `Use bucket "${match[1]}" from URL (not "${envBucket}" from env)`
          : "Bucket names match - configuration is correct"
      } : {
        message: "Cannot analyze - URL pattern not recognized"
      }
    };

    return NextResponse.json({
      success: true,
      ...result,
      message: match 
        ? `Bucket "${match[1]}" extracted from URL. ${match[1] !== envBucket ? '⚠️ Mismatch with env bucket!' : '✅ Matches env bucket.'}`
        : "Could not extract bucket from URL - check URL format"
    });
  } catch (error) {
    console.error("Bucket debug error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to analyze bucket",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

