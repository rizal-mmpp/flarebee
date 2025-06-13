
'use client';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '@/lib/types';

// displayNameParam is added to allow passing displayName from email/password signup
export async function createUserProfile(user: FirebaseUser, displayNameParam?: string | null): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, email, photoURL } = user;
    // Use displayNameParam if provided, otherwise fallback to user.displayName (e.g., from Google)
    const resolvedDisplayName = displayNameParam || user.displayName; 

    const newUserProfile: UserProfile = {
      uid,
      email,
      displayName: resolvedDisplayName,
      photoURL: photoURL || null,
      role: 'user', 
      createdAt: new Date(), 
    };
    try {
      await setDoc(userRef, {
        ...newUserProfile,
        createdAt: serverTimestamp(), 
      });
      return { ...newUserProfile, createdAt: new Date() }; 
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }
  const existingProfileData = userSnap.data();
  let createdAtDate = new Date(); // Default to now

  if (existingProfileData.createdAt && typeof existingProfileData.createdAt.toDate === 'function') {
    createdAtDate = (existingProfileData.createdAt as Timestamp).toDate();
  } else {
    console.warn(`User profile ${existingProfileData.uid} has an invalid or missing 'createdAt' field. Defaulting to current date.`);
    // Optionally, you might want to update the Firestore document with a serverTimestamp here if it's missing
    // await setDoc(userRef, { createdAt: serverTimestamp() }, { merge: true });
  }
  
  const existingProfile: UserProfile = {
    uid: existingProfileData.uid,
    email: existingProfileData.email,
    displayName: existingProfileData.displayName,
    photoURL: existingProfileData.photoURL,
    role: existingProfileData.role || 'user',
    createdAt: createdAtDate,
  };
  
  // If displayNameParam is provided and different from existing, update it.
  // This could happen if a user signs up, then logs in with Google, and Google's name is preferred later.
  // Or if user info was partially created.
  if (displayNameParam && displayNameParam !== existingProfile.displayName) {
    try {
      await setDoc(userRef, { displayName: displayNameParam }, { merge: true });
      existingProfile.displayName = displayNameParam;
    } catch (error) {
      console.error('Error updating displayName during profile creation check:', error);
    }
  }
  
  return existingProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    let createdAtDate = new Date(); // Default to now

    if (userData.createdAt && typeof userData.createdAt.toDate === 'function') {
      createdAtDate = (userData.createdAt as Timestamp).toDate();
    } else {
      console.warn(`User profile ${uid} from getUserProfile has an invalid or missing 'createdAt' field. Defaulting to current date.`);
    }

    return {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role || 'user', // Ensure role defaults to 'user' if missing
      createdAt: createdAtDate,
    } as UserProfile;
  }
  return null;
}

