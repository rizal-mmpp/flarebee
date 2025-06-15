
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
  pageIndex?: number;
  pageSize?: number;
  sorting?: SortingState;
  searchTerm?: string; // For searching by orderId or userEmail
}

interface FetchOrdersResult {
  data: Order[];
  pageCount: number;
  totalItems: number;
}

export async function getAllOrdersFromFirestore({
  pageIndex = 0,
  pageSize = 0, // Default to 0 to fetch all if not specified for pagination
  sorting = [{ id: 'createdAt', desc: true }],
  searchTerm,
}: FetchOrdersParams = {}): Promise<FetchOrdersResult> {
  try {
    const ordersCollection = collection(db, ORDERS_COLLECTION);
    const constraints: QueryConstraint[] = [];
    
    // Count total items based on whether there's a searchTerm for more accuracy
    let countQuery = query(ordersCollection);
    if (searchTerm) {
        // This is a simplification. Firestore doesn't support direct text search across multiple fields.
        // For a real app, you might do multiple queries or use a search service.
        // This count will be for all orders, which might be fine for overall total.
        // Or, you could attempt a 'where' clause for a primary search field.
    }
    const countSnapshot = await getCountFromServer(countQuery);
    let totalItems = countSnapshot.data().count;

    if (sorting && sorting.length > 0) {
      const sortItem = sorting[0];
      if (['orderId', 'userEmail', 'totalAmount', 'createdAt', 'status'].includes(sortItem.id)) {
        constraints.push(orderBy(sortItem.id, sortItem.desc ? 'desc' : 'asc'));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    if (pageSize > 0) {
      constraints.push(firestoreLimit(pageSize));
      if (pageIndex > 0) {
        const cursorQueryConstraints = [...constraints.filter(c => c.type !== 'limit' && c.type !== 'startAfter'), firestoreLimit(pageIndex * pageSize)];
        const cursorSnapshot = await getDocs(query(ordersCollection, ...cursorQueryConstraints));
        if (cursorSnapshot.docs.length === pageIndex * pageSize && cursorSnapshot.docs.length > 0) {
          const lastDocInPreviousPages = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
          constraints.push(firestoreStartAfter(lastDocInPreviousPages));
        } else if (pageIndex > 0 && cursorSnapshot.docs.length < pageIndex * pageSize) {
           return { data: [], pageCount: Math.ceil(totalItems / pageSize), totalItems };
        }
      }
    }
    // If pageSize is 0, no limit is applied, fetching all matching documents.

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
      if (pageSize > 0) { // If paginating, totalItems and pageCount could be affected by search
        // For true server-side search pagination, totalItems should be the count of *searched* items.
        // This is complex with Firestore without a dedicated search index.
        // Here, we might return the filtered data length as totalItems for the current page view.
        // Or, for simplicity, keep totalItems as the grand total and accept that pageCount might be approximate for searches.
      } else { // If not paginating (pageSize=0), update totalItems to reflect the search results.
        totalItems = data.length;
      }
    }
    
    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;
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
