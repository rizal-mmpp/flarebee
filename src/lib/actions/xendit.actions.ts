
'use server';

// Import redirect from next/navigation
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
// NextResponse might still be useful if you were constructing other types of responses,
// but for this function's successful redirect path, we'll use next/navigation's redirect.

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
  userId?: string; 
  orderId?: string; 
}

// Define the result type for error cases, as redirect won't return a value.
interface CreateXenditInvoiceErrorResult {
  error: string;
}

// The function will either redirect (and thus not return a value in the traditional sense)
// or return an error object.
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

    const uniqueOrderId = args.orderId || `flarebee-cart-dummy-${randomUUID()}`;
    const externalId = uniqueOrderId;

    const successRedirectUrl = new URL(`/purchase/success`, appBaseUrl);
    successRedirectUrl.searchParams.append('order_id', externalId);
    successRedirectUrl.searchParams.append('source', 'xendit_dummy');
    
    // Simulate a short delay as if an API call was made
    await new Promise(resolve => setTimeout(resolve, 500));

    // Perform server-side redirect using redirect from next/navigation
    // redirect() throws an error that Next.js intercepts, so code below this won't run.
    redirect(successRedirectUrl.toString()); 

  } catch (internalError: any) {
    // If internalError is the specific error thrown by redirect(), Next.js handles it by design.
    // It's a special type of error with a 'NEXT_REDIRECT' digest.
    // We must re-throw it so Next.js can process the redirect.
    if (internalError?.digest?.startsWith('NEXT_REDIRECT')) {
      throw internalError;
    }

    // For any other unexpected errors during the try block:
    console.error("Internal error in createXenditInvoice (dummy implementation):", internalError);
    return { 
      error: "An internal server error occurred while preparing your payment. Please try again or contact support.",
    };
  }
  // --- END DUMMY IMPLEMENTATION ---

  /*
  // --- ORIGINAL XENDIT IMPLEMENTATION (Commented out for dummy data) ---
  // if (!xenditClient) { ... }
  // ... (rest of original Xendit logic would also need to use redirect() from next/navigation if it were active) ...
  
  // Example if original logic was active:
  // try {
  //   ...
  //   const resp = await inv.createInvoice(invoiceParams);
  //   if (resp.invoiceUrl) {
  //     redirect(resp.invoiceUrl); // Use redirect here too
  //   } else {
  //     console.error('Xendit invoice creation response did not include an invoiceUrl:', resp);
  //     return { error: 'Failed to get payment URL from Xendit.' };
  //   }
  // } catch (error: any) {
  //   if (error.digest?.startsWith('NEXT_REDIRECT')) { // Handle redirect error
  //     throw error;
  //   }
  //   ... (handle other Xendit errors)
  //   return { error: errorMessage };
  // }
  */
}

