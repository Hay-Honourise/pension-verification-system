import { NextRequest, NextResponse } from "next/server";
import { generateDownloadUrl, testS3Connection } from "@/lib/backblaze";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "test-document.pdf";

    if (!fileUrl) {
      return NextResponse.json({ 
        error: "Missing url parameter",
        usage: "Add ?url=<your-backblaze-url>&filename=<optional-filename> to test"
      }, { status: 400 });
    }

    console.log('Testing download URL generation:', { fileUrl, filename });

    // First test S3 connection
    const connectionTest = await testS3Connection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: "S3 connection failed",
        connectionTest,
        message: "Fix S3 connection before testing downloads"
      }, { status: 500 });
    }

    const signedUrl = await generateDownloadUrl(fileUrl, filename);
    
    return NextResponse.json({ 
      success: true,
      originalUrl: fileUrl,
      signedUrl,
      filename,
      connectionTest,
      message: "Use the signedUrl in your browser to test the download"
    });
  } catch (error) {
    console.error("Test download error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate download link",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
