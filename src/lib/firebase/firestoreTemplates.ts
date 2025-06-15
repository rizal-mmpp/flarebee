
import {
  collection,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  getCountFromServer,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  where,
  documentId, // Import documentId
  FieldPath, // Import FieldPath
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Template, FetchTemplatesParams, FetchTemplatesResult } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import type { TemplateFirestoreData } from '@/lib/actions/template.actions'; // Use the Firestore-specific type

const TEMPLATES_COLLECTION = 'templates';

// Helper to convert Firestore doc to Template object
const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Template => {
  const data = docSnapshot.data();
  const category = CATEGORIES.find(c => c.id === data.categoryId) || CATEGORIES[0]; // Fallback to first category
  return {
    id: docSnapshot.id,
    title: data.title,
    title_lowercase: data.title_lowercase || data.title?.toLowerCase() || '',
    description: data.description,
    longDescription: data.longDescription || '',
    category: category,
    price: data.price,
    tags: data.tags || [],
    techStack: data.techStack || [],
    imageUrl: data.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: data.dataAiHint || '',
    previewUrl: data.previewUrl || '#',
    screenshots: data.screenshots || [],
    downloadZipUrl: data.downloadZipUrl || '#',
    githubUrl: data.githubUrl || '',
    createdAt: (data.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
    author: data.author || '',
  };
};


export async function getAllTemplatesFromFirestore({
  pageIndex = 0,
  pageSize = 10,
  sorting = [{ id: 'createdAt', desc: true }], // Default sort
  searchTerm,
}: FetchTemplatesParams = {}): Promise<FetchTemplatesResult> {
  try {
    const templatesCollection = collection(db, TEMPLATES_COLLECTION);
    const dataQueryConstraints: QueryConstraint[] = [];
    const countQueryConstraints: QueryConstraint[] = [];

    const effectiveSearchTerm = searchTerm?.trim();
    const primarySearchField = 'title_lowercase'; // Always search this for templates

    if (effectiveSearchTerm) {
      const lowerSearchTerm = effectiveSearchTerm.toLowerCase();
      countQueryConstraints.push(where(primarySearchField, '>=', lowerSearchTerm));
      countQueryConstraints.push(where(primarySearchField, '<=', lowerSearchTerm + '\uf8ff'));

      dataQueryConstraints.push(where(primarySearchField, '>=', lowerSearchTerm));
      dataQueryConstraints.push(where(primarySearchField, '<=', lowerSearchTerm + '\uf8ff'));
      dataQueryConstraints.push(orderBy(primarySearchField, 'asc'));
    } else {
      // Default sort or user-defined sort if no search term
      if (sorting && sorting.length > 0) {
        const sortItem = sorting[0];
        // Ensure sortItem.id is a valid field in Template for Firestore sorting
        // For client-side sorting, this part is less critical for the DB query if not searching
         if (['title', 'price', 'createdAt'].includes(sortItem.id)) {
             dataQueryConstraints.push(orderBy(sortItem.id === 'title' ? 'title_lowercase' : sortItem.id, sortItem.desc ? 'desc' : 'asc'));
         } else {
            dataQueryConstraints.push(orderBy('createdAt', 'desc')); // Fallback default sort
         }
      } else {
        dataQueryConstraints.push(orderBy('createdAt', 'desc'));
      }
    }
    // Always add secondary sort for stable pagination
    dataQueryConstraints.push(orderBy(documentId(), 'asc'));


    // Count total items matching filters
    const countQuery = query(templatesCollection, ...countQueryConstraints);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalItems = countSnapshot.data().count;

    if (totalItems === 0) {
      return { data: [], pageCount: 0, totalItems: 0 };
    }

    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    // Handle pagination cursor
    if (pageSize > 0 && pageIndex > 0) {
      const cursorDocLimit = pageIndex * pageSize;
      const cursorDocQuery = query(
        templatesCollection,
        ...dataQueryConstraints.filter(c => c.type !== 'limit' && c.type !== 'startAfter'), // Exclude previous pagination constraints
        firestoreLimit(cursorDocLimit)
      );
      const cursorSnapshot = await getDocs(cursorDocQuery);

      if (cursorSnapshot.docs.length === cursorDocLimit && cursorSnapshot.docs.length > 0) {
        const lastDocSnapshot = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        
        // Construct correct startAfter arguments based on current primary sort field
        const primarySortField = effectiveSearchTerm ? primarySearchField : (sorting[0]?.id === 'title' ? 'title_lowercase' : sorting[0]?.id || 'createdAt');
        const primarySortValue = lastDocSnapshot.data()[primarySortField];

        if (primarySortValue !== undefined) {
          dataQueryConstraints.push(startAfter(primarySortValue, lastDocSnapshot.id));
        } else {
          // Fallback if primary sort value is undefined on the doc (shouldn't happen with good data)
          dataQueryConstraints.push(startAfter(lastDocSnapshot));
        }
      } else if (cursorSnapshot.docs.length < cursorDocLimit) {
        return { data: [], pageCount, totalItems };
      }
    }

    // Add final limit for the current page
    if (pageSize > 0) {
      dataQueryConstraints.push(firestoreLimit(pageSize));
    }

    const finalDataQuery = query(templatesCollection, ...dataQueryConstraints);
    const dataSnapshot = await getDocs(finalDataQuery);
    const data = dataSnapshot.docs.map(doc => fromFirestore(doc));

    return { data, pageCount, totalItems };
  } catch (error: any) {
    console.error("Error getting all templates from Firestore: ", error);
    if (error.code === 'failed-precondition') {
      console.error("Firestore 'failed-precondition' error. This usually indicates a missing or incomplete index. Please check your Firestore indexes.", error.message);
      // To help debug, log the constraints that caused the issue.
      // This might require passing constraints back or logging them here.
      // For now, a generic message.
      throw new Error(`Firestore query requires an index. Please ensure indexes cover the query. Original error: ${error.message}`);
    }
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

// Re-adding the basic CRUD operations that might have been in template.actions.ts,
// but are direct Firestore interactions.
// The actions file should ideally call these.

export async function addTemplateToFirestore(templateData: TemplateFirestoreData): Promise<Template> {
  try {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newTemplateSnapshot = await getDoc(docRef);
    return fromFirestore(newTemplateSnapshot as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error adding template to Firestore: ", error);
    throw error;
  }
}

export async function updateTemplateInFirestore(id: string, data: Partial<TemplateFirestoreData>): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
        ...data,
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
