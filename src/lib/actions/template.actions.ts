
'use server';

import { revalidatePath } from 'next/cache';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { CATEGORIES } from '../constants';
import { uploadFileToVercelBlob } from './vercelBlob.actions'; // Import the action

const TEMPLATES_COLLECTION = 'templates'; // Define the constant here

export interface TemplateFirestoreData {
  title: string;
  title_lowercase: string;
  description: string;
  longDescription?: string | null;
  categoryId: string; 
  price: number;
  tags: string[];
  techStack?: string[] | null; 
  imageUrl: string;
  dataAiHint?: string | null;
  previewUrl?: string | null;
  screenshots?: string[]; 
  downloadZipUrl: string;
  githubUrl?: string | null;
  author?: string;
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}


function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export async function saveTemplateAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; templateId?: string }> {
  console.log('saveTemplateAction: Action started.');
  try {
    const imageUrlFromBlob = formData.get('previewImageUrl') as string;
    if (!imageUrlFromBlob) {
      console.error('saveTemplateAction: Preview image URL from Vercel Blob is missing.');
      return { success: false, error: "Preview image URL from Vercel Blob is required." };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tagsInput = formData.get('tags') as string | null;
    const downloadZipUrlInput = (formData.get('downloadZipUrl') as string)?.trim() || '#';

    if (!title || !description || !categoryId || isNaN(price) || !tagsInput) {
      console.error('saveTemplateAction: Missing required fields.');
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Tags)." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        console.error('saveTemplateAction: Invalid category selected.');
        return { success: false, error: "Invalid category." };
    }

    const dataToSave: TemplateFirestoreData = {
      title,
      title_lowercase: title.toLowerCase(),
      description,
      categoryId,
      price,
      tags: parseStringToArray(tagsInput),
      imageUrl: imageUrlFromBlob,
      downloadZipUrl: downloadZipUrlInput,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const longDescriptionValue = (formData.get('longDescription') as string)?.trim();
    if (longDescriptionValue) dataToSave.longDescription = longDescriptionValue;

    const techStackValue = formData.get('techStack') as string | null;
    const parsedTechStack = parseStringToArray(techStackValue);
    if (parsedTechStack.length > 0) dataToSave.techStack = parsedTechStack;
    
    const dataAiHintValue = (formData.get('dataAiHint') as string)?.trim();
    if (dataAiHintValue) dataToSave.dataAiHint = dataAiHintValue;

    const previewUrlRaw = formData.get('previewUrl') as string | null;
    dataToSave.previewUrl = previewUrlRaw ? previewUrlRaw.trim() : '';
    
    const githubUrlValue = (formData.get('githubUrl') as string)?.trim();
    if (githubUrlValue) dataToSave.githubUrl = githubUrlValue;

    console.log('saveTemplateAction: Data to save to Firestore:', dataToSave);
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), dataToSave);
    
    revalidatePath('/admin/templates');
    revalidatePath('/admin/dashboard');
    revalidatePath('/templates');
    revalidatePath('/'); 

    console.log(`saveTemplateAction: Template "${title}" created successfully with ID: ${docRef.id}`);
    return { success: true, message: `Template "${title}" created successfully.`, templateId: docRef.id };
  } catch (error: any) {
    console.error("Detailed error in saveTemplateAction: ", error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message || "Failed to create template." };
  }
}

export async function updateTemplateAction(id: string, formData: FormData): Promise<{ success: boolean; message?: string; error?: string; templateId?: string }> {
  console.log(`updateTemplateAction: Action started for template ID: ${id}`);
  try {
    const imageUrlFromBlob = formData.get('previewImageUrl') as string; 
    if (!imageUrlFromBlob) {
      console.error('updateTemplateAction: Preview image URL from Vercel Blob is missing.');
      return { success: false, error: "Preview image URL from Vercel Blob is required." };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tagsInput = formData.get('tags') as string | null;
    const downloadZipUrlInput = (formData.get('downloadZipUrl') as string)?.trim() || '#';

    if (!id || !title || !description || !categoryId || isNaN(price) || !tagsInput) {
      console.error('updateTemplateAction: Missing required fields.');
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Tags)." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        console.error('updateTemplateAction: Invalid category selected.');
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
      updatedAt: serverTimestamp() as Timestamp,
    };

    const longDescriptionValue = (formData.get('longDescription') as string)?.trim();
    dataToUpdate.longDescription = longDescriptionValue ? longDescriptionValue : null;

    const techStackValue = formData.get('techStack') as string | null;
    const parsedTechStack = parseStringToArray(techStackValue);
    dataToUpdate.techStack = parsedTechStack.length > 0 ? parsedTechStack : null;
    
    const dataAiHintValue = (formData.get('dataAiHint') as string)?.trim();
    dataToUpdate.dataAiHint = dataAiHintValue ? dataAiHintValue : null;

    const previewUrlRaw = formData.get('previewUrl') as string | null;
    dataToUpdate.previewUrl = previewUrlRaw ? previewUrlRaw.trim() : '';
    
    const githubUrlValue = (formData.get('githubUrl') as string)?.trim();
    dataToUpdate.githubUrl = githubUrlValue ? githubUrlValue : null;
    
    console.log('updateTemplateAction: Data to update in Firestore:', dataToUpdate);
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, dataToUpdate);

    revalidatePath('/admin/templates');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/templates/${id}`);
    revalidatePath('/templates');
    revalidatePath('/');

    console.log(`updateTemplateAction: Template "${title}" (ID: ${id}) updated successfully.`);
    return { success: true, message: `Template "${title}" updated successfully.`, templateId: id };
  } catch (error: any) {
    console.error(`Detailed error in updateTemplateAction for ID ${id}: `, error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message || "Failed to update template." };
  }
}

export async function deleteTemplateAction(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log(`deleteTemplateAction: Action started for template ID: ${id}`);
  try {
    if (!id) {
      console.error('deleteTemplateAction: Template ID is required.');
      return { success: false, error: "Template ID is required for deletion." };
    }
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));

    revalidatePath('/admin/templates');
    revalidatePath('/admin/dashboard');
    revalidatePath('/templates');
    revalidatePath('/');

    console.log(`deleteTemplateAction: Template with ID ${id} deleted successfully.`);
    return { success: true, message: `Template with ID ${id} deleted successfully.` };
  } catch (error: any) {
    console.error(`Detailed error in deleteTemplateAction for ID ${id}: `, error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message || "Failed to delete template." };
  }
}
