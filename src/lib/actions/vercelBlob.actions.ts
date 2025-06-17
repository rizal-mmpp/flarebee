
'use server';

import { put, list, type PutBlobResult, type ListBlobResult } from '@vercel/blob';
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

export async function listVercelBlobFiles(options?: { limit?: number; cursor?: string; prefix?: string; }): Promise<{ success: boolean; data?: ListBlobResult; error?: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: 'Vercel Blob environment variable not configured.' };
  }
  try {
    const result = await list({ // Pass options directly to the list call
        limit: options?.limit,
        cursor: options?.cursor,
        prefix: options?.prefix,
        // mode: 'folded', // To group files in "folders" if prefix is used. Optional.
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error listing files from Vercel Blob:', error);
    return { success: false, error: error.message || 'Failed to list files.' };
  }
}
