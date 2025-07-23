// This file is obsolete. The logic has been moved to src/lib/actions/erpnext/file.actions.ts.
// It is kept temporarily to avoid breaking any other potential dependencies but should be removed
// once the transition to ERPNext file storage is complete.
'use server';

import { put, list, del, type PutBlobResult, type ListBlobResult, type ListBlobResultBlob } from '@vercel/blob';

export async function uploadFileToVercelBlob(formData: FormData): Promise<{ success: boolean; data?: PutBlobResult; error?: string }> {
  // Deprecated
  return { success: false, error: 'This upload method is deprecated. Use ERPNext uploader.' };
}

export async function listVercelBlobFiles(options?: { limit?: number; cursor?: string; prefix?: string; }): Promise<{ success: boolean; data?: ListBlobResult; error?: string }> {
  // Deprecated
  return { success: false, error: 'This function is deprecated.' };
}

export async function deleteVercelBlobFile(url: string): Promise<{ success: boolean; error?: string }> {
  // Deprecated
  return { success: false, error: 'This function is deprecated.' };
}
