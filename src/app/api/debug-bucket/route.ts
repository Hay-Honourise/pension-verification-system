import { NextRequest, NextResponse } from "next/server";

/**
 * Extracts the cluster ID from a Backblaze B2 URL
 */
function extractClusterFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const clusterMatch = hostname.match(/^([a-z0-9]+)\.backblazeb2\.com$/i);
    return clusterMatch ? clusterMatch[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Parses a Backblaze B2 URL to extract cluster, bucket, and key
 */
function parseBackblazeUrl(url: string): { cluster: string; bucket: string; key: string } | null {
  try {
    const backblazePattern = /https?:\/\/([^\/]+)\/file\/([^\/]+)\/(.+)/;
    const match = url.match(backblazePattern);
    
    if (!match) {
      return null;
    }
    
    const hostname = match[1];
    const clusterMatch = hostname.match(/^([a-z0-9]+)\.backblazeb2\.com$/i);
    const cluster = clusterMatch ? clusterMatch[1].toLowerCase() : hostname;
    const bucket = match[2];
    const key = match[3];
    
    return { cluster, bucket, key };
  } catch {
    return null;
  }
}

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

    const parsed = parseBackblazeUrl(fileUrl);
    const envBucket = process.env.S3_BUCKET;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    
    // Extract cluster and bucket from S3_PUBLIC_BASE_URL if available
    let configuredCluster: string | null = null;
    let bucketFromPublicUrl: string | null = null;
    if (publicBaseUrl) {
      configuredCluster = extractClusterFromUrl(publicBaseUrl);
      const publicMatch = publicBaseUrl.match(/\/file\/([^\/]+)/);
      if (publicMatch) {
        bucketFromPublicUrl = publicMatch[1];
      }
    }

    const result = {
      input: {
        fileUrl,
      },
      extraction: parsed ? {
        success: true,
        cluster: parsed.cluster,
        bucket: parsed.bucket,
        key: parsed.key,
      } : {
        success: false,
        message: "URL does not match Backblaze B2 pattern",
        pattern: "https://f003.backblazeb2.com/file/{bucket}/{key}"
      },
      environment: {
        S3_BUCKET: envBucket || "MISSING",
        S3_PUBLIC_BASE_URL: publicBaseUrl || "MISSING",
        configuredCluster,
        bucketFromPublicUrl
      },
      analysis: parsed ? {
        bucketMatch: parsed.bucket === envBucket ? "MATCH" : "MISMATCH",
        clusterMatch: configuredCluster && parsed.cluster === configuredCluster ? "MATCH" : configuredCluster ? "MISMATCH" : "UNKNOWN",
        bucketFromUrlMatchesEnv: parsed.bucket === envBucket,
        bucketFromUrlMatchesPublicUrl: parsed.bucket === bucketFromPublicUrl,
        clusterFromUrlMatchesConfigured: configuredCluster ? parsed.cluster === configuredCluster : null,
        recommendations: [
          parsed.bucket !== envBucket 
            ? `⚠️ Bucket mismatch: URL has "${parsed.bucket}" but env has "${envBucket}". System will use bucket from URL.`
            : "✅ Bucket names match",
          configuredCluster && parsed.cluster !== configuredCluster
            ? `⚠️ Cluster mismatch: URL has "${parsed.cluster}" but config has "${configuredCluster}". System will automatically correct this.`
            : configuredCluster
            ? "✅ Cluster matches configuration"
            : "ℹ️ No cluster configured to compare"
        ].filter(Boolean)
      } : {
        message: "Cannot analyze - URL pattern not recognized"
      }
    };

    // Generate corrected URL if cluster mismatch
    let correctedUrl: string | null = null;
    if (parsed && configuredCluster && parsed.cluster !== configuredCluster) {
      const protocol = fileUrl.startsWith('https') ? 'https' : 'http';
      correctedUrl = `${protocol}://${configuredCluster}.backblazeb2.com/file/${parsed.bucket}/${parsed.key}`;
    }

    return NextResponse.json({
      success: true,
      ...result,
      correctedUrl: correctedUrl || undefined,
      message: parsed 
        ? `✅ Extracted cluster "${parsed.cluster}" and bucket "${parsed.bucket}" from URL. ${parsed.bucket !== envBucket ? '⚠️ Bucket mismatch!' : ''} ${configuredCluster && parsed.cluster !== configuredCluster ? '⚠️ Cluster mismatch - will be auto-corrected!' : ''}`
        : "❌ Could not extract bucket/cluster from URL - check URL format"
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

