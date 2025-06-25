
'use server';

import { revalidatePath } from 'next/cache';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '../constants'; 
import type { Service, JourneyStage, ServicePackage, FaqItem, PricingDetails } from '@/lib/types';
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

export interface ServiceFirestoreData extends Omit<Service, 'id' | 'slug' | 'category' | 'createdAt' | 'updatedAt' | 'customerJourneyStages' | 'pricing' | 'keyFeatures' | 'targetAudience' | 'tags'> {
  slug: string;
  categoryId: string;
  tags: string[];
  keyFeatures?: string[] | null;
  targetAudience?: string[] | null;
  pricing: PricingDetails;
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
function prepareDataFromFormData(formData: FormData, imageUrl: string | null, fixedPriceImageUrl: string | null): Partial<ServiceFirestoreData> {
    const title = formData.get('title') as string;
    
    const pricingData: PricingDetails = {};
    
    try {
      const pricingJson = formData.get('pricing') as string | null;
      if (pricingJson) {
        const rawPricing = JSON.parse(pricingJson);
        
        pricingData.isFixedPriceActive = rawPricing.isFixedPriceActive || false;
        pricingData.isSubscriptionActive = rawPricing.isSubscriptionActive || false;
        pricingData.isCustomQuoteActive = rawPricing.isCustomQuoteActive || false;
        
        if (pricingData.isFixedPriceActive) {
            pricingData.fixedPriceDetails = { 
                title: rawPricing.fixedPriceDetails?.title || '',
                description: rawPricing.fixedPriceDetails?.description || '',
                price: Number(rawPricing.fixedPriceDetails?.price || 0),
                imageUrl: fixedPriceImageUrl, // Use the passed URL
                imageAiHint: rawPricing.fixedPriceDetails?.imageAiHint || '',
            };
        }

        if (pricingData.isSubscriptionActive) {
            pricingData.subscriptionDetails = {
                annualDiscountPercentage: Number(rawPricing.subscriptionDetails?.annualDiscountPercentage || 0),
                packages: (rawPricing.subscriptionDetails?.packages || []).map((pkg: any) => ({
                    ...pkg,
                    features: parseStringToArray(pkg.features as string | null),
                }))
            };
        }

        if (pricingData.isCustomQuoteActive) {
            pricingData.customQuoteDetails = rawPricing.customQuoteDetails || {};
        }
      }
    } catch(e) { console.error("Error parsing pricing JSON", e); }


    const data: Partial<ServiceFirestoreData> = {
        title,
        slug: slugify(title),
        shortDescription: formData.get('shortDescription') as string,
        longDescription: formData.get('longDescription') as string,
        categoryId: formData.get('categoryId') as string,
        tags: parseStringToArray(formData.get('tags') as string | null),
        imageUrl,
        status: formData.get('status') as typeof SERVICE_STATUSES[number] || 'draft',
        dataAiHint: (formData.get('dataAiHint') as string)?.trim() || null,
        keyFeatures: parseStringToArray(formData.get('keyFeatures') as string | null),
        targetAudience: parseStringToArray(formData.get('targetAudience') as string | null),
        estimatedDuration: (formData.get('estimatedDuration') as string)?.trim() || null,
        portfolioLink: (formData.get('portfolioLink') as string)?.trim() || null,
        
        pricing: pricingData,

        showFaqSection: formData.get('showFaqSection') === 'true',
    };
    
    try {
        const faqJson = formData.get('faq') as string | null;
        if (faqJson) data.faq = JSON.parse(faqJson);
    } catch(e) { console.error("Error parsing FAQ JSON", e); data.faq = []; }

    return data;
}


export async function saveServiceAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string; serviceId?: string }> {
  console.log('saveServiceAction: Action started.');
  try {
    let imageUrlFromBlob: string | null = null;
    let fixedPriceImageUrlFromBlob: string | null = null;
    
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
    imageUrlFromBlob = uploadResult.data.url;

    const fixedPriceImageFile = formData.get('fixedPriceImageFile') as File | null;
    if (fixedPriceImageFile) {
      const fixedPriceBlobFormData = new FormData();
      fixedPriceBlobFormData.append('file', fixedPriceImageFile);
      const fixedPriceUploadResult = await uploadFileToVercelBlob(fixedPriceBlobFormData);
      if (fixedPriceUploadResult.success && fixedPriceUploadResult.data?.url) {
        fixedPriceImageUrlFromBlob = fixedPriceUploadResult.data.url;
      }
    }


    const dataToSave = prepareDataFromFormData(formData, imageUrlFromBlob, fixedPriceImageUrlFromBlob) as ServiceFirestoreData;
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
    let finalImageUrl = formData.get('currentImageUrl') as string | null;
    let finalFixedPriceImageUrl = formData.get('currentFixedPriceImageUrl') as string | null;

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
    
    const fixedPriceImageFile = formData.get('fixedPriceImageFile') as File | null;
    if (fixedPriceImageFile) {
        const fixedPriceBlobFormData = new FormData();
        fixedPriceBlobFormData.append('file', fixedPriceImageFile);
        const fixedPriceUploadResult = await uploadFileToVercelBlob(fixedPriceBlobFormData);
        if (!fixedPriceUploadResult.success || !fixedPriceUploadResult.data?.url) {
            return { success: false, error: fixedPriceUploadResult.error || 'Could not upload new fixed price image.'};
        }
        finalFixedPriceImageUrl = fixedPriceUploadResult.data.url;
    }

    const docRef = doc(db, SERVICES_COLLECTION, id);
    const dataToUpdate = prepareDataFromFormData(formData, finalImageUrl, finalFixedPriceImageUrl);
    
    if (dataToUpdate.pricing?.isFixedPriceActive === false) {
      if (dataToUpdate.pricing.fixedPriceDetails) {
        dataToUpdate.pricing.fixedPriceDetails = undefined;
      }
    }
    
    dataToUpdate.updatedAt = serverTimestamp() as Timestamp;
    
    console.log('updateServiceAction: Data to update in Firestore:', dataToUpdate);
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
