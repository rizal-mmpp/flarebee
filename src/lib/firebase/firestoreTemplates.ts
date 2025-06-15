
import {
  collection,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getCountFromServer,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  where,
  QueryOrderByConstraint,
  documentId,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Template, FetchTemplatesParams, FetchTemplatesResult } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

const TEMPLATES_COLLECTION = 'templates';

const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Template => {
  const data = docSnapshot.data();
  const category = CATEGORIES.find(c => c.id === data.categoryId) || CATEGORIES[0];
  return {
    id: docSnapshot.id,
    title: data.title,
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
  } as Template;
};

export type TemplateInputData = Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'category'> & { categoryId: string };

export async function addTemplateToFirestore(templateData: TemplateInputData): Promise<Template> {
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

export async function getAllTemplatesFromFirestore({
  pageIndex = 0,
  pageSize = 10, // Default page size
  searchTerm,
}: FetchTemplatesParams = {}): Promise<FetchTemplatesResult> {
  try {
    const templatesCollection = collection(db, TEMPLATES_COLLECTION);
    const effectiveSearchTerm = searchTerm?.trim();
    const searchActive = !!effectiveSearchTerm;

    // Base constraints for filtering (search)
    const filterConstraints: QueryConstraint[] = [];
    if (searchActive) {
      filterConstraints.push(where('title', '>=', effectiveSearchTerm));
      filterConstraints.push(where('title', '<=', effectiveSearchTerm + '\uf8ff'));
    }

    // Count total items matching filters
    const countQuery = query(templatesCollection, ...filterConstraints);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalItems = countSnapshot.data().count;

    if (totalItems === 0 && searchActive) { // Only return early if search yielded no results
      return { data: [], pageCount: 0, totalItems: 0 };
    }
    if (totalItems === 0 && !searchActive) { // No items at all
         return { data: [], pageCount: 0, totalItems: 0 };
    }


    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    // Build query for data fetching
    const dataQueryConstraints: QueryConstraint[] = [...filterConstraints];

    // Add orderBy constraints
    if (searchActive) {
      dataQueryConstraints.push(orderBy('title', 'asc'));
    } else {
      dataQueryConstraints.push(orderBy('createdAt', 'desc'));
    }
    dataQueryConstraints.push(orderBy(documentId(), 'asc')); // Secondary sort for consistent pagination

    // Handle pagination cursor
    if (pageSize > 0 && pageIndex > 0) {
      const cursorDocLimit = pageIndex * pageSize;
      // The cursor query must include all filters and orderings of the main query
      const cursorDocQuery = query(
        templatesCollection,
        ...dataQueryConstraints.filter(c => c.type !== 'limit' && c.type !== 'startAfter'), // Exclude potential previous pagination constraints
        firestoreLimit(cursorDocLimit)
      );
      const cursorSnapshot = await getDocs(cursorDocQuery);

      if (cursorSnapshot.docs.length === cursorDocLimit && cursorSnapshot.docs.length > 0) {
        const lastDocSnapshot = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        dataQueryConstraints.push(startAfter(lastDocSnapshot));
      } else if (cursorSnapshot.docs.length < cursorDocLimit) {
        // Requested page is out of bounds for the current filters/order
        return { data: [], pageCount, totalItems };
      }
    }

    // Add final limit for the current page
    if (pageSize > 0) {
      dataQueryConstraints.push(firestoreLimit(pageSize));
    }

    const finalDataQuery = query(templatesCollection, ...dataQueryConstraints);
    const dataSnapshot = await getDocs(finalDataQuery);
    const data = dataSnapshot.docs.map(doc => fromFirestore(doc as QueryDocumentSnapshot<DocumentData>));

    return { data, pageCount, totalItems };
  } catch (error: any) {
    console.error("Error getting all templates from Firestore: ", error);
    if (error.code === 'failed-precondition') {
      console.error("Firestore 'failed-precondition' error. This usually indicates a missing or incomplete index. Please check your Firestore indexes.", error.message);
      throw new Error(`Firestore query requires an index. Details: ${error.message}. Query constraints: ${JSON.stringify(error.customData?.queryConstraints || 'N/A')}`);
    }
    throw error;
  }
}


export async function getLimitedTemplatesFromFirestore(count: number): Promise<Template[]> {
   try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('createdAt', 'desc'), firestoreLimit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => fromFirestore(docSnapshot as QueryDocumentSnapshot<DocumentData>));
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
      return fromFirestore(docSnap as QueryDocumentSnapshot<DocumentData>);
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
