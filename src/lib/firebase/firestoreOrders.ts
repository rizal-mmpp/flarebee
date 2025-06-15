
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
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  getCountFromServer,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Order, OrderInputData, PurchasedTemplateItem } from '@/lib/types';
import type { SortingState } from '@tanstack/react-table';


const ORDERS_COLLECTION = 'orders';

// Helper to convert Firestore doc to Order object
const fromFirestoreOrder = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Order => {
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
    // Type assertion needed as getDoc returns DocumentSnapshot<DocumentData>
    return fromFirestoreOrder(newOrderSnapshot as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error creating order in Firestore: ", error);
    throw error;
  }
}

export async function updateOrderStatusInFirestore(
  orderDocId: string, 
  newStatus: Order['status'],
  xenditPaymentStatus?: string
): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderDocId);
    const updateData: any = { 
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


interface FetchOrdersParams {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  searchTerm?: string; // For searching by orderId or userEmail
}

interface FetchOrdersResult {
  data: Order[];
  pageCount: number;
  totalItems: number;
}

export async function getAllOrdersFromFirestore({
  pageIndex,
  pageSize,
  sorting,
  searchTerm,
}: FetchOrdersParams): Promise<FetchOrdersResult> {
  try {
    const ordersCollection = collection(db, ORDERS_COLLECTION);
    const constraints: QueryConstraint[] = [];

    // Note: Firestore is limited for multi-field text search.
    // This search will be basic. For complex search, use a dedicated search service.
    // If searchTerm is provided, we might need to query twice or filter client-side for some fields.
    // For simplicity, the count will be for all orders, and search applied to the fetched page.
    // A more advanced setup would filter server-side more effectively.
    
    const countSnapshot = await getCountFromServer(ordersCollection);
    const totalItems = countSnapshot.data().count;

    if (sorting && sorting.length > 0) {
      const sortItem = sorting[0];
      // Ensure field exists in Firestore for sorting (e.g. 'totalAmount', 'createdAt')
      if (['orderId', 'userEmail', 'totalAmount', 'createdAt', 'status'].includes(sortItem.id)) {
        constraints.push(orderBy(sortItem.id, sortItem.desc ? 'desc' : 'asc'));
      } else {
        constraints.push(orderBy('createdAt', 'desc')); // Default sort if invalid field
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc')); // Default sort
    }

    constraints.push(firestoreLimit(pageSize));
    if (pageIndex > 0) {
      const cursorQueryConstraints = [...constraints.filter(c => c.type !== 'limit'), firestoreLimit(pageIndex * pageSize)];
      const cursorSnapshot = await getDocs(query(ordersCollection, ...cursorQueryConstraints));
      if (cursorSnapshot.docs.length === pageIndex * pageSize && cursorSnapshot.docs.length > 0) {
        const lastDocInPreviousPages = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        constraints.push(firestoreStartAfter(lastDocInPreviousPages));
      } else if (pageIndex > 0 && cursorSnapshot.docs.length < pageIndex * pageSize) {
         return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
      }
    }

    const dataQuery = query(ordersCollection, ...constraints);
    const querySnapshot = await getDocs(dataQuery);
    let data = querySnapshot.docs.map(docSnapshot => fromFirestoreOrder(docSnapshot));

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      data = data.filter(order =>
        order.orderId.toLowerCase().includes(lowerSearchTerm) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(lowerSearchTerm)) ||
        order.status.toLowerCase().includes(lowerSearchTerm)
      );
      // totalItems and pageCount might be inexact if searchTerm filters significantly.
      // For precise server-side search pagination, searchTerm should be part of the count query.
    }
    
    const pageCount = Math.ceil(totalItems / pageSize);
    return { data, pageCount, totalItems };

  } catch (error) {
    console.error("Error getting all orders from Firestore: ", error);
    throw error;
  }
}

export async function getOrderByOrderIdFromFirestore(orderId: string): Promise<Order | null> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('orderId', '==', orderId), 
      firestoreLimit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
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
      firestoreLimit(1)
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
