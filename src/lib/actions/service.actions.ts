
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
import type { Service, JourneyStage, ServicePackage, FaqItem } from '@/lib/types';
import { uploadFileToVercelBlob } from './vercelBlob.actions';

const SERVICES_COLLECTION = 'services'; 

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-'); 
}

export interface ServiceFirestoreData {
  title: string;
  slug: string;
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
  showPackagesSection?: boolean;
  packages?: ServicePackage[];
  showFaqSection?: boolean;
  faq?: FaqItem[];
  customerJourneyStages?: JourneyStage[]; 
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}

function parseStringToArray(str?: string | null): string[] {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

// Helper to prepare data for Firestore from FormData
function prepareDataFromFormData(formData: FormData, currentImageUrl?: string): Partial<ServiceFirestoreData> {
    const title = formData.get('title') as string;
    const data: Partial<ServiceFirestoreData> = {
        title,
        slug: slugify(title),
        title_lowercase: title.toLowerCase(),
        shortDescription: formData.get('shortDescription') as string,
        longDescription: formData.get('longDescription') as string,
        categoryId: formData.get('categoryId') as string,
        pricingModel: formData.get('pricingModel') as typeof PRICING_MODELS[number],
        currency: (formData.get('currency') as string) || 'IDR',
        tags: parseStringToArray(formData.get('tags') as string | null),
        imageUrl: currentImageUrl, // This will be updated if new image is uploaded
        status: formData.get('status') as typeof SERVICE_STATUSES[number] || 'draft',
        dataAiHint: (formData.get('dataAiHint') as string)?.trim() || null,
        keyFeatures: parseStringToArray(formData.get('keyFeatures') as string | null),
        targetAudience: parseStringToArray(formData.get('targetAudience') as string | null),
        estimatedDuration: (formData.get('estimatedDuration') as string)?.trim() || null,
        portfolioLink: (formData.get('portfolioLink') as string)?.trim() || null,
        showPackagesSection: formData.get('showPackagesSection') === 'true',
        showFaqSection: formData.get('showFaqSection') === 'true',
    };

    const priceMinStr = formData.get('priceMin') as string | null;
    data.priceMin = priceMinStr && !isNaN(parseFloat(priceMinStr)) ? parseFloat(priceMinStr) : null;
    
    const priceMaxStr = formData.get('priceMax') as string | null;
    data.priceMax = priceMaxStr && !isNaN(parseFloat(priceMaxStr)) ? parseFloat(priceMaxStr) : null;

    try {
        const packagesJson = formData.get('packages') as string | null;
        if (packagesJson) {
            const rawPackages = JSON.parse(packagesJson);
            data.packages = rawPackages.map((pkg: any) => ({
                ...pkg,
                features: parseStringToArray(pkg.features as string | null),
            }));
        }
    } catch(e) { console.error("Error parsing packages JSON", e); data.packages = []; }
    
    try {
        const faqJson = formData.get('faq') as string | null;
        if (faqJson) data.faq = JSON.parse(faqJson);
    } catch(e) { console.error("Error parsing FAQ JSON", e); data.faq = []; }

    return data;
}


export async function saveServiceAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; serviceId?: string }> {
  console.log('saveServiceAction: Action started.');
  try {
    const imageFile = formData.get('imageFile') as File | null;
    if (!imageFile) {
        return { success: false, error: 'Service image is required.'};
    }
    const blobFormData = new FormData();
    blobFormData.append('file', imageFile);
    const uploadResult = await uploadFileToVercelBlob(blobFormData);
    if (!uploadResult.success || !uploadResult.data?.url) {
        return { success: false, error: uploadResult.error || 'Could not upload service image.'};
    }
    const imageUrlFromBlob = uploadResult.data.url;

    const dataToSave = prepareDataFromFormData(formData, imageUrlFromBlob) as ServiceFirestoreData;
    dataToSave.createdAt = serverTimestamp() as Timestamp;
    dataToSave.updatedAt = serverTimestamp() as Timestamp;
    dataToSave.customerJourneyStages = [];

    console.log('saveServiceAction: Data to save to Firestore:', dataToSave);
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), dataToSave);
    
    revalidatePath('/admin/services', 'layout');
    revalidatePath('/services', 'layout');
    revalidatePath('/', 'layout');

    console.log(`saveServiceAction: Service "${dataToSave.title}" created with ID: ${docRef.id}`);
    return { success: true, message: `Service "${dataToSave.title}" created successfully.`, serviceId: docRef.id };
  } catch (error: any) {
    console.error("Detailed error in saveServiceAction: ", error);
    return { success: false, error: error.message || "Failed to create service." };
  }
}

export async function updateServiceAction(id: string, formData: FormData): Promise<{ success: boolean; message?: string; error?: string; serviceId?: string }> {
  console.log(`updateServiceAction: Action started for service ID: ${id}`);
  try {
    let finalImageUrl = formData.get('currentImageUrl') as string;
    const imageFile = formData.get('imageFile') as File | null;
    if (imageFile) {
        const blobFormData = new FormData();
        blobFormData.append('file', imageFile);
        const uploadResult = await uploadFileToVercelBlob(blobFormData);
        if (!uploadResult.success || !uploadResult.data?.url) {
            return { success: false, error: uploadResult.error || 'Could not upload new service image.'};
        }
        finalImageUrl = uploadResult.data.url;
    }
    
    const dataToUpdate = prepareDataFromFormData(formData, finalImageUrl) as Partial<ServiceFirestoreData>;
    dataToUpdate.updatedAt = serverTimestamp() as Timestamp;
    
    console.log('updateServiceAction: Data to update in Firestore:', dataToUpdate);
    const docRef = doc(db, SERVICES_COLLECTION, id);
    await updateDoc(docRef, dataToUpdate);

    revalidatePath('/admin/services', 'layout');
    revalidatePath(`/admin/services/${dataToUpdate.slug}`);
    revalidatePath(`/admin/services/edit/${dataToUpdate.slug}`);
    revalidatePath(`/services/${dataToUpdate.slug}`);
    revalidatePath('/services', 'layout');
    revalidatePath('/', 'layout');

    console.log(`updateServiceAction: Service "${dataToUpdate.title}" (ID: ${id}) updated successfully.`);
    return { success: true, message: `Service "${dataToUpdate.title}" updated successfully.`, serviceId: id };
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
    
    revalidatePath('/admin/services', 'layout');
    revalidatePath('/services', 'layout');
    revalidatePath('/', 'layout');

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
      customerJourneyStages: stages,
      updatedAt: serverTimestamp(),
    });

    const serviceDoc = await getDoc(serviceRef);
    if(serviceDoc.exists()) {
      revalidatePath(`/services/${serviceDoc.data().slug}`);
    }

    revalidatePath(`/admin/services/${serviceId}/simulate-journey`);
    revalidatePath(`/admin/services/edit/${serviceId}`);

    console.log(`Journey stages updated for service ${serviceId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating journey stages for service ${serviceId}:`, error);
    return { success: false, error: error.message || 'Failed to update journey stages.' };
  }
}
