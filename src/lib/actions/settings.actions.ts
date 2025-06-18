
'use server';

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { SiteSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { uploadFileToVercelBlob } from './vercelBlob.actions';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_COLLECTION = 'siteSettings';
const MAIN_SETTINGS_DOC_ID = 'main';

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      let updatedAtString: string | null = null;
      if (data.updatedAt && typeof (data.updatedAt as Timestamp).toDate === 'function') {
        updatedAtString = (data.updatedAt as Timestamp).toDate().toISOString();
      } else if (typeof data.updatedAt === 'string') { // If it's already a string (e.g., from a previous save)
        updatedAtString = data.updatedAt;
      }

      return {
        id: MAIN_SETTINGS_DOC_ID,
        siteTitle: data.siteTitle || DEFAULT_SETTINGS.siteTitle,
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        themePrimaryColor: data.themePrimaryColor || DEFAULT_SETTINGS.themePrimaryColor,
        themeAccentColor: data.themeAccentColor || DEFAULT_SETTINGS.themeAccentColor,
        themeBackgroundColor: data.themeBackgroundColor || DEFAULT_SETTINGS.themeBackgroundColor,
        updatedAt: updatedAtString,
      };
    }
    // If no settings document exists, return default settings (updatedAt will be null)
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  } catch (error) {
    console.error("Error getting site settings:", error);
    // Fallback to default settings on error
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  }
}

export async function updateSiteSettings(
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: SiteSettings }> {
  try {
    const currentSettings = await getSiteSettings();
    let newLogoUrl = currentSettings.logoUrl;

    const logoFile = formData.get('logo') as File | null;

    if (logoFile && logoFile.size > 0) {
      const blobFormData = new FormData();
      blobFormData.append('file', logoFile);
      const uploadResult = await uploadFileToVercelBlob(blobFormData);

      if (!uploadResult.success || !uploadResult.data?.url) {
        return { success: false, error: uploadResult.error || 'Could not upload the new logo.' };
      }
      newLogoUrl = uploadResult.data.url;
    }

    const siteTitle = formData.get('siteTitle') as string || currentSettings.siteTitle;
    const themePrimaryColor = formData.get('themePrimaryColor') as string || currentSettings.themePrimaryColor;
    const themeAccentColor = formData.get('themeAccentColor') as string || currentSettings.themeAccentColor;
    const themeBackgroundColor = formData.get('themeBackgroundColor') as string || currentSettings.themeBackgroundColor;

    const settingsDataForFirestore: Omit<SiteSettings, 'id' | 'updatedAt'> & { updatedAt: any } = {
      siteTitle,
      logoUrl: newLogoUrl,
      faviconUrl: currentSettings.faviconUrl, // Keep existing favicon, not managed in this form
      themePrimaryColor,
      themeAccentColor,
      themeBackgroundColor,
      updatedAt: serverTimestamp(),
    };

    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    await setDoc(settingsRef, settingsDataForFirestore, { merge: true });

    // Update globals.css
    try {
      const globalsCssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
      let cssContent = await fs.readFile(globalsCssPath, 'utf-8');

      cssContent = cssContent.replace(/--primary:\s*[\d\s%]+;/g, `--primary: ${themePrimaryColor};`);
      cssContent = cssContent.replace(/--accent:\s*[\d\s%]+;/g, `--accent: ${themeAccentColor};`);
      cssContent = cssContent.replace(/--background:\s*[\d\s%]+;/g, `--background: ${themeBackgroundColor};`);
      
      // Also update dark mode variables
      const darkBlockRegex = /\.dark\s*{[^}]*?--primary:\s*[\d\s%]+;.*?--accent:\s*[\d\s%]+;.*?--background:\s*[\d\s%]+;[^}]*}/s;
      const darkBlockMatch = cssContent.match(darkBlockRegex);

      if (darkBlockMatch) {
        let darkBlockContent = darkBlockMatch[0];
        darkBlockContent = darkBlockContent.replace(/(--primary:\s*)[\d\s%]+(;)/g, `$1${themePrimaryColor}$2`);
        darkBlockContent = darkBlockContent.replace(/(--accent:\s*)[\d\s%]+(;)/g, `$1${themeAccentColor}$2`);
        darkBlockContent = darkBlockContent.replace(/(--background:\s*)[\d\s%]+(;)/g, `$1${themeBackgroundColor}$2`);
        cssContent = cssContent.replace(darkBlockRegex, darkBlockContent);
      }
      
      await fs.writeFile(globalsCssPath, cssContent, 'utf-8');
    } catch (cssError) {
      console.error("Error updating globals.css:", cssError);
      // Non-fatal for the settings save, but log it.
    }

    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout'); 

    // For the data returned to the client, ensure updatedAt is a string
    const resultData: SiteSettings = {
        id: MAIN_SETTINGS_DOC_ID,
        siteTitle: settingsDataForFirestore.siteTitle,
        logoUrl: settingsDataForFirestore.logoUrl,
        faviconUrl: settingsDataForFirestore.faviconUrl,
        themePrimaryColor: settingsDataForFirestore.themePrimaryColor,
        themeAccentColor: settingsDataForFirestore.themeAccentColor,
        themeBackgroundColor: settingsDataForFirestore.themeBackgroundColor,
        updatedAt: new Date().toISOString(), // Provide an immediate, serializable timestamp
    };

    return { success: true, data: resultData };
  } catch (error: any) {
    console.error("Error updating site settings:", error);
    return { success: false, error: error.message || 'Failed to update site settings.' };
  }
}
