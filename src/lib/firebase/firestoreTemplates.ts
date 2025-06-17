
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
  // where, // No longer using where for server-side search in this simplified version
  documentId, 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Template, FetchTemplatesParams, FetchTemplatesResult } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import type { TemplateFirestoreData } from '@/lib/actions/template.actions';

const TEMPLATES_COLLECTION = 'templates';

// Helper to convert Firestore doc to Template object
const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Template => {
  const data = docSnapshot.data();
  const category = CATEGORIES.find(c => c.id === data.categoryId) || CATEGORIES[0];
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
    previewUrl: data.previewUrl || '', // Changed from '#' to ''
    screenshots: data.screenshots || [],
    downloadZipUrl: data.downloadZipUrl || '#',
    githubUrl: data.githubUrl || '',
    createdAt: (data.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
    author: data.author || '',
  };
};

// Simplified version: Only paginates by createdAt. Search will be client-side in AdminTemplatesPage.
export async function getAllTemplatesFromFirestore({
  pageIndex = 0,
  pageSize = 10,
  // searchTerm is no longer used for server-side filtering in this simplified version
}: FetchTemplatesParams = {}): Promise<FetchTemplatesResult> {
  try {
    const templatesCollection = collection(db, TEMPLATES_COLLECTION);
    const dataQueryConstraints: QueryConstraint[] = [];
    
    // Default sort: createdAt descending, then by document ID for stable pagination
    dataQueryConstraints.push(orderBy('createdAt', 'desc'));
    dataQueryConstraints.push(orderBy(documentId(), 'asc'));

    // Count total items in the collection (no search filter here)
    const countQuery = query(templatesCollection);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalItems = countSnapshot.data().count;

    if (totalItems === 0) {
      return { data: [], pageCount: 0, totalItems: 0 };
    }

    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    // Handle pagination cursor
    if (pageSize > 0 && pageIndex > 0) {
      const docsToSkip = pageIndex * pageSize;
      
      // Base cursor query constraints (sorting)
      const cursorDeterminingQueryConstraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        orderBy(documentId(), 'asc'),
        firestoreLimit(docsToSkip)
      ];
      
      const cursorSnapshot = await getDocs(query(templatesCollection, ...cursorDeterminingQueryConstraints));

      if (cursorSnapshot.docs.length === docsToSkip && cursorSnapshot.docs.length > 0) {
        const lastVisibleDoc = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        dataQueryConstraints.push(startAfter(lastVisibleDoc)); // Simplified startAfter
      } else if (cursorSnapshot.docs.length < docsToSkip) {
        return { data: [], pageCount, totalItems }; // Requested page is out of bounds
      }
    }

    // Add final limit for the current page
    // Remove any previous limit before adding the new one
    const existingLimitIndex = dataQueryConstraints.findIndex(c => c.type === 'limit');
    if (existingLimitIndex !== -1) {
        dataQueryConstraints.splice(existingLimitIndex, 1);
    }
    if (pageSize > 0) {
        dataQueryConstraints.push(firestoreLimit(pageSize));
    }
    
    const finalDataQuery = query(templatesCollection, ...dataQueryConstraints);
    const dataSnapshot = await getDocs(finalDataQuery);
    const data = dataSnapshot.docs.map(doc => fromFirestore(doc));
    
    return { data, pageCount, totalItems };

  } catch (error: any) {
    console.error("Error getting all templates from Firestore (simplified): ", error);
    if (error.code === 'failed-precondition') {
       const queryDescription = dataQueryConstraints.map(c => {
        // @ts-ignore
        return `${c._op || c.type} on ${c._field?.segments?.join('/') || 'ID'} ${c._value !== undefined ? `val: ${c._value}` : ''} ${c._direction || ''}`;
      }).join('; ');
      console.error("Firestore 'failed-precondition'. Index missing? Query details: ", queryDescription);
      throw new Error(`Firestore query requires an index. Expected: (createdAt DESC, __name__ ASC). Original error: ${error.message}`);
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
