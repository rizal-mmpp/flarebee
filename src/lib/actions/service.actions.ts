
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
import { SERVICE_CATEGORIES, PRICING_MODELS, SERVICE_STATUSES } from '../constants'; 
import type { Service, JourneyStage } from '@/lib/types'; 

const SERVICES_COLLECTION = 'services'; 

export interface ServiceFirestoreData {
  title: string;
  title_lowercase: string;
  shortDescription: string;
  longDescription: string;
  categoryId: string; 
  pricingModel: typeof PRICING_MODELS[number];
  priceMin?: number | null;
  priceMax?: number | null;
  currency: string;
  tags: string[];
  imageUrl: string;
  dataAiHint?: string | null;
  status: typeof SERVICE_STATUSES[number];
  keyFeatures?: string[] | null;
  targetAudience?: string[] | null;
  estimatedDuration?: string | null;
  portfolioLink?: string | null;
  customerJourneyStages?: JourneyStage[]; 
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}

function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export async function saveServiceAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; serviceId?: string }> {
  console.log('saveServiceAction: Action started.');
  try {
    const imageUrlFromBlob = formData.get('imageUrl') as string; 
    if (!imageUrlFromBlob) {
      console.error('saveServiceAction: Image URL from Vercel Blob is missing.');
      return { success: false, error: "Service image URL from Vercel Blob is required." };
    }

    const title = formData.get('title') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const longDescription = formData.get('longDescription') as string;
    const categoryId = formData.get('categoryId') as string;
    const pricingModel = formData.get('pricingModel') as typeof PRICING_MODELS[number];
    const status = formData.get('status') as typeof SERVICE_STATUSES[number];

    if (!title || !shortDescription || !longDescription || !categoryId || !pricingModel || !status ) {
      console.error('saveServiceAction: Missing required fields.');
      return { success: false, error: "Missing required fields (Title, Short Description, Long Description, Category, Pricing Model, Status)." };
    }
    
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        console.error('saveServiceAction: Invalid category selected.');
        return { success: false, error: "Invalid category." };
    }
    if (!PRICING_MODELS.includes(pricingModel)) {
        return { success: false, error: "Invalid pricing model." };
    }
    if (!SERVICE_STATUSES.includes(status)) {
        return { success: false, error: "Invalid status." };
    }

    const dataToSave: ServiceFirestoreData = {
      title,
      title_lowercase: title.toLowerCase(),
      shortDescription,
      longDescription,
      categoryId,
      pricingModel,
      currency: (formData.get('currency') as string) || 'IDR',
      tags: parseStringToArray(formData.get('tags') as string | null),
      imageUrl: imageUrlFromBlob,
      status,
      customerJourneyStages: [], // Initialize with empty array
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    
    const priceMinStr = formData.get('priceMin') as string | null;
    if (priceMinStr && !isNaN(parseFloat(priceMinStr))) dataToSave.priceMin = parseFloat(priceMinStr);
    
    const priceMaxStr = formData.get('priceMax') as string | null;
    if (priceMaxStr && !isNaN(parseFloat(priceMaxStr))) dataToSave.priceMax = parseFloat(priceMaxStr);

    dataToSave.keyFeatures = parseStringToArray(formData.get('keyFeatures') as string | null);
    dataToSave.targetAudience = parseStringToArray(formData.get('targetAudience') as string | null);
    dataToSave.estimatedDuration = (formData.get('estimatedDuration') as string)?.trim() || null;
    dataToSave.portfolioLink = (formData.get('portfolioLink') as string)?.trim() || null;
    dataToSave.dataAiHint = (formData.get('dataAiHint') as string)?.trim() || null;

    console.log('saveServiceAction: Data to save to Firestore:', dataToSave);
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), dataToSave);
    
    revalidatePath('/admin/services');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/services/${docRef.id}/simulate-journey`);


    console.log(`saveServiceAction: Service "${title}" created successfully with ID: ${docRef.id}`);
    return { success: true, message: `Service "${title}" created successfully.`, serviceId: docRef.id };
  } catch (error: any) {
    console.error("Detailed error in saveServiceAction: ", error);
    return { success: false, error: error.message || "Failed to create service." };
  }
}

export async function updateServiceAction(id: string, formData: FormData): Promise<{ success: boolean; message?: string; error?: string; serviceId?: string }> {
  console.log(`updateServiceAction: Action started for service ID: ${id}`);
  try {
    const imageUrlFromBlob = formData.get('imageUrl') as string; 
    if (!imageUrlFromBlob) {
      console.error('updateServiceAction: Image URL from Vercel Blob is missing.');
      return { success: false, error: "Service image URL from Vercel Blob is required." };
    }

    const title = formData.get('title') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const longDescription = formData.get('longDescription') as string;
    const categoryId = formData.get('categoryId') as string;
    const pricingModel = formData.get('pricingModel') as typeof PRICING_MODELS[number];
    const status = formData.get('status') as typeof SERVICE_STATUSES[number];


    if (!id || !title || !shortDescription || !longDescription || !categoryId || !pricingModel || !status) {
      console.error('updateServiceAction: Missing required fields.');
      return { success: false, error: "Missing required fields." };
    }
    
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
        console.error('updateServiceAction: Invalid category selected.');
        return { success: false, error: "Invalid category." };
    }
     if (!PRICING_MODELS.includes(pricingModel)) {
        return { success: false, error: "Invalid pricing model." };
    }
    if (!SERVICE_STATUSES.includes(status)) {
        return { success: false, error: "Invalid status." };
    }


    const dataToUpdate: Partial<Omit<ServiceFirestoreData, 'customerJourneyStages'>> & { updatedAt: Timestamp } = { 
      title,
      title_lowercase: title.toLowerCase(),
      shortDescription,
      longDescription,
      categoryId,
      pricingModel,
      currency: (formData.get('currency') as string) || 'IDR',
      tags: parseStringToArray(formData.get('tags') as string | null),
      imageUrl: imageUrlFromBlob,
      status,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const priceMinStr = formData.get('priceMin') as string | null;
    dataToUpdate.priceMin = priceMinStr && !isNaN(parseFloat(priceMinStr)) ? parseFloat(priceMinStr) : null;
    
    const priceMaxStr = formData.get('priceMax') as string | null;
    dataToUpdate.priceMax = priceMaxStr && !isNaN(parseFloat(priceMaxStr)) ? parseFloat(priceMaxStr) : null;
    
    dataToUpdate.keyFeatures = parseStringToArray(formData.get('keyFeatures') as string | null);
    dataToUpdate.targetAudience = parseStringToArray(formData.get('targetAudience') as string | null);
    dataToUpdate.estimatedDuration = (formData.get('estimatedDuration') as string)?.trim() || null;
    dataToUpdate.portfolioLink = (formData.get('portfolioLink') as string)?.trim() || null;
    dataToUpdate.dataAiHint = (formData.get('dataAiHint') as string)?.trim() || null;
    
    // Note: customerJourneyStages are updated separately by updateServiceJourneyStagesAction
    
    console.log('updateServiceAction: Data to update in Firestore:', dataToUpdate);
    const docRef = doc(db, SERVICES_COLLECTION, id);
    await updateDoc(docRef, dataToUpdate);

    revalidatePath('/admin/services');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/services/${id}`);
    revalidatePath(`/admin/services/${id}/simulate-journey`);


    console.log(`updateServiceAction: Service "${title}" (ID: ${id}) updated successfully.`);
    return { success: true, message: `Service "${title}" updated successfully.`, serviceId: id };
  } catch (error: any) {
    console.error(`Detailed error in updateServiceAction for ID ${id}: `, error);
    return { success: false, error: error.message || "Failed to update service." };
  }
}

export async function deleteServiceAction(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log(`deleteServiceAction: Action started for service ID: ${id}`);
  try {
    if (!id) {
      console.error('deleteServiceAction: Service ID is required.');
      return { success: false, error: "Service ID is required for deletion." };
    }
    await deleteDoc(doc(db, SERVICES_COLLECTION, id));

    revalidatePath('/admin/services');
    revalidatePath('/admin/dashboard');


    console.log(`deleteServiceAction: Service with ID ${id} deleted successfully.`);
    return { success: true, message: `Service with ID ${id} deleted successfully.` };
  } catch (error: any) {
    console.error(`Detailed error in deleteServiceAction for ID ${id}: `, error);
    return { success: false, error: error.message || "Failed to delete service." };
  }
}

export async function updateServiceJourneyStagesAction(
  serviceId: string,
  stages: JourneyStage[]
): Promise<{ success: boolean; error?: string }> {
  if (!serviceId) {
    return { success: false, error: 'Service ID is required.' };
  }
  if (!Array.isArray(stages)) {
    return { success: false, error: 'Stages must be an array.' };
  }

  try {
    const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
    await updateDoc(serviceRef, {
      customerJourneyStages: stages, // Ensure stages are serializable (no custom classes)
      updatedAt: serverTimestamp(),
    });

    revalidatePath(`/admin/services/${serviceId}/simulate-journey`);
    revalidatePath(`/admin/services/${serviceId}`); // Also revalidate the main service detail page

    console.log(`Journey stages updated for service ${serviceId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating journey stages for service ${serviceId}:`, error);
    return { success: false, error: error.message || 'Failed to update journey stages.' };
  }
}
