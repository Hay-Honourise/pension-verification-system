import B2 from 'backblaze-b2';

const B2_KEY_ID = process.env.B2_KEY_ID || '';
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || '';
const B2_BUCKET_ID = process.env.B2_BUCKET_ID || '';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || '';

// Debug environment variables
console.log('B2 Configuration:', {
  B2_KEY_ID: B2_KEY_ID ? 'SET' : 'MISSING',
  B2_APPLICATION_KEY: B2_APPLICATION_KEY ? 'SET' : 'MISSING',
  B2_BUCKET_ID: B2_BUCKET_ID || 'MISSING',
  B2_BUCKET_NAME: B2_BUCKET_NAME || 'MISSING'
});

if (!B2_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET_ID || !B2_BUCKET_NAME) {
  console.error('Missing B2 credentials');
  console.error('Environment variables:', {
    B2_KEY_ID: B2_KEY_ID ? 'SET' : 'MISSING',
    B2_APPLICATION_KEY: B2_APPLICATION_KEY ? 'SET' : 'MISSING',
    B2_BUCKET_ID: B2_BUCKET_ID || 'MISSING',
    B2_BUCKET_NAME: B2_BUCKET_NAME || 'MISSING'
  });
}

const b2 = new B2({
  applicationKeyId: B2_KEY_ID,
  applicationKey: B2_APPLICATION_KEY,
});

export async function authenticate() {
  try {
    const response = await b2.authorize();
    return {
      authToken: response.data.authorizationToken,
      downloadUrl: response.data.downloadUrl,
      apiUrl: response.data.apiUrl,
    };
  } catch (error) {
    console.error('B2 authentication failed:', error);
    throw new Error('B2 authentication failed');
  }
}

export async function getUploadUrl() {
  try {
    const auth = await authenticate();
    const response = await b2.getUploadUrl({
      bucketId: B2_BUCKET_ID,
    });
    return {
      uploadUrl: response.data.uploadUrl,
      authorizationToken: response.data.authorizationToken,
    };
  } catch (error) {
    console.error('Failed to get upload URL:', error);
    throw new Error('Failed to get upload URL');
  }
}

export async function uploadFile(fileBuffer: Buffer, fileName: string, contentType: string) {
  try {
    console.log('uploadFile called with:', { fileName, contentType, bufferSize: fileBuffer.length });
    
    if (!B2_BUCKET_ID) throw new Error('B2_BUCKET_ID is not configured');
    
    console.log('Getting upload URL...');
    const uploadData = await getUploadUrl();
    console.log('Upload URL obtained:', { uploadUrl: uploadData.uploadUrl ? 'SET' : 'MISSING', authToken: uploadData.authorizationToken ? 'SET' : 'MISSING' });
    
    console.log('Uploading file to B2...');
    const response = await b2.uploadFile({
      uploadUrl: uploadData.uploadUrl!,
      uploadAuthToken: uploadData.authorizationToken!,
      fileName: fileName,
      data: fileBuffer,
      mime: contentType,
    });
    
    console.log('Upload successful:', { fileId: response.data.fileId, fileName: response.data.fileName });
    
    return {
      fileId: response.data.fileId,
      fileName: response.data.fileName,
      contentType: response.data.contentType,
      contentLength: response.data.contentLength,
      contentSha1: response.data.contentSha1,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    console.error('Upload error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileName,
      contentType,
      bufferSize: fileBuffer.length
    });
    throw new Error('Upload failed');
  }
}

export async function deleteFile(fileId: string, fileName: string) {
  try {
    const auth = await authenticate();
    await b2.deleteFileVersion({
      fileId: fileId,
      fileName: fileName,
    });
    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error('Delete failed');
  }
}

export async function copyFile(sourceFileId: string, newFileName: string) {
  try {
    console.log('Copying file:', { sourceFileId, newFileName });
    
    // For now, we'll skip the copy step and just return the original file info
    // This is a temporary solution since the backblaze-b2 package doesn't have copyFileVersion
    // In production, you might want to implement proper file copying or use a different approach
    
    return {
      fileId: sourceFileId, // Use the original file ID
      fileName: newFileName,
    };
  } catch (error) {
    console.error('Copy failed:', error);
    throw new Error('Copy failed');
  }
}

export async function getSignedUrl(fileName: string, validitySeconds = 3600) {
  try {
    const auth = await authenticate();
    const response = await b2.getDownloadAuthorization({
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: validitySeconds,
    });
    return `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${fileName}?Authorization=${response.data.authorizationToken}`;
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    throw new Error('Failed to get signed URL');
  }
}

export async function generateDownloadUrl(fileUrl: string, filename?: string) {
  try {
    console.log('Generating B2 download URL for:', fileUrl);
    
    // Check if it's a Backblaze B2 URL
    if (fileUrl.includes('backblazeb2.com')) {
      // Extract the file path from the URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/').filter(part => part);
      
      console.log('URL path parts:', pathParts);
      
      // For Backblaze B2 URLs, the structure is usually:
      // https://f005.backblazeb2.com/file/bucket-name/path/to/file
      
      // If the URL already has an Authorization parameter, it's already signed, return it
      if (url.searchParams.has('Authorization')) {
        console.log('URL already has authorization, returning as-is');
        return fileUrl;
      }
      
      // Extract full path including bucket name
      const fileIndex = pathParts.findIndex(part => part === 'file');
      if (fileIndex === -1) {
        throw new Error('Could not find "file" in URL path');
      }
      
      // Get everything after 'file' - this includes bucket name and file path
      const pathAfterFile = pathParts.slice(fileIndex + 1);
      
      if (pathAfterFile.length === 0) {
        throw new Error('Could not extract file path from URL');
      }
      
      // The first part is the bucket name, the rest is the file path
      const bucketName = pathAfterFile[0];
      const filePath = pathAfterFile.slice(1).join('/');
      
      console.log('Extracted bucket:', bucketName);
      console.log('Extracted file path:', filePath);
      
      if (!filePath) {
        throw new Error('Could not extract file path from URL');
      }
      
      // Generate B2 download authorization
      const auth = await authenticate();
      const response = await b2.getDownloadAuthorization({
        bucketId: B2_BUCKET_ID,
        fileNamePrefix: filePath,
        validDurationInSeconds: 3600, // 1 hour
      });
      
      // Build the download URL using the auth's download URL
      // Format: {downloadUrl}/file/{bucket}/{filePath}?Authorization={token}
      const signedUrl = `${auth.downloadUrl}/file/${bucketName}/${filePath}?Authorization=${response.data.authorizationToken}`;
      
      console.log('Generated B2 signed URL:', signedUrl);
      
      return signedUrl;
    } else {
      // For non-Backblaze URLs, return as-is
      console.log('Non-Backblaze URL, returning as-is');
      return fileUrl;
    }
  } catch (error) {
    console.error('Error generating download URL:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileUrl,
      filename
    });
    // Return the original URL as fallback
    console.log('Returning original URL as fallback');
    return fileUrl;
  }
}

export function getPublicUrl(fileName: string) {
  return `https://f003.backblazeb2.com/file/${B2_BUCKET_NAME}/${fileName}`;
}

export async function listFiles(prefix: string, max = 100) {
  try {
    const auth = await authenticate();
    const response = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      startFileName: prefix,
      maxFileCount: max,
    });
    return (response.data.files || []).map(f => ({ key: f.fileName, size: f.size }));
  } catch (error) {
    console.error('List files failed:', error);
    throw new Error('List files failed');
  }
}

export async function testS3Connection() {
  try {
    console.log('Testing B2 connection...');
    console.log('Bucket ID:', B2_BUCKET_ID);
    console.log('Bucket Name:', B2_BUCKET_NAME);
    
    // Validate configuration first
    if (!B2_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET_ID || !B2_BUCKET_NAME) {
      return {
        success: false,
        error: 'Missing required environment variables',
        details: {
          B2_KEY_ID: B2_KEY_ID ? 'SET' : 'MISSING',
          B2_APPLICATION_KEY: B2_APPLICATION_KEY ? 'SET' : 'MISSING',
          B2_BUCKET_ID: B2_BUCKET_ID || 'MISSING',
          B2_BUCKET_NAME: B2_BUCKET_NAME || 'MISSING'
        }
      };
    }
    
    // Test basic connection by authenticating
    const auth = await authenticate();
    console.log('B2 authentication successful');
    
    // Test listing files
    const files = await listFiles('', 1);
    console.log('B2 connection successful');
    
    return { 
      success: true, 
      message: 'B2 connection working',
      configuration: {
        bucketId: B2_BUCKET_ID,
        bucketName: B2_BUCKET_NAME,
        downloadUrl: auth.downloadUrl,
        apiUrl: auth.apiUrl
      }
    };
  } catch (error) {
    console.error('B2 connection failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      configuration: {
        bucketId: B2_BUCKET_ID,
        bucketName: B2_BUCKET_NAME
      }
    };
  }
}

