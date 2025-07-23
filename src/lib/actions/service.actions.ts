
'use server';

// This file is now deprecated for creating/updating services,
// as that logic has moved to erpnext.actions.ts.
// It is kept for the updateServiceJourneyStagesAction function,
// which still interacts with Firestore.

import { revalidatePath } from 'next/cache';
import {
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { JourneyStage } from '@/lib/types';
import { uploadFileToVercelBlob } from './vercelBlob.actions';

const SERVICES_COLLECTION = 'services'; 

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

    return { success: true };
  } catch (error: any) {
    console.error(`Error updating journey stages for service ${serviceId}:`, error);
    return { success: false, error: error.message || 'Failed to update journey stages.' };
  }
}
