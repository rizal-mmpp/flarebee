
'use server';

import { revalidatePath } from 'next/cache';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  Timestamp,
  // QueryDocumentSnapshot, // Not used directly in these server actions
  // DocumentData, // Not used directly in these server actions
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Template } from '@/lib/types'; // Using Template for return, TemplateFirestoreData for internal
import { CATEGORIES } from '../constants';

const TEMPLATES_COLLECTION = 'templates';


export interface TemplateFirestoreData {
  title: string;
  title_lowercase: string;
  description: string;
  longDescription?: string;
  categoryId: string; 
  price: number;
  tags: string[];
  techStack?: string[];
  imageUrl: string; // This will now store the Vercel Blob URL
  dataAiHint?: string;
  previewUrl?: string;
  screenshots?: string[];
  downloadZipUrl: string;
  githubUrl?: string;
  author?: string;
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}


function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

// Note: The `previewImageUrl` from FormData is the Vercel Blob URL.
// It's saved as `imageUrl` in Firestore.
export async function saveTemplateAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; templateId?: string }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string || undefined;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tags = parseStringToArray(formData.get('tags') as string | null);
    const techStack = parseStringToArray(formData.get('techStack') as string | null);
    const imageUrlFromBlob = formData.get('previewImageUrl') as string; // This is the Vercel Blob URL
    const dataAiHint = formData.get('dataAiHint') as string || undefined;
    const previewUrl = formData.get('previewUrl') as string || undefined;
    const downloadZipUrl = formData.get('downloadZipUrl') as string || '#';
    const githubUrl = formData.get('githubUrl') as string || undefined;

    if (!title || !description || !categoryId || isNaN(price) || !downloadZipUrl || !imageUrlFromBlob) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Download URL, Image URL) or invalid price." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    const templateData: TemplateFirestoreData = {
      title,
      title_lowercase: title.toLowerCase(),
      description,
      longDescription,
      categoryId,
      price,
      tags,
      techStack,
      imageUrl: imageUrlFromBlob, // Use the Vercel Blob URL here
      dataAiHint,
      previewUrl,
      downloadZipUrl,
      githubUrl,
    };

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...templateData,
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
    const longDescription = formData.get('longDescription') as string || undefined;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tags = parseStringToArray(formData.get('tags') as string | null);
    const techStack = parseStringToArray(formData.get('techStack') as string | null);
    const imageUrlFromBlob = formData.get('previewImageUrl') as string; // This is the Vercel Blob URL (new or existing)
    const dataAiHint = formData.get('dataAiHint') as string || undefined;
    const previewUrl = formData.get('previewUrl') as string || undefined;
    const downloadZipUrl = formData.get('downloadZipUrl') as string || '#';
    const githubUrl = formData.get('githubUrl') as string || undefined;


    if (!id || !title || !description || !categoryId || isNaN(price) || !downloadZipUrl || !imageUrlFromBlob) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Download URL, Image URL) or invalid price." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    // Construct update data, only including imageUrl if it's explicitly provided
    // (which it always will be now, either new from blob or existing passed through)
    const updateData: Partial<TemplateFirestoreData> = {
      title,
      title_lowercase: title.toLowerCase(),
      description,
      longDescription,
      categoryId,
      price,
      tags,
      techStack,
      imageUrl: imageUrlFromBlob, // Always use the URL passed in formData
      dataAiHint,
      previewUrl,
      downloadZipUrl,
      githubUrl,
    };

    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
        ...updateData,
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
    // Note: This does not delete the image from Vercel Blob.
    // You might want to implement a separate mechanism for that if needed.
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
