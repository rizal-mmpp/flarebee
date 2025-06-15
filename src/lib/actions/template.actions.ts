
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
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Template } from '@/lib/types';
import { CATEGORIES } from '../constants';

const TEMPLATES_COLLECTION = 'templates';


// This type is for data going INTO Firestore.
// It's slightly different from the Template type which includes the resolved Category object.
export interface TemplateFirestoreData {
  title: string;
  title_lowercase: string;
  description: string;
  longDescription?: string;
  categoryId: string; // Store category ID
  price: number;
  tags: string[];
  techStack?: string[];
  imageUrl: string;
  dataAiHint?: string;
  previewUrl?: string;
  screenshots?: string[];
  downloadZipUrl: string;
  githubUrl?: string;
  author?: string;
  createdAt?: Timestamp; // For serverTimestamp
  updatedAt?: Timestamp; // For serverTimestamp
}


function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export async function saveTemplateAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; template?: Template }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string || undefined;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tags = parseStringToArray(formData.get('tags') as string | null);
    const techStack = parseStringToArray(formData.get('techStack') as string | null);
    const imageUrl = formData.get('previewImageUrl') as string || 'https://placehold.co/600x400.png';
    const dataAiHint = formData.get('dataAiHint') as string || undefined;
    const previewUrl = formData.get('previewUrl') as string || undefined;
    const downloadZipUrl = formData.get('downloadZipUrl') as string || '#';
    const githubUrl = formData.get('githubUrl') as string || undefined;

    if (!title || !description || !categoryId || isNaN(price) || !downloadZipUrl) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Download URL) or invalid price." };
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
      imageUrl,
      dataAiHint,
      previewUrl,
      downloadZipUrl,
      githubUrl,
      // createdAt and updatedAt will be set by serverTimestamp
    };

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // To return the full Template object, we fetch it back (or construct it carefully)
    const newTemplateSnapshot = await getDoc(docRef);
    const newTemplateData = newTemplateSnapshot.data();

    const newTemplate: Template = {
        id: docRef.id,
        ...templateData,
        category, // Use the resolved category object
        // Convert Timestamps to ISO strings for the Template type
        createdAt: (newTemplateData?.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: (newTemplateData?.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    };
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/templates');
    revalidatePath('/templates');
    revalidatePath('/'); 

    return { success: true, message: `Template "${newTemplate.title}" created successfully.`, template: newTemplate };
  } catch (error: any) {
    console.error("Error in saveTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to create template." };
  }
}

export async function updateTemplateAction(id: string, formData: FormData): Promise<{ success: boolean; message?: string; error?: string; template?: Partial<TemplateFirestoreData> }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string || undefined;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tags = parseStringToArray(formData.get('tags') as string | null);
    const techStack = parseStringToArray(formData.get('techStack') as string | null);
    const imageUrl = formData.get('previewImageUrl') as string || undefined; 
    const dataAiHint = formData.get('dataAiHint') as string || undefined;
    const previewUrl = formData.get('previewUrl') as string || undefined;
    const downloadZipUrl = formData.get('downloadZipUrl') as string || '#';
    const githubUrl = formData.get('githubUrl') as string || undefined;


    if (!id || !title || !description || !categoryId || isNaN(price) || !downloadZipUrl) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Download URL) or invalid price." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    const updateData: Partial<TemplateFirestoreData> = {
      title,
      title_lowercase: title.toLowerCase(),
      description,
      longDescription,
      categoryId,
      price,
      tags,
      techStack,
      dataAiHint,
      previewUrl,
      downloadZipUrl,
      githubUrl,
      // updatedAt will be set by serverTimestamp
    };
    if (imageUrl) updateData.imageUrl = imageUrl;

    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/templates');
    revalidatePath(`/templates/${id}`);
    revalidatePath('/templates');
    revalidatePath('/');

    return { success: true, message: `Template "${title}" updated successfully.`, template: updateData };
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

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/templates');
    revalidatePath('/templates');
    revalidatePath('/');

    return { success: true, message: `Template with ID ${id} deleted successfully.` };
  } catch (error: any) {
    console.error("Error in deleteTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to delete template." };
  }
}
