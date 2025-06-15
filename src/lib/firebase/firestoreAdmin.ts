
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  getCountFromServer,
  where,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '@/lib/types';
import type { SortingState } from '@tanstack/react-table';

const USERS_COLLECTION = 'users';

const fromFirestoreUserProfile = (docSnapshot: QueryDocumentSnapshot<DocumentData>): UserProfile => {
  const data = docSnapshot.data();
  let createdAtDate = new Date();
  if (data.createdAt && typeof (data.createdAt as Timestamp).toDate === 'function') {
    createdAtDate = (data.createdAt as Timestamp).toDate();
  } else if (data.createdAt) {
    try {
      createdAtDate = new Date(data.createdAt);
      if (isNaN(createdAtDate.getTime())) createdAtDate = new Date();
    } catch (e) {
      createdAtDate = new Date();
    }
  }

  return {
    uid: docSnapshot.id,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role || 'user',
    createdAt: createdAtDate,
  } as UserProfile;
};

interface FetchUsersParams {
  pageIndex?: number;
  pageSize?: number;
  sorting?: SortingState;
  searchTerm?: string;
}

interface FetchUsersResult {
  data: UserProfile[];
  pageCount: number;
  totalItems: number;
}

export async function getAllUserProfiles({
  pageIndex = 0,
  pageSize = 0, // Default to 0 to fetch all if not specified
  sorting = [{ id: 'createdAt', desc: true }],
  searchTerm,
}: FetchUsersParams = {}): Promise<FetchUsersResult> {
  try {
    const usersCollection = collection(db, USERS_COLLECTION);
    const constraints: QueryConstraint[] = [];
    
    // Simplified count for now. For accurate search count, searchTerm logic would be needed here.
    const countQuery = query(usersCollection);
    const countSnapshot = await getCountFromServer(countQuery);
    let totalItems = countSnapshot.data().count;

    if (sorting && sorting.length > 0) {
      const sortItem = sorting[0];
      // Ensure sortItem.id is a valid field in UserProfile for Firestore sorting
      if (['displayName', 'email', 'createdAt', 'role'].includes(sortItem.id)) {
          constraints.push(orderBy(sortItem.id, sortItem.desc ? 'desc' : 'asc'));
      } else {
          constraints.push(orderBy('createdAt', 'desc')); // Default sort
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    if (pageSize > 0) {
      constraints.push(firestoreLimit(pageSize));
      if (pageIndex > 0) {
        const cursorQueryConstraints = [...constraints.filter(c => c.type !== 'limit' && c.type !== 'startAfter'), firestoreLimit(pageIndex * pageSize)];
        const cursorSnapshot = await getDocs(query(usersCollection, ...cursorQueryConstraints));
        if (cursorSnapshot.docs.length === pageIndex * pageSize && cursorSnapshot.docs.length > 0) {
            const lastDocInPreviousPages = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
            constraints.push(firestoreStartAfter(lastDocInPreviousPages));
        } else if (pageIndex > 0 && cursorSnapshot.docs.length < pageIndex * pageSize) {
            return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
        }
      }
    }

    const dataQuery = query(usersCollection, ...constraints);
    const querySnapshot = await getDocs(dataQuery);
    let data = querySnapshot.docs.map(docSnapshot => fromFirestoreUserProfile(docSnapshot));

    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        data = data.filter(user => 
            (user.displayName && user.displayName.toLowerCase().includes(lowerSearchTerm)) ||
            (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
        );
        // If not paginating (pageSize=0), update totalItems to reflect search results.
        if (pageSize === 0) {
            totalItems = data.length;
        }
        // Note: If paginating, totalItems and pageCount might be less accurate with client-side search.
    }

    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    return { data, pageCount, totalItems };
  } catch (error) {
    console.error("Error getting all user profiles from Firestore: ", error);
    throw error; 
  }
}
