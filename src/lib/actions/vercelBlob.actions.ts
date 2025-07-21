
'use server';

import { put, list, del, type PutBlobResult, type ListBlobResult, type ListBlobResultBlob } from '@vercel/blob'; // Added del and ListBlobResultBlob
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
    const blob = await put(file.name, file, {
      access: 'public',
    });
    return { success: true, data: blob };
  } catch (error: any) {
    console.error('Detailed error in uploadFileToVercelBlob:', error);
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

export async function deleteVercelBlobFile(url: string): Promise<{ success: boolean; error?: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: 'Vercel Blob environment variable not configured.' };
  }
  if (!url) {
    return { success: false, error: 'File URL is required for deletion.' };
  }
  try {
    await del(url);
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting blob at URL ${url}:`, error);
    return { success: false, error: error.message || `Failed to delete file at ${url}.` };
  }
}
