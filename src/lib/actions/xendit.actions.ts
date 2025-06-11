
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

const { Invoice } = xenditClient; // Assuming Invoice module is on xenditClient

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
  // orderId is now generated internally or used as external_id for Xendit
}

interface CreateXenditInvoiceErrorResult {
  error: string;
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceErrorResult | void> {
  if (!process.env.XENDIT_SECRET_KEY) {
    console.error("XENDIT_SECRET_KEY is not set in environment variables.");
    return { error: "Payment gateway configuration error. Please contact support." };
  }

  const hostHeaders = await headers();
  const host = hostHeaders.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  if (!host) {
    console.error("Error in createXenditInvoice: Host header is missing or null.");
    return { error: "Failed to determine application host. Cannot proceed with payment." };
  }
  const appBaseUrl = `${protocol}://${host}`;
  const externalId = `flarebee-order-${randomUUID()}`; // This will be our orderId in Firestore too
  const resolvedCurrency = args.currency || 'IDR';

  if (resolvedCurrency !== 'IDR') {
      console.warn(`Currency specified was ${args.currency}, but forcing IDR for Xendit.`);
  }

  try {
    // Step 1: Create Xendit Invoice
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
      // should_send_email: true by default
    };

    console.log("Creating Xendit invoice with payload:", JSON.stringify(xenditInvoicePayload, null, 2));
    const xenditInvoice = await Invoice.createInvoice({ data: xenditInvoicePayload });
    console.log("Xendit invoice created:", xenditInvoice);

    if (!xenditInvoice.invoiceUrl || !xenditInvoice.id) {
        console.error("Xendit invoice creation succeeded but invoice_url or id was missing.", xenditInvoice);
        return { error: "Failed to get payment details from gateway. Please try again." };
    }

    // Step 2: Create Order in Firestore with Xendit details
    if (args.userId && args.cartItemsForOrder.length > 0) {
      const purchasedItems: PurchasedTemplateItem[] = args.cartItemsForOrder.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
      }));

      const orderData: OrderInputData = {
        userId: args.userId,
        userEmail: args.payerEmail,
        orderId: externalId, // Using Xendit's external_id as our main orderId
        items: purchasedItems,
        totalAmount: args.totalAmount,
        currency: 'IDR',
        status: 'pending', // Initial status
        paymentGateway: 'xendit',
        xenditInvoiceId: xenditInvoice.id,
        xenditInvoiceUrl: xenditInvoice.invoiceUrl,
        xenditExpiryDate: xenditInvoice.expiryDate?.toISOString(), // expiryDate is a Date object from SDK
        xenditPaymentStatus: xenditInvoice.status, // e.g., "PENDING"
      };

      try {
        await createOrderInFirestore(orderData);
        console.log(`Order ${externalId} (Xendit ID: ${xenditInvoice.id}) created with status 'pending' for user ID: ${args.userId}`);
      } catch (orderError: any) {
        console.error(`Error creating order in Firestore for user ID ${args.userId} after Xendit success:`, orderError.message);
        // Log this critical error. The user can still pay, but our record is missing/incomplete.
        // Might need a reconciliation process later.
        // For now, we'll proceed to redirect the user as Xendit invoice is created.
        // Optionally, you could return an error here to prevent redirect if DB write is critical before payment.
        // return { error: "Failed to save your order details locally. Please contact support." };
      }
    } else {
      console.log("No userId provided or cart empty, skipping order creation in Firestore.");
    }

    // Step 3: Clear User Cart (if logged in)
    if (args.userId) {
      try {
        console.log(`Attempting to clear cart for user ID: ${args.userId} server-side.`);
        await deleteUserCartFromFirestore(args.userId);
        console.log(`Cart cleared successfully for user ID: ${args.userId} server-side.`);
      } catch (cartClearError: any) {
        console.error(`Error clearing cart server-side for user ID ${args.userId}:`, cartClearError.message);
        // Non-critical for payment flow, log and continue.
      }
    }

    // Step 4: Redirect to Xendit Payment Page
    redirect(xenditInvoice.invoiceUrl);

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
