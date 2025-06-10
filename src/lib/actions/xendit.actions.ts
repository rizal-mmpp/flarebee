
'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { deleteUserCartFromFirestore } from '@/lib/firebase/firestoreCarts'; // Import the function

interface XenditInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  url?: string;
}

interface CreateXenditInvoiceArgs {
  items: XenditInvoiceItem[];
  totalAmount: number;
  description: string;
  currency?: string;
  payerEmail?: string;
  userId?: string; // User ID for cart clearing
  orderId?: string;
}

interface CreateXenditInvoiceErrorResult {
  error: string;
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceErrorResult | void> {
  console.log("SIMULATING Xendit invoice creation with dummy data and server-side redirect.");

  try {
    const hostHeaders = await headers(); // Correctly await headers()
    const host = hostHeaders.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    if (!host) {
      console.error("Error in createXenditInvoice: Host header is missing or null.");
      return { error: "Failed to determine application host. Cannot proceed with payment." };
    }
    const appBaseUrl = `${protocol}://${host}`;

    // --- Attempt to clear cart server-side if userId is provided ---
    if (args.userId) {
      try {
        console.log(`Attempting to clear cart for user ID: ${args.userId} server-side.`);
        await deleteUserCartFromFirestore(args.userId);
        console.log(`Cart cleared successfully for user ID: ${args.userId} server-side.`);
      } catch (cartClearError: any) {
        // Log the error, but proceed with the payment redirect for the dummy flow
        console.error(`Error clearing cart server-side for user ID ${args.userId}:`, cartClearError.message);
        // Optionally, you could pass this error info to the success page via query params if needed,
        // but for simplicity in a dummy flow, we'll just log it.
      }
    } else {
      console.log("No userId provided, skipping server-side cart clearing (anonymous user).");
    }
    // --- End cart clearing ---


    const uniqueOrderId = args.orderId || `flarebee-cart-dummy-${randomUUID()}`;
    const externalId = uniqueOrderId;

    const successRedirectUrl = new URL(`/purchase/success`, appBaseUrl);
    successRedirectUrl.searchParams.append('order_id', externalId);
    successRedirectUrl.searchParams.append('source', 'xendit_dummy');

    await new Promise(resolve => setTimeout(resolve, 500));

    redirect(successRedirectUrl.toString());

  } catch (internalError: any) {
    if (internalError?.digest?.startsWith('NEXT_REDIRECT')) {
      throw internalError;
    }
    console.error("Internal error in createXenditInvoice (dummy implementation):", internalError);
    return {
      error: "An internal server error occurred while preparing your payment. Please try again or contact support.",
    };
  }
}
