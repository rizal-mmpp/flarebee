
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
      } else if (typeof data.updatedAt === 'string') {
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
        darkThemePrimaryColor: data.darkThemePrimaryColor || DEFAULT_SETTINGS.darkThemePrimaryColor,
        darkThemeAccentColor: data.darkThemeAccentColor || DEFAULT_SETTINGS.darkThemeAccentColor,
        darkThemeBackgroundColor: data.darkThemeBackgroundColor || DEFAULT_SETTINGS.darkThemeBackgroundColor,
        contactPageImageUrl: data.contactPageImageUrl || null,
        contactAddress: data.contactAddress || DEFAULT_SETTINGS.contactAddress,
        contactPhone: data.contactPhone || DEFAULT_SETTINGS.contactPhone,
        contactEmail: data.contactEmail || DEFAULT_SETTINGS.contactEmail,
        updatedAt: updatedAtString,
      };
    }
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  } catch (error) {
    console.error("Error getting site settings:", error);
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  }
}

export async function updateSiteSettings(
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: SiteSettings }> {
  try {
    const currentSettings = await getSiteSettings();
    let newLogoUrl = currentSettings.logoUrl;
    let newFaviconUrl = currentSettings.faviconUrl;

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
    
    const faviconFile = formData.get('favicon') as File | null;
    if (faviconFile && faviconFile.size > 0) {
      const blobFormData = new FormData();
      blobFormData.append('file', faviconFile);
      const uploadResult = await uploadFileToVercelBlob(blobFormData);
      if (!uploadResult.success || !uploadResult.data?.url) {
        return { success: false, error: uploadResult.error || 'Could not upload the new favicon.' };
      }
      newFaviconUrl = uploadResult.data.url;
    }
    
    // Note: contactPageImageFile is now handled in sitePage.actions.ts

    const siteTitle = formData.get('siteTitle') as string || currentSettings.siteTitle;
    const themePrimaryColor = formData.get('themePrimaryColor') as string || currentSettings.themePrimaryColor;
    const themeAccentColor = formData.get('themeAccentColor') as string || currentSettings.themeAccentColor;
    const themeBackgroundColor = formData.get('themeBackgroundColor') as string || currentSettings.themeBackgroundColor;
    const darkThemePrimaryColor = formData.get('darkThemePrimaryColor') as string || currentSettings.darkThemePrimaryColor;
    const darkThemeAccentColor = formData.get('darkThemeAccentColor') as string || currentSettings.darkThemeAccentColor;
    const darkThemeBackgroundColor = formData.get('darkThemeBackgroundColor') as string || currentSettings.darkThemeBackgroundColor;
    
    const contactAddress = formData.get('contactAddress') as string || currentSettings.contactAddress;
    const contactPhone = formData.get('contactPhone') as string || currentSettings.contactPhone;
    const contactEmail = formData.get('contactEmail') as string || currentSettings.contactEmail;


    const settingsDataForFirestore: Omit<SiteSettings, 'id' | 'updatedAt' | 'contactPageImageUrl'> & { updatedAt: any, contactPageImageUrl?: string | null } = {
      siteTitle,
      logoUrl: newLogoUrl,
      faviconUrl: newFaviconUrl,
      themePrimaryColor,
      themeAccentColor,
      themeBackgroundColor,
      darkThemePrimaryColor,
      darkThemeAccentColor,
      darkThemeBackgroundColor,
      contactAddress,
      contactPhone,
      contactEmail,
      updatedAt: serverTimestamp(),
    };

    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    await setDoc(settingsRef, settingsDataForFirestore, { merge: true });

    try {
      const globalsCssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
      let cssContent = await fs.readFile(globalsCssPath, 'utf-8');
      cssContent = cssContent.replace(/(:root\s*{[^}]*?--primary:\s*)[\d\s%]+(;)/s, `$1${themePrimaryColor}$2`);
      cssContent = cssContent.replace(/(:root\s*{[^}]*?--accent:\s*)[\d\s%]+(;)/s, `$1${themeAccentColor}$2`);
      cssContent = cssContent.replace(/(:root\s*{[^}]*?--background:\s*)[\d\s%]+(;)/s, `$1${themeBackgroundColor}$2`);
      cssContent = cssContent.replace(/(\.dark\s*{[^}]*?--primary:\s*)[\d\s%]+(;)/s, `$1${darkThemePrimaryColor}$2`);
      cssContent = cssContent.replace(/(\.dark\s*{[^}]*?--accent:\s*)[\d\s%]+(;)/s, `$1${darkThemeAccentColor}$2`);
      cssContent = cssContent.replace(/(\.dark\s*{[^}]*?--background:\s*)[\d\s%]+(;)/s, `$1${darkThemeBackgroundColor}$2`);
      await fs.writeFile(globalsCssPath, cssContent, 'utf-8');
    } catch (cssError) {
      console.error("Error updating globals.css:", cssError);
    }

    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout'); 
    revalidatePath('/contact-us');

    const resultData: SiteSettings = {
        ...DEFAULT_SETTINGS, // start with defaults
        ...currentSettings, // override with current settings
        ...settingsDataForFirestore, // override with new settings
        id: MAIN_SETTINGS_DOC_ID,
        updatedAt: new Date().toISOString(),
    };

    return { success: true, data: resultData };
  } catch (error: any) {
    console.error("Error updating site settings:", error);
    return { success: false, error: error.message || 'Failed to update site settings.' };
  }
}
