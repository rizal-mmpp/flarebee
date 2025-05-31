
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Template } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants'; // For category object mapping

const TEMPLATES_COLLECTION = 'templates';

// Helper to convert Firestore doc to Template object
const fromFirestore = (docSnapshot: any): Template => {
  const data = docSnapshot.data();
  const category = CATEGORIES.find(c => c.id === data.categoryId) || CATEGORIES[0]; // Fallback category
  return {
    id: docSnapshot.id,
    title: data.title,
    description: data.description,
    longDescription: data.longDescription,
    category: category,
    price: data.price,
    tags: data.tags || [],
    techStack: data.techStack || [],
    imageUrl: data.imageUrl,
    dataAiHint: data.dataAiHint,
    previewUrl: data.previewUrl,
    screenshots: data.screenshots || [],
    // files will be handled separately if used
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
    author: data.author,
  } as Template;
};

export type TemplateInputData = Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'category'> & { categoryId: string };


export async function addTemplateToFirestore(templateData: TemplateInputData): Promise<Template> {
  try {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...templateData,
      category: null, // Will be stored as categoryId
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newTemplateSnapshot = await getDoc(docRef);
    return fromFirestore(newTemplateSnapshot);
  } catch (error) {
    console.error("Error adding template to Firestore: ", error);
    throw error;
  }
}

export async function getAllTemplatesFromFirestore(): Promise<Template[]> {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => fromFirestore(docSnapshot));
  } catch (error) {
    console.error("Error getting all templates from Firestore: ", error);
    throw error;
  }
}

export async function getLimitedTemplatesFromFirestore(count: number): Promise<Template[]> {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('createdAt', 'desc'), firestoreLimit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => fromFirestore(docSnapshot));
  } catch (error) {
    console.error(`Error getting limited (${count}) templates from Firestore: `, error);
    throw error;
  }
}


export async function getTemplateByIdFromFirestore(id: string): Promise<Template | null> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return fromFirestore(docSnap);
    } else {
      console.log("No such template document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting template by ID from Firestore: ", error);
    throw error;
  }
}

export async function updateTemplateInFirestore(id: string, data: Partial<TemplateInputData>): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
        ...data,
        category: null, // Ensure category object is not directly stored if data contains it
        updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating template in Firestore: ", error);
    throw error;
  }
}

export async function deleteTemplateFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting template from Firestore: ", error);
    throw error;
  }
}
