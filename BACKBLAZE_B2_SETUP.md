# Backblaze B2 Setup Instructions

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# Backblaze B2 S3-Compatible Configuration
S3_ACCESS_KEY_ID="your_backblaze_access_key_id"
S3_SECRET_ACCESS_KEY="your_backblaze_secret_access_key"
S3_BUCKET="your_bucket_name"
S3_PUBLIC_BASE_URL="https://f003.backblazeb2.com/file/your_bucket_name"
S3_ENDPOINT="https://s3.us-east-005.backblazeb2.com"
S3_REGION="us-east-005"
```

## CORS Configuration for Your B2 Bucket

To allow direct browser uploads to Backblaze B2, you need to configure CORS rules for your bucket. Use the Backblaze B2 CLI tool:

1. Install the B2 CLI: https://www.backblaze.com/b2/docs/quick_command_line.html

2. Create a CORS configuration file `b2CorsRules.json`:
```json
[
  {
    "corsRuleName": "allowAll",
    "allowedOrigins": ["*"],
    "allowedOperations": ["b2_upload_file", "b2_download_file_by_name"],
    "allowedHeaders": ["*"],
    "exposeHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

3. Apply the CORS rules to your bucket:
```bash
b2 update-bucket --corsRules "$(cat b2CorsRules.json)" your-bucket-name
```

## How to Get Your B2 S3 Credentials

1. **Access Key ID & Secret Access Key**: 
   - Go to your Backblaze B2 account
   - Navigate to "App Keys" section
   - Create a new application key with read/write permissions for your bucket
   - Copy the `keyID` (use as S3_ACCESS_KEY_ID) and `applicationKey` (use as S3_SECRET_ACCESS_KEY)

2. **Bucket Name**:
   - Go to "Buckets" section in your B2 account
   - Find your bucket and copy the `bucketName` (use as S3_BUCKET)

3. **Public Base URL**: 
   - Use the format: `https://f003.backblazeb2.com/file/your_bucket_name`
   - Replace `your_bucket_name` with your actual bucket name

4. **Endpoint & Region**: 
   - Use the endpoint URL provided by Backblaze for your region
   - Your region appears to be `us-east-005`

## File Storage Structure

The system will organize files in Backblaze B2 as follows:

- **Registration temp files**: `temp-registration/{timestamp}-{pensionId}/{fileType}-{timestamp}.{ext}`
- **Permanent files**: `pensioners/{pensionerId}/{fileType}-{timestamp}.{ext}`

## Security Notes

- Files are stored privately in Backblaze B2
- Access is controlled through signed URLs
- Temporary files are automatically cleaned up after successful registration
- File access requires proper authentication
