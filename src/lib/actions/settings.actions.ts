
'use server';

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { SiteSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants'; // Updated import
import { uploadFileToVercelBlob } from './vercelBlob.actions';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_COLLECTION = 'siteSettings';
const MAIN_SETTINGS_DOC_ID = 'main';

// DEFAULT_SETTINGS constant moved to constants.ts

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      return {
        id: MAIN_SETTINGS_DOC_ID,
        siteTitle: data.siteTitle || DEFAULT_SETTINGS.siteTitle,
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        themePrimaryColor: data.themePrimaryColor || DEFAULT_SETTINGS.themePrimaryColor,
        themeAccentColor: data.themeAccentColor || DEFAULT_SETTINGS.themeAccentColor,
        themeBackgroundColor: data.themeBackgroundColor || DEFAULT_SETTINGS.themeBackgroundColor,
        updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
      } as SiteSettings;
    }
    // If no settings document exists, return default settings
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error getting site settings:", error);
    // Fallback to default settings on error
    return DEFAULT_SETTINGS;
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

    const updatedSettingsData: Partial<SiteSettings> = {
      siteTitle,
      logoUrl: newLogoUrl,
      // faviconUrl handling can be added later if a separate upload is implemented
      themePrimaryColor,
      themeAccentColor,
      themeBackgroundColor,
      updatedAt: serverTimestamp(),
    };

    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    await setDoc(settingsRef, updatedSettingsData, { merge: true });

    // Update globals.css
    try {
      const globalsCssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
      let cssContent = await fs.readFile(globalsCssPath, 'utf-8');

      cssContent = cssContent.replace(/--primary:\s*[\d\s%]+;/g, `--primary: ${themePrimaryColor};`);
      cssContent = cssContent.replace(/--accent:\s*[\d\s%]+;/g, `--accent: ${themeAccentColor};`);
      cssContent = cssContent.replace(/--background:\s*[\d\s%]+;/g, `--background: ${themeBackgroundColor};`);
      
      // Also update dark mode variables if they exist, perhaps with a slightly modified version or the same.
      // For simplicity, we'll update them to the same values for now, but you might want a different logic.
      cssContent = cssContent.replace(/--primary:\s*[\d\s%]+;(\s*\/\*.*\*\/)?\s*}\s*\.dark\s*{/g, (match, p1, offset, string) => {
          // This regex is complex. A simpler approach for dark theme might be needed if this fails.
          // For now, let's assume we find and replace dark theme vars if they are clearly marked.
          // This part is tricky and might need manual adjustment or a more robust CSS parsing/modification strategy.
          // A simpler, more direct replacement for dark theme vars:
          const darkBlockRegex = /\.dark\s*{[^}]*--primary:\s*[\d\s%]+;[^}]*}/s;
          if (cssContent.match(darkBlockRegex)) {
               cssContent = cssContent.replace(/(\.dark\s*{[^}]*?--primary:\s*)[\d\s%]+(;[^}]*})/s, `$1${themePrimaryColor}$2`);
               cssContent = cssContent.replace(/(\.dark\s*{[^}]*?--accent:\s*)[\d\s%]+(;[^}]*})/s, `$1${themeAccentColor}$2`);
               cssContent = cssContent.replace(/(\.dark\s*{[^}]*?--background:\s*)[\d\s%]+(;[^}]*})/s, `$1${themeBackgroundColor}$2`);
          }
          return match; // Fallback if complex regex fails
      });


      await fs.writeFile(globalsCssPath, cssContent, 'utf-8');
    } catch (cssError) {
      console.error("Error updating globals.css:", cssError);
      // Non-fatal for the settings save, but log it.
    }

    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout'); // Revalidate all layouts that might use these settings

    return { success: true, data: { ...currentSettings, ...updatedSettingsData, id: 'main' } as SiteSettings };
  } catch (error: any) {
    console.error("Error updating site settings:", error);
    return { success: false, error: error.message || 'Failed to update site settings.' };
  }
}
