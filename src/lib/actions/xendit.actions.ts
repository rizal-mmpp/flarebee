
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
  secretKey: process.env.XENDIT_API_KEY || '', // Ensure your API key is in .env
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
  if (!process.env.XENDIT_API_KEY) {
    console.error("XENDIT_API_KEY is not set in environment variables.");
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
        // Forcing IDR for this integration, adjust if other currencies are needed in future
        console.warn(`Currency specified was ${args.currency}, but forcing IDR for Xendit.`);
    }

    // --- Create Order in Firestore with 'pending' status ---
    let createdOrderId: string | undefined;
    if (args.userId && args.cartItemsForOrder.length > 0) {
      const purchasedItems: PurchasedTemplateItem[] = args.cartItemsForOrder.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price, // Assuming price is already in IDR
      }));

      const orderData: OrderInputData = {
        userId: args.userId,
        userEmail: args.payerEmail,
        orderId: externalId,
        items: purchasedItems,
        totalAmount: args.totalAmount,
        currency: 'IDR',
        status: 'pending', // Initial status
        paymentGateway: 'xendit',
      };

      try {
        const createdOrder = await createOrderInFirestore(orderData);
        createdOrderId = createdOrder.id; // Firestore document ID
        console.log(`Order ${externalId} (doc ID: ${createdOrderId}) created with status 'pending' for user ID: ${args.userId}`);
      } catch (orderError: any) {
        console.error(`Error creating order in Firestore for user ID ${args.userId}:`, orderError.message);
        return { error: "Failed to save your order. Please try again or contact support." };
      }
    } else {
      console.log("No userId provided or cart empty, skipping order creation.");
    }
    // --- End Order Creation ---

    const xenditInvoicePayload = {
      externalId: externalId,
      amount: args.totalAmount,
      payerEmail: args.payerEmail,
      description: args.description,
      currency: 'IDR', // Xendit requires currency specified here
      items: args.xenditFormattedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price, // Price per unit in IDR
        category: item.category,
        url: item.url,
      })),
      successRedirectUrl: `${appBaseUrl}/purchase/success?external_id=${externalId}&source=xendit`,
      failureRedirectUrl: `${appBaseUrl}/purchase/cancelled?external_id=${externalId}&source=xendit`,
      customer: args.payerEmail ? { email: args.payerEmail } : undefined,
      // fees: [{ type: 'ADMIN', value: 0 }] // Example if you need to add fees
    };

    console.log("Creating Xendit invoice with payload:", JSON.stringify(xenditInvoicePayload, null, 2));
    const invoice = await Invoice.createInvoice({ data: xenditInvoicePayload });
    console.log("Xendit invoice created:", invoice);

    if (!invoice.invoiceUrl) {
        console.error("Xendit invoice creation succeeded but no invoice_url was returned.", invoice);
        return { error: "Failed to get payment URL from gateway. Please try again." };
    }

    // --- Attempt to clear cart server-side if userId is provided ---
    if (args.userId) {
      try {
        console.log(`Attempting to clear cart for user ID: ${args.userId} server-side.`);
        await deleteUserCartFromFirestore(args.userId);
        console.log(`Cart cleared successfully for user ID: ${args.userId} server-side.`);
      } catch (cartClearError: any) {
        console.error(`Error clearing cart server-side for user ID ${args.userId}:`, cartClearError.message);
        // Log error but proceed with payment redirect
      }
    } else {
      console.log("No userId provided, skipping server-side cart clearing (anonymous user).");
    }
    // --- End cart clearing ---

    redirect(invoice.invoiceUrl);

  } catch (error: any) {
    if (error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw Next.js redirect signals
    }
    console.error("Error in createXenditInvoice:", error);
    let errorMessage = "An unexpected error occurred while processing your payment.";
    if (error.status && error.message) { // Xendit errors often have status and message
        errorMessage = `Payment Gateway Error (${error.status}): ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
