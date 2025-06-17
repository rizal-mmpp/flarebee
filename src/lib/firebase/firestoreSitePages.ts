
'use client'; // Or 'use server' if only used in server actions/components that are server-only

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { SitePage } from '@/lib/types';

const SITE_PAGES_COLLECTION = 'sitePages';

export async function getSitePageContent(pageId: string): Promise<SitePage | null> {
  try {
    const pageRef = doc(db, SITE_PAGES_COLLECTION, pageId);
    const pageSnap = await getDoc(pageRef);

    if (pageSnap.exists()) {
      const data = pageSnap.data();
      return {
        id: pageSnap.id,
        title: data.title || '',
        content: data.content || '',
        updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
      } as SitePage;
    }
    // If page doesn't exist, return a default structure or null
    // For a CMS, you might want to return a default title for new pages
    return { id: pageId, title: 'New Page', content: `# ${pageId.replace(/-/g, ' ')}\n\nEnter content here.`, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error(`Error getting site page content for ${pageId}:`, error);
    // Fallback to a default structure on error as well to prevent crashes
    return { id: pageId, title: 'Error Loading Page', content: 'Could not load content.', updatedAt: new Date().toISOString() };
  }
}

export async function saveSitePageContent(pageId: string, title: string, content: string): Promise<void> {
  try {
    const pageRef = doc(db, SITE_PAGES_COLLECTION, pageId);
    await setDoc(pageRef, {
      title,
      content,
      updatedAt: serverTimestamp(),
    }, { merge: true }); // Use merge:true to create or update
  } catch (error) {
    console.error(`Error saving site page content for ${pageId}:`, error);
    throw error; // Re-throw to be handled by the server action
  }
}
