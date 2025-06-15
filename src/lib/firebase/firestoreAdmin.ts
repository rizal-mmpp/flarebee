
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '@/lib/types';

const USERS_COLLECTION = 'users';

// Helper to convert Firestore doc to UserProfile object
const fromFirestoreUserProfile = (docSnapshot: any): UserProfile => {
  const data = docSnapshot.data();
  let createdAtDate = new Date(); 
  if (data.createdAt && typeof (data.createdAt as Timestamp).toDate === 'function') {
    createdAtDate = (data.createdAt as Timestamp).toDate();
  } else if (data.createdAt) { // If it's already a string or number, try to parse
    try {
      createdAtDate = new Date(data.createdAt);
      if (isNaN(createdAtDate.getTime())) createdAtDate = new Date(); // Invalid date parsed
    } catch (e) {
      createdAtDate = new Date(); // Fallback
    }
  }

  return {
    uid: docSnapshot.id, // Firestore document ID is the UID
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role || 'user',
    createdAt: createdAtDate,
  } as UserProfile;
};


export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => fromFirestoreUserProfile(docSnapshot));
  } catch (error) {
    console.error("Error getting all user profiles from Firestore: ", error);
    throw error;
  }
}
