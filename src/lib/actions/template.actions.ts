
'use server';

import { revalidatePath } from 'next/cache';
import {
  addTemplateToFirestore,
  updateTemplateInFirestore,
  deleteTemplateFromFirestore,
  type TemplateInputData,
} from '@/lib/firebase/firestoreTemplates';
import type { Template } from '@/lib/types';
import { CATEGORIES } from '../constants';


function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export async function saveTemplateAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; template?: Template }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string | undefined;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tags = parseStringToArray(formData.get('tags') as string | null);
    const techStack = parseStringToArray(formData.get('techStack') as string | null);
    const imageUrl = formData.get('previewImageUrl') as string || 'https://placehold.co/600x400.png';
    const dataAiHint = formData.get('dataAiHint') as string | undefined;
    const previewUrl = formData.get('previewUrl') as string | undefined;
    const downloadZipUrl = formData.get('downloadZipUrl') as string || '#';
    const githubUrl = formData.get('githubUrl') as string | undefined;

    if (!title || !description || !categoryId || isNaN(price) || !downloadZipUrl) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Download URL) or invalid price." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    const templateData: TemplateInputData = {
      title,
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
    };

    const newTemplate = await addTemplateToFirestore(templateData);
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/templates');
    revalidatePath('/'); 

    return { success: true, message: `Template "${newTemplate.title}" created successfully.`, template: newTemplate };
  } catch (error: any) {
    console.error("Error in saveTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to create template." };
  }
}

export async function updateTemplateAction(id: string, formData: FormData): Promise<{ success: boolean; message?: string; error?: string; template?: Partial<TemplateInputData> }> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string | undefined;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const tags = parseStringToArray(formData.get('tags') as string | null);
    const techStack = parseStringToArray(formData.get('techStack') as string | null);
    const imageUrl = formData.get('previewImageUrl') as string || undefined; 
    const dataAiHint = formData.get('dataAiHint') as string | undefined;
    const previewUrl = formData.get('previewUrl') as string | undefined;
    const downloadZipUrl = formData.get('downloadZipUrl') as string || '#';
    const githubUrl = formData.get('githubUrl') as string | undefined;


    if (!id || !title || !description || !categoryId || isNaN(price) || !downloadZipUrl) {
      return { success: false, error: "Missing required fields (Title, Description, Category, Price, Download URL) or invalid price." };
    }
    
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        return { success: false, error: "Invalid category." };
    }

    const updateData: Partial<TemplateInputData> = {
      title,
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
    };
    if (imageUrl) updateData.imageUrl = imageUrl;


    await updateTemplateInFirestore(id, updateData);

    revalidatePath('/admin/dashboard');
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
    await deleteTemplateFromFirestore(id);

    revalidatePath('/admin/dashboard');
    revalidatePath('/templates');
    revalidatePath('/');

    return { success: true, message: `Template with ID ${id} deleted successfully.` };
  } catch (error: any) {
    console.error("Error in deleteTemplateAction: ", error);
    return { success: false, error: error.message || "Failed to delete template." };
  }
}

