'use server';

import { revalidatePath } from 'next/cache';
import { saveSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { PublicAboutPageContent, ContactPageContent } from '@/lib/types';
import { uploadFileToVercelBlob } from './vercelBlob.actions';


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
      await saveSitePageContent('public-about', pageData);
    } else if (pageId === 'contact-us') {
      const imageFile = formData.get('contactPageImageFile') as File | null;
      const currentImageUrl = formData.get('currentImageUrl') as string | null;
      let newImageUrl = currentImageUrl;

      if (imageFile && imageFile.size > 0) {
        const blobFormData = new FormData();
        blobFormData.append('file', imageFile);
        const uploadResult = await uploadFileToVercelBlob(blobFormData);
        if (!uploadResult.success || !uploadResult.data?.url) {
          return { success: false, error: uploadResult.error || 'Could not upload contact page image.' };
        }
        newImageUrl = uploadResult.data.url;
      }
      
      const contactPageData: Omit<ContactPageContent, 'id' | 'updatedAt'> = {
          imageUrl: newImageUrl
      };
      
      await saveSitePageContent('contact-us', contactPageData);
    } else {
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

    revalidatePath(`/admin/pages/edit/${pageId}`);
    revalidatePath('/admin/pages');
    revalidatePath('/admin/docs');
    
    if (pageId === 'public-about') revalidatePath('/about');
    if (pageId === 'privacy-policy') revalidatePath('/privacy');
    if (pageId === 'terms-of-service') revalidatePath('/terms');
    if (pageId === 'refund-policy') revalidatePath('/refund-policy');
    if (pageId === 'contact-us') revalidatePath('/contact-us');
    
    if (pageId === 'about-rio') revalidatePath('/about-rio');
    if (pageId === 'business-model') revalidatePath('/business-model');
    if (pageId === 'developer-guide') revalidatePath('/developer-guide');
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error in updateSitePageContentAction for ${pageId}:`, error);
    return { success: false, error: error.message || 'Failed to update page content.' };
  }
}
