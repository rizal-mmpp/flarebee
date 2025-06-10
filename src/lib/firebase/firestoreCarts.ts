
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { CartItem } from '@/lib/types';

const USER_CARTS_COLLECTION = 'userCarts';

export async function getUserCartFromFirestore(userId: string): Promise<CartItem[] | null> {
  if (!userId) return null;
  try {
    const cartRef = doc(db, USER_CARTS_COLLECTION, userId);
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      return (data?.items as CartItem[]) || [];
    }
    return null;
  } catch (error) {
    console.error("Error getting user cart from Firestore:", error);
    return null;
  }
}

export async function updateUserCartInFirestore(userId: string, cartItems: CartItem[]): Promise<void> {
  if (!userId) return;
  try {
    const cartRef = doc(db, USER_CARTS_COLLECTION, userId);
    await setDoc(cartRef, {
      items: cartItems,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user cart in Firestore:", error);
    // Propagate the error or handle it (e.g., show a toast in CartContext)
  }
}

export async function deleteUserCartFromFirestore(userId: string): Promise<void> {
  if (!userId) {
    // Optionally: throw new Error("User ID is required to delete cart.");
    return;
  }
  try {
    const cartRef = doc(db, USER_CARTS_COLLECTION, userId);
    await deleteDoc(cartRef);
  } catch (error) {
    console.error("Error deleting user cart from Firestore:", error);
    throw error; // Re-throw the error so the caller can handle it
  }
}
