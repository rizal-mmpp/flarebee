
'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { Xendit } from 'xendit-node';
import { deleteUserCartFromFirestore } from '@/lib/firebase/firestoreCarts';
import { createOrderInFirestore } from '@/lib/firebase/firestoreOrders';
import type { CartItem, PurchasedTemplateItem, OrderInputData } from '@/lib/types';

// Initialize Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

const { Invoice } = xenditClient;

interface XenditFormattedItem {
  name: string;
  quantity: number;
  price: number; // Price per unit in IDR
  category?: string;
  url?: string; // Optional: URL to the item page
}

interface CreateXenditInvoiceArgs {
  cartItemsForOrder: CartItem[];
  xenditFormattedItems: XenditFormattedItem[];
  totalAmount: number; // Total amount in IDR
  description: string;
  currency?: string; // Should be 'IDR'
  payerEmail?: string;
  userId?: string;
  orderId?: string; // Optional pre-generated order ID, will be used as external_id
}

interface CreateXenditInvoiceErrorResult {
  error: string;
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceErrorResult | void> {
  if (!process.env.XENDIT_SECRET_KEY) {
    console.error("XENDIT_SECRET_KEY is not set in environment variables.");
    return { error: "Payment gateway configuration error. Please contact support." };
  }

  try {
    const hostHeaders = await headers();
    const host = hostHeaders.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    if (!host) {
      console.error("Error in createXenditInvoice: Host header is missing or null.");
      return { error: "Failed to determine application host. Cannot proceed with payment." };
    }
    const appBaseUrl = `${protocol}://${host}`;

    const externalId = args.orderId || `flarebee-order-${randomUUID()}`;
    const resolvedCurrency = args.currency || 'IDR';

    if (resolvedCurrency !== 'IDR') {
        console.warn(`Currency specified was ${args.currency}, but forcing IDR for Xendit.`);
    }

    // --- Create Order in Firestore with 'pending' status ---
    let createdOrderIdInFirestore: string | undefined;
    if (args.userId && args.cartItemsForOrder.length > 0) {
      const purchasedItems: PurchasedTemplateItem[] = args.cartItemsForOrder.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price, // Assuming price is already in IDR
      }));

      const orderData: OrderInputData = {
        userId: args.userId,
        userEmail: args.payerEmail,
        orderId: externalId, // This is the Xendit external_id
        items: purchasedItems,
        totalAmount: args.totalAmount,
        currency: 'IDR',
        status: 'pending', // Initial status
        paymentGateway: 'xendit',
      };

      try {
        const createdOrder = await createOrderInFirestore(orderData);
        createdOrderIdInFirestore = createdOrder.id; // Firestore document ID
        console.log(`Order ${externalId} (doc ID: ${createdOrderIdInFirestore}) created with status 'pending' for user ID: ${args.userId}`);
      } catch (orderError: any) {
        console.error(`Error creating order in Firestore for user ID ${args.userId}:`, orderError.message);
        return { error: "Failed to save your order. Please try again or contact support." };
      }
    } else if (args.cartItemsForOrder.length === 0 && args.userId) {
        console.log("Cart is empty, skipping order creation in Firestore.");
    } else {
      console.log("No userId provided or cart empty, skipping order creation in Firestore.");
    }
    // --- End Order Creation ---

    const xenditInvoicePayload = {
      externalId: externalId,
      amount: args.totalAmount,
      payerEmail: args.payerEmail,
      description: args.description,
      currency: 'IDR',
      items: args.xenditFormattedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        url: item.url,
      })),
      successRedirectUrl: `${appBaseUrl}/purchase/success?external_id=${externalId}&source=xendit`,
      failureRedirectUrl: `${appBaseUrl}/purchase/cancelled?external_id=${externalId}&source=xendit`,
      customer: args.payerEmail ? { email: args.payerEmail } : undefined,
    };

    console.log("Creating Xendit invoice with payload:", JSON.stringify(xenditInvoicePayload, null, 2));
    const invoice = await Invoice.createInvoice({ data: xenditInvoicePayload });
    console.log("Xendit invoice created:", invoice);

    if (!invoice.invoiceUrl) {
        console.error("Xendit invoice creation succeeded but no invoice_url was returned.", invoice);
        return { error: "Failed to get payment URL from gateway. Please try again." };
    }

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

    redirect(invoice.invoiceUrl);

  } catch (error: any) {
    if (error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error("Error in createXenditInvoice:", error);
    let errorMessage = "An unexpected error occurred while processing your payment.";
    if (error.status && error.message) { 
        errorMessage = `Payment Gateway Error (${error.status}): ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}

