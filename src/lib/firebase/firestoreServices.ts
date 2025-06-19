
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
  documentId, 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Service, FetchServicesParams, FetchServicesResult, ServiceCategory } from '@/lib/types'; // Updated types
import { SERVICE_CATEGORIES } from '@/lib/constants'; // Updated constants

const SERVICES_COLLECTION = 'services'; // Renamed collection

// Helper to convert Firestore doc to Service object
const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Service => {
  const data = docSnapshot.data();
  const category = SERVICE_CATEGORIES.find(c => c.id === data.categoryId) || SERVICE_CATEGORIES[0]; // Use SERVICE_CATEGORIES
  return {
    id: docSnapshot.id,
    title: data.title,
    title_lowercase: data.title_lowercase || data.title?.toLowerCase() || '',
    shortDescription: data.shortDescription || '',
    longDescription: data.longDescription || '',
    category: category,
    pricingModel: data.pricingModel || 'Custom Quote',
    priceMin: data.priceMin, // May be undefined
    priceMax: data.priceMax, // May be undefined
    currency: data.currency || 'IDR',
    tags: data.tags || [],
    imageUrl: data.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: data.dataAiHint || '',
    status: data.status || 'draft',
    keyFeatures: data.keyFeatures || [],
    targetAudience: data.targetAudience || [],
    estimatedDuration: data.estimatedDuration || '',
    portfolioLink: data.portfolioLink || '',
    createdAt: (data.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
  };
};

export async function getAllServicesFromFirestore({
  pageIndex = 0,
  pageSize = 10,
}: FetchServicesParams = {}): Promise<FetchServicesResult> { // Updated types
  try {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const dataQueryConstraints: QueryConstraint[] = [];
    
    dataQueryConstraints.push(orderBy('createdAt', 'desc'));
    dataQueryConstraints.push(orderBy(documentId(), 'asc'));

    const countQuery = query(servicesCollection);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalItems = countSnapshot.data().count;

    if (totalItems === 0) {
      return { data: [], pageCount: 0, totalItems: 0 };
    }

    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    if (pageSize > 0 && pageIndex > 0) {
      const docsToSkip = pageIndex * pageSize;
      const cursorDeterminingQueryConstraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        orderBy(documentId(), 'asc'),
        firestoreLimit(docsToSkip)
      ];
      
      const cursorSnapshot = await getDocs(query(servicesCollection, ...cursorDeterminingQueryConstraints));

      if (cursorSnapshot.docs.length === docsToSkip && cursorSnapshot.docs.length > 0) {
        const lastVisibleDoc = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        dataQueryConstraints.push(firestoreStartAfter(lastVisibleDoc));
      } else if (cursorSnapshot.docs.length < docsToSkip) {
        return { data: [], pageCount, totalItems };
      }
    }

    const existingLimitIndex = dataQueryConstraints.findIndex(c => c.type === 'limit');
    if (existingLimitIndex !== -1) {
        dataQueryConstraints.splice(existingLimitIndex, 1);
    }
    if (pageSize > 0) {
        dataQueryConstraints.push(firestoreLimit(pageSize));
    }
    
    const finalDataQuery = query(servicesCollection, ...dataQueryConstraints);
    const dataSnapshot = await getDocs(finalDataQuery);
    const data = dataSnapshot.docs.map(doc => fromFirestore(doc));
    
    return { data, pageCount, totalItems };

  } catch (error: any) {
    console.error("Error getting all services from Firestore: ", error);
    if (error.code === 'failed-precondition') {
      console.error("Firestore 'failed-precondition'. Index missing? Expected: (createdAt DESC, __name__ ASC).");
      throw new Error(`Firestore query requires an index. Original error: ${error.message}`);
    }
    throw error;
  }
}

export async function getServiceByIdFromFirestore(id: string): Promise<Service | null> { // Updated type
  try {
    const docRef = doc(db, SERVICES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return fromFirestore(docSnap);
    } else {
      console.log("No such service document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting service by ID from Firestore: ", error);
    throw error;
  }
}
