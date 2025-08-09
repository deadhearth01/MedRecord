# MedRecord - Storage Bucket and AI Analysis Setup Guide

## Issue Identified
Your medical records are being saved to the database, but the actual files are not being uploaded to the Supabase storage bucket because of **missing Row Level Security (RLS) policies** on the `medical-files` bucket.

**Error**: `new row violates row-level security policy`

## Root Cause
The `medical-files` storage bucket exists but has no RLS policies that allow authenticated users to upload files.

## Fix Required: Create Storage Policies

### Step 1: Create Storage Policies in Supabase

1. Go to your Supabase project dashboard: <https://supabase.com/dashboard/projects>
2. Select your project (jkwfnmddgrcpflhntczq)
3. Navigate to **Authentication** > **Policies** in the left sidebar
4. Look for **storage.objects** table
5. Click **New Policy** and add these 3 policies:

#### Policy 1: Users can upload files

```sql
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### Policy 2: Users can view own files

```sql
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### Policy 3: Users can delete own files

```sql
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'medical-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Step 2: Alternative - SQL Editor Method

If the Policies UI doesn't work, use the **SQL Editor**:

1. Go to **SQL Editor** in Supabase dashboard
2. Run this complete script:

```sql
-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create upload policy
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create view policy  
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create delete policy
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'medical-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Step 3: Verify Bucket Configuration

Make sure your `medical-files` bucket allows these MIME types:

```text
image/jpeg
image/jpg
image/png
image/gif
image/webp
application/pdf
text/plain
text/csv
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

## Current Status

✅ **Storage bucket exists** - `medical-files` bucket is created
✅ **Database columns** - AI analysis fields are present
✅ **Code implementation** - Upload and AI analysis logic is complete
❌ **Storage policies** - Missing RLS policies (THIS IS THE ISSUE)

## Testing the Fix

1. Apply the RLS policies above
2. Login to your app and try uploading a file
3. Check browser console for detailed logs
4. Verify files appear in Supabase Storage dashboard under `medical-files/[user-id]/`

## Expected Behavior After Fix

1. **File Upload**: Files will upload successfully to `medical-files/[user-id]/filename`
2. **Database Records**: Medical records will include `file_path` and `file_url`
3. **AI Analysis**: Will process all file types and store results
4. **Error Handling**: Clear error messages for any remaining issues
