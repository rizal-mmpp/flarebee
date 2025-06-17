
'use server';

import { revalidatePath } from 'next/cache';
import { saveSitePageContent } from '@/lib/firebase/firestoreSitePages';

export async function updateSitePageContentAction(
  pageId: string,
  title: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pageId || typeof pageId !== 'string' || pageId.trim() === '') {
      return { success: false, error: 'Page ID is required.' };
    }
    if (typeof title !== 'string') {
      return { success: false, error: 'Title must be a string.' };
    }
    if (typeof content !== 'string') {
      return { success: false, error: 'Content must be a string.' };
    }

    await saveSitePageContent(pageId, title, content);

    // Revalidate paths where this content might be displayed
    revalidatePath(`/admin/pages/edit/${pageId}`);
    // Assuming pageId might be used directly in public paths e.g. /privacy-policy
    // If you have a mapping (e.g. pageId 'privacy-policy' maps to path '/privacy'), adjust accordingly.
    // For now, let's assume a simple mapping or common paths.
    if (pageId === 'privacy-policy') {
        revalidatePath('/privacy');
    } else if (pageId === 'terms-of-service') {
        revalidatePath('/terms');
    }
    // General revalidation for admin pages list might also be good
    revalidatePath('/admin/pages');


    return { success: true };
  } catch (error: any) {
    console.error(`Error in updateSitePageContentAction for ${pageId}:`, error);
    return { success: false, error: error.message || 'Failed to update page content.' };
  }
}
