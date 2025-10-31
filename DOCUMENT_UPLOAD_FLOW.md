# Document Upload Flow During Pensioner Registration

This document explains how file uploads work during the pensioner registration process.

## 📋 Overview

The system supports **two storage options** for document uploads during registration:
1. **Local Storage** (`upload-document-local`) - Currently in use
2. **Backblaze B2** (`upload-document`) - Alternative for production

## 🔄 Current Flow (Local Storage)

### Step-by-Step Process

#### 1. **Frontend Upload Trigger** 
Location: `src/app/pensioner/register/page.tsx`

```typescript
const handleFileUpload = async (
  field: 'appointmentLetter' | 'idCard' | 'retirementLetter' | 'birthCertificate',
  file: File | null
) => {
  // Creates FormData with file, fileType, and pensionId
  // Uploads to: /api/pensioner/register/upload-document-local
}
```

**Fields Uploaded:**
- `file`: The actual File object
- `fileType`: Type of document (appointmentLetter, idCard, retirementLetter, birthCertificate)
- `pensionId`: Temporary pension ID for organization

---

#### 2. **Backend Processing**
Location: `src/app/api/pensioner/register/upload-document-local/route.ts`

**Validations:**
- ✅ File size: Maximum 10MB
- ✅ File types: JPG, PNG, GIF, PDF only
- ✅ Pension ID required

**File Naming Convention:**
```
{timestamp}-{pensionId}-{fileType}.{extension}
Example: 1757934541026-243544-idCard.jpg
```

**Storage Location:**
```
Local: /uploads/pensioner-documents/{filename}
URL: /uploads/pensioner-documents/{filename}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "local-{timestamp}",
    "fileName": "{timestamp}-{pensionId}-{fileType}.{ext}",
    "originalName": "original_filename.pdf",
    "fileType": "idCard",
    "contentType": "application/pdf",
    "size": 245678,
    "uploadedAt": "2025-01-30T...",
    "url": "/uploads/pensioner-documents/...",
    "localPath": "C:/.../uploads/pensioner-documents/..."
  }
}
```

---

#### 3. **Form Data Storage**
The uploaded file information is stored in the form state:

```typescript
interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}
```

Files are stored in React state and localStorage for persistence across page refreshes.

---

#### 4. **Final Registration Submission**
Location: `src/app/api/pensioner/register/route.ts`

When the registration form is submitted:

1. **Create Pensioner Record**: Personal and pension information saved to PostgreSQL
2. **Process Files**: Each uploaded file is:
   - Parsed from JSON string
   - File metadata saved to `pensionerfile` table
   - Linked to pensioner via `pensionerId`

**Database Record:**
```sql
INSERT INTO pensionerfile (
  id,              -- e.g., "idcard-{pensionerId}-{timestamp}"
  pensionerId,     -- Links to pensioner.id
  fileType,        -- "idcard", "appointmentLetter", etc.
  fileUrl,         -- Full URL to the file
  originalName,    -- Original filename
  publicId         -- File identifier
)
```

---

## 🗂️ Supported Document Types

| Document Type | Field Name | Database Value |
|--------------|------------|----------------|
| Appointment Letter | `appointmentLetter` | `appointmentLetter` |
| ID Card | `idCard` | `idcard` |
| Retirement Letter | `retirementLetter` | `retirement` |
| Birth Certificate | `birthCertificate` | `birthCertificate` |

---

## 🔄 Alternative: Backblaze B2 Upload

For production, there's an alternative endpoint that uploads directly to Backblaze B2:

### Differences:

**Endpoint:** `/api/pensioner/register/upload-document`

**Storage:**
- Files uploaded to Backblaze B2 bucket
- Path: `temp-registration/{timestamp}-{pensionId}/{fileType}-{timestamp}.{ext}`
- Public URL: `https://f003.backblazeb2.com/file/{bucket}/{path}`

**Benefits:**
- ✅ Scalable cloud storage
- ✅ No local server storage needed
- ✅ Better for production deployments
- ✅ Built-in redundancy

**Required Environment Variables:**
```env
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_application_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=your_bucket_name
S3_PUBLIC_BASE_URL=https://f003.backblazeb2.com/file/PensionerRegisgration
```

---

## 📊 Database Schema

### pensionerfile Table
```prisma
model pensionerfile {
  id           String    @id
  pensionerId  Int       // Links to pensioner.id
  fileType     String    // Document type
  fileUrl      String    // Full URL to file
  originalName String    // Original filename
  publicId     String    // Storage identifier
  uploadedById Int?      // Optional uploader ID
  createdAt    DateTime  @default(now())
  
  pensioner    pensioner @relation(...)
  @@index([pensionerId])
}
```

### pensioner Table
```prisma
model pensioner {
  id          Int                 @id
  // ... other fields
  
  pensionerfile pensionerfile[]   // One-to-many relationship
}
```

---

## 🔍 File Upload States

The UI tracks upload progress with these states:

```typescript
'idle'       // Initial state, no file
'uploading'  // Upload in progress
'success'    // Upload completed successfully
'error'      // Upload failed
```

Visual feedback shown to user during each state.

---

## 🔒 Security Features

1. **File Validation:**
   - Type whitelist (only allowed extensions)
   - Size limits (10MB max)
   - Content verification

2. **Naming Security:**
   - Timestamp + UUID prevents conflicts
   - No path traversal vulnerabilities

3. **Access Control:**
   - Files linked to specific pensioner
   - Requires authentication to view

---

## 🚀 Production Deployment

### Current Setup (Local Storage)
✅ Good for development
❌ Not suitable for serverless (Vercel)
❌ Files lost on server restart

### Recommended for Production (B2)
✅ Persistent cloud storage
✅ Works with serverless
✅ Scales automatically
✅ Built-in backup

### To Switch to B2:

1. Update the upload endpoint in `page.tsx`:
```typescript
// Change this line:
const response = await fetch('/api/pensioner/register/upload-document-local', {
  
// To this:
const response = await fetch('/api/pensioner/register/upload-document', {
```

2. Configure environment variables in Vercel
3. Test uploads work correctly

---

## 🐛 Troubleshooting

### Upload Fails
- Check file size (must be < 10MB)
- Verify file type (JPG, PNG, GIF, PDF only)
- Check network connection
- Review browser console for errors

### Files Not Visible After Upload
- Verify upload completed successfully
- Check localStorage for saved file data
- Ensure registration form completed

### Missing Files After Registration
- Files may be in temp location
- Check database `pensionerfile` records
- Verify file URLs are accessible

---

## 📝 Summary

**Current Implementation:**
- Local file storage during registration
- Files saved in `/uploads/pensioner-documents/`
- Metadata stored in PostgreSQL `pensionerfile` table
- Files linked to pensioner via `pensionerId`

**Recommendation:**
Switch to Backblaze B2 for production deployment on Vercel for better reliability and scalability.

