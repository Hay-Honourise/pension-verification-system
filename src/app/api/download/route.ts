import { NextRequest, NextResponse } from "next/server";
import { generateDownloadUrl } from "@/lib/backblaze";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || undefined;

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
      
      // Extract bucket info for debugging
      const backblazePattern = /https?:\/\/[^\/]+\/file\/([^\/]+)\/(.+)/;
      const match = fileUrl.match(backblazePattern);
      const bucketFromUrl = match ? match[1] : null;
      const keyFromUrl = match ? match[2] : null;
      
      // Fallback: return the original URL if presigned URL generation fails
      console.log('Falling back to original URL');
      return NextResponse.json({ 
        url: fileUrl,
        fallback: true,
        warning: "Using direct URL (less secure)",
        error: generateError instanceof Error ? generateError.message : 'Unknown error',
        debug: {
          bucketFromUrl,
          keyFromUrl,
          envBucket: process.env.S3_BUCKET,
          message: bucketFromUrl && bucketFromUrl !== process.env.S3_BUCKET
            ? `Bucket mismatch: URL uses "${bucketFromUrl}" but env uses "${process.env.S3_BUCKET}"`
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
