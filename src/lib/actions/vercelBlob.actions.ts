
'use server';

import { put, list, type PutBlobResult, type ListBlobResult } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function uploadFileToVercelBlob(formData: FormData): Promise<{ success: boolean; data?: PutBlobResult; error?: string }> {
  console.log('uploadFileToVercelBlob: Action started.');
  const file = formData.get('file') as File;

  if (!file) {
    console.error('uploadFileToVercelBlob: No file provided.');
    return { success: false, error: 'No file provided.' };
  }
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('uploadFileToVercelBlob: BLOB_READ_WRITE_TOKEN not configured.');
    return { success: false, error: 'Vercel Blob environment variable not configured.' };
  }

  console.log(`uploadFileToVercelBlob: Attempting to upload file "${file.name}" of size ${file.size} bytes.`);

  try {
    const blob = await put(file.name, file, {
      access: 'public',
    });
    console.log('uploadFileToVercelBlob: File uploaded successfully. URL:', blob.url);
    return { success: true, data: blob };
  } catch (error: any) {
    console.error('Detailed error in uploadFileToVercelBlob:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
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
    const result = await list({ 
        limit: options?.limit,
        cursor: options?.cursor,
        prefix: options?.prefix,
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error listing files from Vercel Blob:', error);
    return { success: false, error: error.message || 'Failed to list files.' };
  }
}
