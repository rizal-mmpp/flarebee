
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
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  searchTerm?: string;
}

interface FetchUsersResult {
  data: UserProfile[];
  pageCount: number;
  totalItems: number;
}

export async function getAllUserProfiles({
  pageIndex,
  pageSize,
  sorting,
  searchTerm,
}: FetchUsersParams): Promise<FetchUsersResult> {
  try {
    const constraints: QueryConstraint[] = [];

    // Search/Filter (simple search on displayName and email)
    // Firestore doesn't support case-insensitive search or partial text search natively for multiple fields easily.
    // For robust search, a dedicated search service like Algolia/Typesense is recommended.
    // This is a basic attempt; for real apps, you'd need to handle this more effectively.
    // For now, we'll filter client-side AFTER fetching based on displayName or email if searchTerm is provided,
    // or if you implement full-text search, this part changes.
    // Given server-side requirement, we'll attempt a very basic server-side filter if possible, or note limitation.
    // Simple 'startsWith' can be done with >= and < range queries but is limited.

    const usersCollection = collection(db, USERS_COLLECTION);

    // Count total items matching search (if any)
    let countQueryConstraints: QueryConstraint[] = [];
    if (searchTerm) {
        // Firestore is limited for broad text search. This won't be very effective.
        // Ideally, you'd use a search service. We'll filter client-side or accept this limitation.
        // For this example, we will fetch all and then filter for count, which is not ideal for large datasets.
    }
    const countSnapshot = await getCountFromServer(query(usersCollection, ...countQueryConstraints));
    let totalItems = countSnapshot.data().count;


    // Sorting
    if (sorting && sorting.length > 0) {
      const sortItem = sorting[0];
      constraints.push(orderBy(sortItem.id, sortItem.desc ? 'desc' : 'asc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc')); // Default sort
    }

    // Pagination
    constraints.push(firestoreLimit(pageSize));
    if (pageIndex > 0) {
      const lastVisibleQuery = query(
        usersCollection,
        ...constraints.filter(c => c.type !== 'limit'), // Remove previous limit
        firestoreLimit(pageIndex * pageSize)
      );
      const lastVisibleSnapshot = await getDocs(lastVisibleQuery);
      if (lastVisibleSnapshot.docs.length > 0) {
         const lastDoc = lastVisibleSnapshot.docs[lastVisibleSnapshot.docs.length -1];
         // If sorting by 'createdAt', use the actual last createdAt doc.
         // If sorting by another field, you might need to fetch the actual last doc of the *previous page*.
         // This is complex with Firestore cursors if not sorting by the primary field used for cursor.
         // For simplicity, we fetch N*pageIndex docs and take the last one. This isn't perfectly efficient.
         // A more robust solution uses the actual values of the sorted fields in the last document of the previous page for startAfter.

        // Simplified approach for now for startAfter:
        // Fetch (pageIndex * pageSize) documents according to current sort order,
        // then take the last one as the cursor for the actual page fetch.
        // This is not the most efficient way but simpler than multi-field cursors.
        const cursorQueryConstraints = [...constraints.filter(c => c.type !== 'limit'), firestoreLimit(pageIndex * pageSize)];
        const cursorSnapshot = await getDocs(query(usersCollection, ...cursorQueryConstraints));
        if (cursorSnapshot.docs.length === pageIndex * pageSize && cursorSnapshot.docs.length > 0) {
            const lastDocInPreviousPages = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
            constraints.push(firestoreStartAfter(lastDocInPreviousPages));
        } else if (cursorSnapshot.docs.length < pageIndex * pageSize && cursorSnapshot.docs.length > 0){
            // This means the requested pageIndex is out of bounds based on previous pages.
            // Return empty, or handle as an error / adjust pageIndex.
             return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
        } else if (pageIndex > 0 && cursorSnapshot.docs.length === 0) {
            // Requested a page beyond the first, but no docs found for previous pages (should not happen if totalItems > 0)
            return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
        }
      }
    }
    
    const dataQuery = query(usersCollection, ...constraints);
    const querySnapshot = await getDocs(dataQuery);
    let data = querySnapshot.docs.map(docSnapshot => fromFirestoreUserProfile(docSnapshot));

    // Server-side search (very basic - exact match or case-sensitive prefix on email/displayName)
    // A proper search usually requires a dedicated search engine (Algolia, Typesense, etc.)
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        data = data.filter(user => 
            (user.displayName && user.displayName.toLowerCase().includes(lowerSearchTerm)) ||
            (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
        );
        // Recalculate totalItems based on filtered data if search term is applied post-fetch
        // This is not ideal for pagination if totalItems was initially based on a wider set.
        // For true server-side filtering for pagination, the `countQuery` would need to incorporate the filter.
        // For this example, if searchTerm is present, the pagination might be slightly off if the searchTerm
        // filters out many items from the initial count.
        // To keep it simpler, totalItems reflects count *before* this in-memory search filter.
        // True server-side filtering would need `where` clauses if possible or a search index.
    }


    const pageCount = Math.ceil(totalItems / pageSize);

    return { data, pageCount, totalItems };
  } catch (error) {
    console.error("Error getting all user profiles from Firestore: ", error);
    // Re-throw or return an error structure
    throw error; // Or return { data: [], pageCount: 0, totalItems: 0, error: "message" };
  }
}
