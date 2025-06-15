
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
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  searchTerm?: string;
}

interface FetchTemplatesResult {
  data: Template[];
  pageCount: number;
  totalItems: number;
}

export async function getAllTemplatesFromFirestore({
  pageIndex,
  pageSize,
  sorting,
  searchTerm,
}: FetchTemplatesParams): Promise<FetchTemplatesResult> {
  try {
    const templatesCollection = collection(db, TEMPLATES_COLLECTION);
    const constraints: QueryConstraint[] = [];

    // Count total items (ideally with filter if searchTerm was effectively applied server-side)
    const countSnapshot = await getCountFromServer(templatesCollection);
    const totalItems = countSnapshot.data().count;

    if (sorting && sorting.length > 0) {
      const sortItem = sorting[0];
      // Ensure field exists (e.g. 'title', 'price', 'createdAt')
      if (['title', 'price', 'createdAt', 'category.name'].includes(sortItem.id)) {
        // Sorting by category.name is tricky directly in Firestore if category is an object.
        // If categoryId is stored, sort by categoryId. For name, it might require client-side sort or data denormalization.
        // For now, let's assume categoryId if sorting by category
        const sortField = sortItem.id === 'category.name' ? 'categoryId' : sortItem.id;
        constraints.push(orderBy(sortField, sortItem.desc ? 'desc' : 'asc'));
      } else {
         constraints.push(orderBy('createdAt', 'desc'));
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    constraints.push(firestoreLimit(pageSize));
    if (pageIndex > 0) {
      const cursorQueryConstraints = [...constraints.filter(c => c.type !== 'limit'), firestoreLimit(pageIndex * pageSize)];
      const cursorSnapshot = await getDocs(query(templatesCollection, ...cursorQueryConstraints));
       if (cursorSnapshot.docs.length === pageIndex * pageSize && cursorSnapshot.docs.length > 0) {
        const lastDocInPreviousPages = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        constraints.push(firestoreStartAfter(lastDocInPreviousPages));
      } else if (pageIndex > 0 && cursorSnapshot.docs.length < pageIndex * pageSize) {
         return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
      }
    }

    const dataQuery = query(templatesCollection, ...constraints);
    const querySnapshot = await getDocs(dataQuery);
    let data = querySnapshot.docs.map(docSnapshot => fromFirestore(docSnapshot));

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      data = data.filter(template =>
        template.title.toLowerCase().includes(lowerSearchTerm) ||
        template.description.toLowerCase().includes(lowerSearchTerm) ||
        template.category.name.toLowerCase().includes(lowerSearchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
      // totalItems and pageCount will be less accurate with client-side filtering for search
    }

    const pageCount = Math.ceil(totalItems / pageSize);
    return { data, pageCount, totalItems };

  } catch (error) {
    console.error("Error getting all templates from Firestore: ", error);
    throw error;
  }
}

// getLimitedTemplatesFromFirestore might not be needed if getAllTemplatesFromFirestore handles pagination
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
