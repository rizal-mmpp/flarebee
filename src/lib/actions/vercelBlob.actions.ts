
'use server';

import { put, type PutBlobResult } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function uploadFileToVercelBlob(formData: FormData): Promise<{ success: boolean; data?: PutBlobResult; error?: string }> {
  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: 'Vercel Blob environment variable not configured.' };
  }

  try {
    // Ensure a unique filename, or use user-provided name if desired (be cautious with user input)
    // For simplicity, using original filename. Consider adding a unique prefix/suffix in production.
    const blob = await put(file.name, file, {
      access: 'public', // Make the blob publicly accessible
      // Optionally, add a folder structure: `pathname: templates/${file.name}`
    });

    return { success: true, data: blob };
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    // Check for specific Vercel Blob error structure if available
    let errorMessage = 'Failed to upload file.';
    if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
