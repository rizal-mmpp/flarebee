
'use server';

import { revalidatePath } from 'next/cache';
import {
  addDoc,
  collection,
  doc,
  // getDoc, // No longer used directly here, getTemplateByIdFromFirestore is used by pages
  serverTimestamp,
  updateDoc,
  deleteDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
// Template type is used for return types or general reference, not for direct Firestore data structure here.
// import type { Template } from '@/lib/types'; 
import { CATEGORIES } from '../constants';

const TEMPLATES_COLLECTION = 'templates';

// This interface defines the structure of data as it's being prepared to be sent to Firestore.
// Optional fields are marked with '?'
export interface TemplateFirestoreData {
  title: string;
  title_lowercase: string;
  description: string;
  longDescription?: string; // Optional
  categoryId: string; 
  price: number;
  tags: string[];
  techStack?: string[]; // Optional
  imageUrl: string;
  dataAiHint?: string; // Optional
  previewUrl?: string; // Optional
  screenshots?: string[]; // Optional, not managed by this form directly
  downloadZipUrl: string; // Will default to '#' if not provided
  githubUrl?: string; // Optional
  author?: string; // Optional, not managed by this form
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}


function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export async function saveTemplateAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; templateId?: string }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tagsInput = formData.get('tags') as string | null;
    const imageUrlFromBlob = formData.get('previewImageUrl') as string; // This is the Vercel Blob URL
    const downloadZipUrlInput = (formData.get('downloadZipUrl') as string)?.trim() || '#';


    if (!title || !description || !categoryId || isNaN(price) || !tagsInput || !imageUrlFromBlob) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Tags, Image URL)." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    const dataToSave: Partial<TemplateFirestoreData> = { // Use Partial because not all fields from interface are set initially
      title,
      title_lowercase: title.toLowerCase(),
      description,
      categoryId,
      price,
      tags: parseStringToArray(tagsInput),
      imageUrl: imageUrlFromBlob,
      downloadZipUrl: downloadZipUrlInput, // Will be '#' or a URL
    };

    const longDescriptionValue = (formData.get('longDescription') as string)?.trim();
    if (longDescriptionValue) {
      dataToSave.longDescription = longDescriptionValue;
    }

    const techStackValue = formData.get('techStack') as string | null;
    const parsedTechStack = parseStringToArray(techStackValue);
    if (parsedTechStack.length > 0) {
      dataToSave.techStack = parsedTechStack;
    }
    
    const dataAiHintValue = (formData.get('dataAiHint') as string)?.trim();
    if (dataAiHintValue) {
      dataToSave.dataAiHint = dataAiHintValue;
    }

    const previewUrlValue = (formData.get('previewUrl') as string)?.trim();
    if (previewUrlValue) {
      dataToSave.previewUrl = previewUrlValue;
    }
    
    const githubUrlValue = (formData.get('githubUrl') as string)?.trim();
    if (githubUrlValue) {
      dataToSave.githubUrl = githubUrlValue;
    }

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...dataToSave, // Spread the conditionally built object
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    revalidatePath('/admin/templates');
    revalidatePath('/admin/dashboard');
    revalidatePath('/templates');
    revalidatePath('/'); 

    return { success: true, message: `Template "${title}" created successfully.`, templateId: docRef.id };
  } catch (error: any) {
    console.error("Error in saveTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to create template." };
  }
}

export async function updateTemplateAction(id: string, formData: FormData): Promise<{ success: boolean; message?: string; error?: string; templateId?: string }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tagsInput = formData.get('tags') as string | null;
    const imageUrlFromBlob = formData.get('previewImageUrl') as string; 
    const downloadZipUrlInput = (formData.get('downloadZipUrl') as string)?.trim() || '#';

    if (!id || !title || !description || !categoryId || isNaN(price) || !tagsInput || !imageUrlFromBlob) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Tags, Image URL)." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    const dataToUpdate: Partial<TemplateFirestoreData> = {
      title,
      title_lowercase: title.toLowerCase(),
      description,
      categoryId,
      price,
      tags: parseStringToArray(tagsInput),
      imageUrl: imageUrlFromBlob,
      downloadZipUrl: downloadZipUrlInput,
    };

    const longDescriptionValue = (formData.get('longDescription') as string)?.trim();
    if (longDescriptionValue !== undefined) { // Check for undefined to allow clearing the field
      dataToUpdate.longDescription = longDescriptionValue || null; // Set to null if empty string, to remove field or set as null
    }


    const techStackValue = formData.get('techStack') as string | null;
    const parsedTechStack = parseStringToArray(techStackValue);
    // For updates, if parsedTechStack is empty, we might want to store an empty array to clear previous stack
    dataToUpdate.techStack = parsedTechStack; 
    
    const dataAiHintValue = (formData.get('dataAiHint') as string)?.trim();
     if (dataAiHintValue !== undefined) {
      dataToUpdate.dataAiHint = dataAiHintValue || null;
    }

    const previewUrlValue = (formData.get('previewUrl') as string)?.trim();
    if (previewUrlValue !== undefined) {
      dataToUpdate.previewUrl = previewUrlValue || null;
    }
    
    const githubUrlValue = (formData.get('githubUrl') as string)?.trim();
    if (githubUrlValue !== undefined) {
      dataToUpdate.githubUrl = githubUrlValue || null;
    }
    
    // Filter out null properties before sending to Firestore if you prefer fields to be absent vs. null
    // For example:
    // Object.keys(dataToUpdate).forEach(key => 
    //   (dataToUpdate as any)[key] === null && delete (dataToUpdate as any)[key]
    // );
    // However, sending explicit nulls is also fine and can be meaningful to clear a field.
    // Firestore does not store `undefined` values, but it does store `null`.
    // If a field is set to `null`, it exists in the document. If omitted, it doesn't.
    // Let's be explicit with null for clearing fields, or omit if it's truly optional and should be absent.
    // For simplicity and to match Firestore's behavior with `undefined` (which is to strip it),
    // we can rely on JavaScript's behavior or explicitly delete keys if their value is empty string and should be omitted.
    // The current approach (assigning empty string or null if intended to clear) is fine.
    // The primary fix was not passing `undefined` from `|| undefined` for longDescription.

    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
    });

    revalidatePath('/admin/templates');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/templates/${id}`);
    revalidatePath('/templates');
    revalidatePath('/');

    return { success: true, message: `Template "${title}" updated successfully.`, templateId: id };
  } catch (error: any) {
    console.error("Error in updateTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to update template." };
  }
}

export async function deleteTemplateAction(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Template ID is required for deletion." };
    }
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));

    revalidatePath('/admin/templates');
    revalidatePath('/admin/dashboard');
    revalidatePath('/templates');
    revalidatePath('/');

    return { success: true, message: `Template with ID ${id} deleted successfully.` };
  } catch (error: any) {
    console.error("Error in deleteTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to delete template." };
  }
}
