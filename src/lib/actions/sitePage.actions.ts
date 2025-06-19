
'use server';

import { revalidatePath } from 'next/cache';
import { saveSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { PublicAboutPageContent } from '@/lib/types'; // Import the new type

// This server action now needs to handle both types of page content
export async function updateSitePageContentAction(
  pageId: string,
  formData: FormData 
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pageId || typeof pageId !== 'string' || pageId.trim() === '') {
      return { success: false, error: 'Page ID is required.' };
    }

    if (pageId === 'public-about') {
      const pageDataJson = formData.get('pageDataJson') as string | null;
      if (!pageDataJson) {
        return { success: false, error: 'Page data JSON is missing for public-about page.' };
      }
      let pageData: PublicAboutPageContent;
      try {
        pageData = JSON.parse(pageDataJson);
      } catch (e) {
        console.error("Error parsing pageDataJson:", e);
        return { success: false, error: 'Invalid JSON format for page data.' };
      }
      
      // Image uploads would be handled here if they were part of formData.
      // For now, we assume image URLs are already in pageData.
      // Example:
      // const heroImageFile = formData.get('heroImageFile') as File | null;
      // if (heroImageFile && heroImageFile.size > 0) {
      //   // ... upload file, get URL, update pageData.heroSection.imageUrl ...
      // }
      // (Repeat for other image fields)

      await saveSitePageContent('public-about', pageData);
    } else {
      // Handle standard markdown pages
      const title = formData.get('title') as string | null;
      const content = formData.get('content') as string | null;

      if (title === null || content === null) {
        return { success: false, error: 'Title and Content are required for standard pages.' };
      }
      if (typeof title !== 'string') {
        return { success: false, error: 'Title must be a string.' };
      }
      if (typeof content !== 'string') {
        return { success: false, error: 'Content must be a string.' };
      }
      await saveSitePageContent(pageId, title, content);
    }

    // Revalidate paths
    revalidatePath(`/admin/pages/edit/${pageId}`);
    revalidatePath('/admin/pages');
    revalidatePath('/admin/docs');
    
    // Specific public paths
    if (pageId === 'public-about') revalidatePath('/about');
    if (pageId === 'privacy-policy') revalidatePath('/privacy');
    if (pageId === 'terms-of-service') revalidatePath('/terms');
    if (pageId === 'refund-policy') revalidatePath('/refund-policy');
    
    // Specific admin doc view paths (if they are still used as separate pages)
    if (pageId === 'about-rio') revalidatePath('/about-rio');
    if (pageId === 'business-model') revalidatePath('/business-model');
    if (pageId === 'developer-guide') revalidatePath('/developer-guide');
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error in updateSitePageContentAction for ${pageId}:`, error);
    return { success: false, error: error.message || 'Failed to update page content.' };
  }
}
