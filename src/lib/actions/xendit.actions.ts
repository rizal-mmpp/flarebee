
'use server';

import Xendit from 'xendit-node';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

const xenditSecretKey = process.env.XENDIT_SECRET_KEY;

// if (!xenditSecretKey) {
//   console.warn("XENDIT_SECRET_KEY is not set. Xendit payments will not function.");
// }

// const xenditClient = xenditSecretKey ? new Xendit({ secretKey: xenditSecretKey }) : null;
// For dummy data, we don't need the actual client.
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

interface CreateXenditInvoiceResult {
  invoiceUrl?: string | null;
  error?: string;
  externalId?: string; 
  orderId?: string; 
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceResult> {
  // --- START DUMMY IMPLEMENTATION ---
  console.log("SIMULATING Xendit invoice creation with dummy data.");

  const host = (await headers()).get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const appBaseUrl = `${protocol}://${host}`;

  const uniqueOrderId = args.orderId || `flarebee-cart-dummy-${randomUUID()}`;
  const externalId = uniqueOrderId;

  // Simulate successful payment by directly creating the success URL
  const successRedirectUrl = `${appBaseUrl}/purchase/success?order_id=${externalId}&source=xendit_dummy`;
  
  // Simulate a short delay as if an API call was made
  await new Promise(resolve => setTimeout(resolve, 500));

  return { 
    invoiceUrl: successRedirectUrl, 
    externalId: externalId, 
    orderId: uniqueOrderId 
  };
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

    if (resp.invoiceUrl) {
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
