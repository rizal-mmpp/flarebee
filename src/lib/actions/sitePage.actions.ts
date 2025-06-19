
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
    
    if (pageId === 'privacy-policy') {
        revalidatePath('/privacy');
    } else if (pageId === 'terms-of-service') {
        revalidatePath('/terms');
    } else if (pageId === 'refund-policy') {
        revalidatePath('/refund-policy');
    } else if (pageId === 'public-about') { // Revalidate the new public about page
        revalidatePath('/about');
    } else if (pageId === 'about-rio') {
        revalidatePath('/about-rio');
    } else if (pageId === 'business-model') {
        revalidatePath('/business-model');
    } else if (pageId === 'developer-guide') {
        revalidatePath('/developer-guide');
    }
    
    revalidatePath('/admin/pages'); // General revalidation for admin pages list
    revalidatePath('/admin/docs'); // Revalidate admin docs index if content from there is edited


    return { success: true };
  } catch (error: any) {
    console.error(`Error in updateSitePageContentAction for ${pageId}:`, error);
    return { success: false, error: error.message || 'Failed to update page content.' };
  }
}

