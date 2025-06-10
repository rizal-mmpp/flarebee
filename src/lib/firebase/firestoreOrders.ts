
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Order, OrderInputData, PurchasedTemplateItem } from '@/lib/types';

const ORDERS_COLLECTION = 'orders';

// Helper to convert Firestore doc to Order object
const fromFirestoreOrder = (docSnapshot: any): Order => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    userId: data.userId,
    userEmail: data.userEmail,
    orderId: data.orderId,
    items: data.items as PurchasedTemplateItem[],
    totalAmount: data.totalAmount,
    currency: data.currency,
    status: data.status,
    paymentGateway: data.paymentGateway,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
  };
};

export async function createOrderInFirestore(orderData: OrderInputData): Promise<Order> {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp(), // Ensure server timestamp is used
    });
    const newOrderSnapshot = await getDoc(docRef);
    return fromFirestoreOrder(newOrderSnapshot);
  } catch (error) {
    console.error("Error creating order in Firestore: ", error);
    throw error;
  }
}

export async function getOrdersByUserIdFromFirestore(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => fromFirestoreOrder(docSnapshot));
  } catch (error) {
    console.error("Error getting orders by user ID from Firestore: ", error);
    throw error;
  }
}

export async function getAllOrdersFromFirestore(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => fromFirestoreOrder(docSnapshot));
  } catch (error) {
    console.error("Error getting all orders from Firestore: ", error);
    throw error;
  }
}
