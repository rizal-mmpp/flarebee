
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
  limit,
  updateDoc,
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
    status: data.status as Order['status'],
    paymentGateway: data.paymentGateway,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
    xenditInvoiceId: data.xenditInvoiceId,
    xenditInvoiceUrl: data.xenditInvoiceUrl,
    xenditExpiryDate: data.xenditExpiryDate,
    xenditPaymentStatus: data.xenditPaymentStatus,
  };
};

export async function createOrderInFirestore(orderData: OrderInputData): Promise<Order> {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(), 
    });
    const newOrderSnapshot = await getDoc(docRef);
    return fromFirestoreOrder(newOrderSnapshot);
  } catch (error) {
    console.error("Error creating order in Firestore: ", error);
    throw error;
  }
}

export async function updateOrderStatusInFirestore(
  orderDocId: string, // This should be the Firestore document ID
  newStatus: Order['status'],
  xenditPaymentStatus?: string
): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderDocId);
    const updateData: any = { // Use 'any' for flexibility, or a more specific Partial<Order>
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (xenditPaymentStatus) {
      updateData.xenditPaymentStatus = xenditPaymentStatus;
    }

    await updateDoc(orderRef, updateData);
    console.log(`Order document ${orderDocId} updated: status to ${newStatus}, Xendit status to ${xenditPaymentStatus || 'N/A'}`);
  } catch (error) {
    console.error(`Error updating order ${orderDocId} status in Firestore: `, error);
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

export async function getOrderByOrderIdFromFirestore(orderId: string): Promise<Order | null> {
  try {
    // This queries by the `orderId` field which stores Xendit's external_id
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('orderId', '==', orderId), 
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Important: The updateOrderStatusInFirestore needs the Firestore document ID,
      // not the orderId (external_id). The fromFirestoreOrder helper correctly sets `id`.
      return fromFirestoreOrder(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error getting order by orderId ${orderId} from Firestore: `, error);
    throw error;
  }
}

export async function getOrderByXenditInvoiceIdFromFirestore(xenditInvoiceId: string): Promise<Order | null> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('xenditInvoiceId', '==', xenditInvoiceId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return fromFirestoreOrder(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error getting order by Xendit Invoice ID ${xenditInvoiceId} from Firestore: `, error);
    throw error;
  }
}
