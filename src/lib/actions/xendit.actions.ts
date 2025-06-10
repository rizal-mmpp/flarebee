
'use server';

import Xendit from 'xendit-node';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server'; // Import NextResponse

const xenditSecretKey = process.env.XENDIT_SECRET_KEY;

// const xenditClient = xenditSecretKey ? new Xendit({ secretKey: xenditSecretKey }) : null;
const xenditClient = null; 


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

// The result might not be used if redirecting, but define for potential error cases
interface CreateXenditInvoiceResult {
  invoiceUrl?: string | null; // May not be used if server redirects
  error?: string;
  externalId?: string; 
  orderId?: string; 
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceResult | NextResponse> {
  // --- START DUMMY IMPLEMENTATION WITH SERVER-SIDE REDIRECT ---
  console.log("SIMULATING Xendit invoice creation with dummy data and server-side redirect.");

  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const appBaseUrl = `${protocol}://${host}`;

  const uniqueOrderId = args.orderId || `flarebee-cart-dummy-${randomUUID()}`;
  const externalId = uniqueOrderId;

  // Construct the full URL for redirection
  const successRedirectUrl = new URL(`/purchase/success`, appBaseUrl);
  successRedirectUrl.searchParams.append('order_id', externalId);
  successRedirectUrl.searchParams.append('source', 'xendit_dummy');
  
  // Simulate a short delay as if an API call was made
  await new Promise(resolve => setTimeout(resolve, 500));

  // Perform server-side redirect
  return NextResponse.redirect(successRedirectUrl.toString(), 303); // 303 See Other is appropriate for POST -> GET redirect
  // --- END DUMMY IMPLEMENTATION ---

  /*
  // --- ORIGINAL XENDIT IMPLEMENTATION (Commented out for dummy data) ---
  if (!xenditClient) {
    console.error('Xendit client is not initialized. XENDIT_SECRET_KEY might be missing.');
    return { error: 'Payment system is not configured. Please contact support.' };
  }

  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const appBaseUrl = `${protocol}://${host}`;

  const uniqueOrderId = args.orderId || `flarebee-cart-${randomUUID()}`;
  const externalId = uniqueOrderId; 

  const successRedirectUrl = `${appBaseUrl}/purchase/success?order_id=${externalId}&source=xendit`;
  const failureRedirectUrl = `${appBaseUrl}/purchase/cancelled?order_id=${externalId}&source=xendit`;
  const invoiceCurrency = args.currency || 'USD';

  try {
    const { Invoice } = xenditClient;
    const invoiceSpecificOptions = {}; 
    const inv = new Invoice(invoiceSpecificOptions);

    const invoiceParams: any = {
      externalID: externalId,
      amount: args.totalAmount, 
      payerEmail: args.payerEmail,
      description: args.description, 
      successRedirectURL: successRedirectUrl,
      failureRedirectURL: failureRedirectUrl,
      currency: invoiceCurrency,
      items: args.items, 
      metadata: {
        userId: args.userId || '',
        appName: 'Flarebee Templates',
        cartItemsCount: args.items.length,
      }
    };
    
    if (args.userId) {
      // invoiceParams.customer = { id: args.userId };
    }

    const resp = await inv.createInvoice(invoiceParams);

    // With server-side redirect, we might not return this if the actual Xendit API also redirects.
    // If Xendit returns a URL for us to redirect to, then we would use NextResponse.redirect(resp.invoiceUrl)
    if (resp.invoiceUrl) {
       // In a real scenario where Xendit returns a URL for you to redirect the user to:
       // return NextResponse.redirect(resp.invoiceUrl, 303);
       // For now, this part of the original code is less relevant due to the dummy redirect above.
       // If Xendit itself handles the redirect, the action might complete without returning anything specific to client.
       return { invoiceUrl: resp.invoiceUrl, externalId: resp.externalId, orderId: uniqueOrderId };
    } else {
      console.error('Xendit invoice creation response did not include an invoiceUrl:', resp);
      return { error: 'Failed to get payment URL from Xendit.' };
    }
  } catch (error: any) {
    console.error('Error creating Xendit invoice:', error);
    let errorMessage = 'Could not create payment invoice due to an unexpected error.';
    if (error.status && error.message) { 
        errorMessage = `Xendit Error (${error.status}): ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
  }
  // --- END ORIGINAL XENDIT IMPLEMENTATION ---
  */
}

