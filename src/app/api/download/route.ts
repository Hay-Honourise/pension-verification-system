import { NextRequest, NextResponse } from "next/server";
import { generateDownloadUrl } from "@/lib/backblaze";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || undefined;

    console.log("ENV CHECK:", {
      keyId: process.env.B2_KEY_ID,
      appKey: process.env.B2_APPLICATION_KEY ? "✅" : "❌",
      bucketName: process.env.B2_BUCKET_NAME,
      bucketId: process.env.B2_BUCKET_ID,
      endpoint: process.env.B2_ENDPOINT
    });
    

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(fileUrl);
    } catch {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Optional: Add your own authorization checks here (e.g., user/session/course access)
    // For now, we'll rely on the fact that the user is authenticated to access the dashboard

    try {
      const signedUrl = await generateDownloadUrl(fileUrl, filename);
      return NextResponse.json({ url: signedUrl });
    } catch (generateError) {
      console.error('Failed to generate presigned URL:', generateError);
      
      // Extract cluster, bucket, and key info for debugging
      const backblazePattern = /https?:\/\/([^\/]+)\/file\/([^\/]+)\/(.+)/;
      const match = fileUrl.match(backblazePattern);
      
      let clusterFromUrl: string | null = null;
      let bucketFromUrl: string | null = null;
      let keyFromUrl: string | null = null;
      
      if (match) {
        const hostname = match[1];
        const clusterMatch = hostname.match(/^([a-z0-9]+)\.backblazeb2\.com$/i);
        clusterFromUrl = clusterMatch ? clusterMatch[1].toLowerCase() : hostname;
        bucketFromUrl = match[2];
        keyFromUrl = match[3];
      }
      
      // Extract configured cluster
      let configuredCluster: string | null = null;
      const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
      if (publicBaseUrl) {
        try {
          const urlObj = new URL(publicBaseUrl);
          const clusterMatch = urlObj.hostname.match(/^([a-z0-9]+)\.backblazeb2\.com$/i);
          configuredCluster = clusterMatch ? clusterMatch[1].toLowerCase() : null;
        } catch {
          // Ignore URL parsing errors
        }
      }
      
      // Fallback: return the original URL if presigned URL generation fails
      console.log('Falling back to original URL');
      return NextResponse.json({ 
        url: fileUrl,
        fallback: true,
        warning: "Using direct URL (less secure)",
        error: generateError instanceof Error ? generateError.message : 'Unknown error',
        debug: {
          clusterFromUrl,
          bucketFromUrl,
          keyFromUrl,
          configuredCluster,
          clusterMismatch: clusterFromUrl && configuredCluster && clusterFromUrl !== configuredCluster,
          envBucket: process.env.S3_BUCKET,
          publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
          message: bucketFromUrl && bucketFromUrl !== process.env.S3_BUCKET
            ? `Bucket mismatch: URL uses "${bucketFromUrl}" but env uses "${process.env.S3_BUCKET}"`
            : clusterFromUrl && configuredCluster && clusterFromUrl !== configuredCluster
            ? `Cluster mismatch: URL uses "${clusterFromUrl}" but config uses "${configuredCluster}"`
            : 'Check server logs for detailed error information'
        }
      });
    }
  } catch (error) {
    console.error("Download endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
