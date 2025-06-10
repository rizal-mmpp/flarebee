
'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { deleteUserCartFromFirestore } from '@/lib/firebase/firestoreCarts';
import { createOrderInFirestore } from '@/lib/firebase/firestoreOrders';
import type { CartItem, PurchasedTemplateItem, OrderInputData } from '@/lib/types';

// Interface for items specifically formatted for Xendit API (if needed)
interface XenditFormattedItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  url?: string;
}

interface CreateXenditInvoiceArgs {
  cartItemsForOrder: CartItem[]; // Original cart items for creating the order
  xenditFormattedItems: XenditFormattedItem[]; // Items formatted for Xendit
  totalAmount: number;
  description: string;
  currency?: string;
  payerEmail?: string;
  userId?: string; // User ID for cart clearing and order creation
  orderId?: string; // Optional pre-generated order ID
}

interface CreateXenditInvoiceErrorResult {
  error: string;
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceErrorResult | void> {
  console.log("SIMULATING Xendit invoice creation with dummy data and server-side redirect.");

  try {
    const hostHeaders = await headers();
    const host = hostHeaders.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    if (!host) {
      console.error("Error in createXenditInvoice: Host header is missing or null.");
      return { error: "Failed to determine application host. Cannot proceed with payment." };
    }
    const appBaseUrl = `${protocol}://${host}`;

    const uniquePaymentId = args.orderId || `flarebee-dummy-${randomUUID()}`; // This acts as the payment transaction ID

    // --- Create Order in Firestore if userId is provided ---
    if (args.userId && args.cartItemsForOrder.length > 0) {
      const purchasedItems: PurchasedTemplateItem[] = args.cartItemsForOrder.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
      }));

      const orderData: OrderInputData = {
        userId: args.userId,
        userEmail: args.payerEmail,
        orderId: uniquePaymentId, // Use the payment ID as the orderId
        items: purchasedItems,
        totalAmount: args.totalAmount,
        currency: args.currency || 'USD',
        status: 'completed', // For dummy flow, always completed
        paymentGateway: 'xendit_dummy',
        // createdAt will be set by serverTimestamp in createOrderInFirestore
      };

      try {
        console.log(`Attempting to create order for user ID: ${args.userId}`);
        await createOrderInFirestore(orderData);
        console.log(`Order created successfully for user ID: ${args.userId}, Order ID: ${uniquePaymentId}`);
      } catch (orderError: any) {
        console.error(`Error creating order for user ID ${args.userId}:`, orderError.message);
        // For a real system, you might want to return an error or handle this more gracefully.
        // For the dummy flow, we'll log and proceed with cart clearing & redirect.
        // return { error: "Failed to save your order. Please try again or contact support." };
      }
    } else if (!args.userId) {
        console.log("No userId provided, skipping order creation (anonymous user or no items).");
    }


    // --- Attempt to clear cart server-side if userId is provided ---
    if (args.userId) {
      try {
        console.log(`Attempting to clear cart for user ID: ${args.userId} server-side.`);
        await deleteUserCartFromFirestore(args.userId);
        console.log(`Cart cleared successfully for user ID: ${args.userId} server-side.`);
      } catch (cartClearError: any) {
        console.error(`Error clearing cart server-side for user ID ${args.userId}:`, cartClearError.message);
      }
    } else {
      console.log("No userId provided, skipping server-side cart clearing (anonymous user).");
    }
    // --- End cart clearing ---

    const successRedirectUrl = new URL(`/purchase/success`, appBaseUrl);
    successRedirectUrl.searchParams.append('order_id', uniquePaymentId);
    successRedirectUrl.searchParams.append('source', 'xendit_dummy');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    redirect(successRedirectUrl.toString());

  } catch (internalError: any) {
    // Re-throw Next.js redirect signals
    if (internalError && typeof internalError.digest === 'string' && internalError.digest.startsWith('NEXT_REDIRECT')) {
      throw internalError;
    }
    console.error("Internal error in createXenditInvoice (dummy implementation):", internalError);
    return {
      error: "An internal server error occurred while preparing your payment. Please try again or contact support.",
    };
  }
}
