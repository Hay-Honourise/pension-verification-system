declare module 'backblaze-b2' {
  interface B2Config {
    applicationKeyId: string;
    applicationKey: string;
  }

  interface B2Response {
    data: {
      authorizationToken?: string;
      downloadUrl?: string;
      apiUrl?: string;
      fileId?: string;
      fileName?: string;
      contentType?: string;
      contentLength?: number;
      contentSha1?: string;
      uploadUrl?: string;
      files?: any[];
    };
  }

  interface B2UploadOptions {
    uploadUrl: string;
    uploadAuthToken: string;
    fileName: string;
    data: Buffer;
    mime: string;
  }

  interface B2DeleteOptions {
    fileId: string;
    fileName: string;
  }

  interface B2CopyOptions {
    sourceFileId: string;
    destinationBucketId: string;
    fileName: string;
  }

  interface B2DownloadAuthOptions {
    bucketId: string;
    fileNamePrefix: string;
    validDurationInSeconds: number;
  }

  interface B2ListOptions {
    bucketId: string;
    prefix?: string;
    maxFileCount?: number;
    startFileName?: string;
    delimiter?: string;
  }

  class B2 {
    constructor(config: B2Config);
    authorize(): Promise<B2Response>;
    getUploadUrl(options: { bucketId: string }): Promise<B2Response>;
    uploadFile(options: B2UploadOptions): Promise<B2Response>;
    deleteFileVersion(options: B2DeleteOptions): Promise<B2Response>;
    copyFileVersion(options: B2CopyOptions): Promise<B2Response>;
    getDownloadAuthorization(options: B2DownloadAuthOptions): Promise<B2Response>;
    listFileNames(options: B2ListOptions): Promise<B2Response>;
  }

  export = B2;
}
