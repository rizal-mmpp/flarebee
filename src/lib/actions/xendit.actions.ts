
'use server';

import Xendit from 'xendit-node';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

const xenditSecretKey = process.env.XENDIT_SECRET_KEY;

if (!xenditSecretKey) {
  console.warn("XENDIT_SECRET_KEY is not set. Xendit payments will not function.");
}

const xenditClient = xenditSecretKey ? new Xendit({ secretKey: xenditSecretKey }) : null;

// Define the structure for items if Xendit supports line items directly in invoice creation
// This matches Xendit's documentation for `items` in invoice parameters
interface XenditInvoiceItem {
  name: string;
  quantity: number;
  price: number; // Price per unit
  category?: string;
  url?: string;
}

interface CreateXenditInvoiceArgs {
  items: XenditInvoiceItem[]; // Array of items for the cart
  totalAmount: number; // Total amount of the cart, Xendit will use this.
  description: string; // Consolidated description for the entire cart
  currency?: string; // e.g., 'USD', 'IDR'. Defaults to 'USD'
  payerEmail?: string; // Optional: customer's email
  userId?: string; // Optional: for associating purchase with a user
  orderId?: string; // Optional: your internal order/cart ID
}

interface CreateXenditInvoiceResult {
  invoiceUrl?: string | null;
  error?: string;
  externalId?: string; // Xendit's external_id for the invoice
  orderId?: string; // The orderId you passed, for easier tracking on success/failure pages
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceResult> {
  if (!xenditClient) {
    console.error('Xendit client is not initialized. XENDIT_SECRET_KEY might be missing.');
    return { error: 'Payment system is not configured. Please contact support.' };
  }

  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const appBaseUrl = `${protocol}://${host}`;

  // Use a unique ID for the entire order/cart, or use the provided orderId
  const uniqueOrderId = args.orderId || `flarebee-cart-${randomUUID()}`;
  const externalId = uniqueOrderId; // Use your unique order ID as Xendit's external_id

  const successRedirectUrl = `${appBaseUrl}/purchase/success?order_id=${externalId}&source=xendit`;
  const failureRedirectUrl = `${appBaseUrl}/purchase/cancelled?order_id=${externalId}&source=xendit`;
  const invoiceCurrency = args.currency || 'USD';

  try {
    const { Invoice } = xenditClient;
    const invoiceSpecificOptions = {}; 
    const inv = new Invoice(invoiceSpecificOptions);

    const invoiceParams: any = {
      externalID: externalId,
      amount: args.totalAmount, // Xendit expects the total amount
      payerEmail: args.payerEmail,
      description: args.description, // Overall description for the invoice
      successRedirectURL: successRedirectUrl,
      failureRedirectURL: failureRedirectUrl,
      currency: invoiceCurrency,
      items: args.items, // Pass the structured items array
      metadata: {
        userId: args.userId || '',
        appName: 'Flarebee Templates',
        cartItemsCount: args.items.length,
      }
    };
    
    // If you have customer management with Xendit and a customer ID
    if (args.userId) {
      // This structure depends on how you've set up customers in Xendit.
      // Example: invoiceParams.customer = { id: args.userId };
      // Or, if you only want to associate the email for guest checkout:
      // invoiceParams.customer = { email: args.payerEmail };
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
}
