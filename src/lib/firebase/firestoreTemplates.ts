
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
  startAfter as firestoreStartAfter,
  getCountFromServer,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Template } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import type { SortingState } from '@tanstack/react-table';

const TEMPLATES_COLLECTION = 'templates';

const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Template => {
  const data = docSnapshot.data();
  const category = CATEGORIES.find(c => c.id === data.categoryId) || CATEGORIES[0];
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
    downloadZipUrl: data.downloadZipUrl || '#',
    githubUrl: data.githubUrl,
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

interface FetchTemplatesParams {
  pageIndex?: number; // Optional
  pageSize?: number;  // Optional
  sorting?: SortingState; // Optional
  searchTerm?: string;
}

interface FetchTemplatesResult {
  data: Template[];
  pageCount: number;
  totalItems: number;
}

export async function getAllTemplatesFromFirestore({
  pageIndex = 0,
  pageSize = 0, // Default to 0 for fetching all (or no limit)
  sorting = [{ id: 'createdAt', desc: true }],
  searchTerm,
}: FetchTemplatesParams = {}): Promise<FetchTemplatesResult> { // Default empty object if no params
  try {
    const templatesCollection = collection(db, TEMPLATES_COLLECTION);
    const constraints: QueryConstraint[] = [];

    // Count total items
    // For simplicity, count query doesn't include searchTerm for now.
    // For accurate count with search, searchTerm logic would need to be included in count constraints.
    const countSnapshot = await getCountFromServer(query(templatesCollection, ...(searchTerm ? [where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff')] : []))); // Basic search count idea
    const totalItems = countSnapshot.data().count;

    // Sorting
    if (sorting && sorting.length > 0) {
      const sortItem = sorting[0];
      const sortField = sortItem.id === 'category.name' ? 'categoryId' : sortItem.id;
      if (['title', 'price', 'createdAt', 'categoryId'].includes(sortField)) {
        constraints.push(orderBy(sortField, sortItem.desc ? 'desc' : 'asc'));
      } else {
         constraints.push(orderBy('createdAt', 'desc')); // Default if field not recognized for sort
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc')); // Default sort
    }

    // Pagination - only apply if pageSize is explicitly set and > 0
    if (pageSize > 0) {
      constraints.push(firestoreLimit(pageSize));
      if (pageIndex > 0) {
        // Create a query to get the last document of the previous page
        // This requires re-applying sort orders correctly
        const cursorQueryConstraints = [...constraints.filter(c => c.type !== 'limit' && c.type !== 'startAfter'), firestoreLimit(pageIndex * pageSize)];
        const cursorSnapshot = await getDocs(query(templatesCollection, ...cursorQueryConstraints));
         if (cursorSnapshot.docs.length === pageIndex * pageSize && cursorSnapshot.docs.length > 0) {
          const lastDocInPreviousPages = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
          constraints.push(firestoreStartAfter(lastDocInPreviousPages));
        } else if (pageIndex > 0 && (cursorSnapshot.docs.length === 0 || cursorSnapshot.docs.length < pageIndex * pageSize )) {
           // Requested page is out of bounds
           return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
        }
      }
    }
    // If pageSize is 0, no limit is applied (fetches all matching search/sort)

    const dataQuery = query(templatesCollection, ...constraints);
    const querySnapshot = await getDocs(dataQuery);
    let data = querySnapshot.docs.map(docSnapshot => fromFirestore(docSnapshot));

    // If searchTerm is provided and pageSize was 0 (meaning we fetched all), filter client-side
    // For server-side search with pagination, searchTerm needs to be part of the main query using `where` clauses.
    // This example keeps it simpler for the public page use case.
    if (searchTerm && pageSize === 0) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      data = data.filter(template =>
        template.title.toLowerCase().includes(lowerSearchTerm) ||
        template.description.toLowerCase().includes(lowerSearchTerm) ||
        template.category.name.toLowerCase().includes(lowerSearchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
    } else if (searchTerm && pageSize > 0) {
        // If pageSize > 0, server-side search filtering should ideally happen in the query constraints.
        // Firestore's `where` clauses for partial text search are limited.
        // For this example, we are not adding complex `where` for `searchTerm` in paginated queries
        // to keep the example straightforward. A real app would use a search service or more specific `where` clauses.
        // So, if searchTerm is used with pagination, the results might not be perfectly filtered server-side by all text fields.
    }

    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;
    // If pageSize was 0, we fetched all, so totalItems is data.length if searchTerm was applied client-side.
    // For consistency, we'll use totalItems from the initial count, acknowledging this discrepancy for client-side search.
    const finalTotalItems = pageSize === 0 && searchTerm ? data.length : totalItems;


    return { data, pageCount: pageSize > 0 ? Math.ceil(finalTotalItems / pageSize) : 1, totalItems: finalTotalItems };

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

    