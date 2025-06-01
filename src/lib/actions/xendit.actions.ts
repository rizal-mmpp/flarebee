
'use server';

import Xendit from 'xendit-node';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

const xenditSecretKey = process.env.XENDIT_SECRET_KEY;

if (!xenditSecretKey) {
  console.warn("XENDIT_SECRET_KEY is not set. Xendit payments will not function.");
}

const xenditClient = xenditSecretKey ? new Xendit({ secretKey: xenditSecretKey }) : null;

interface CreateXenditInvoiceArgs {
  templateId: string;
  templateName: string;
  price: number; // Price in base currency unit (e.g., 10.99 for USD 10.99)
  currency?: string; // e.g., 'USD', 'IDR'. Defaults to 'USD'
  payerEmail?: string; // Optional: customer's email
  userId?: string; // Optional: for associating purchase with a user
}

interface CreateXenditInvoiceResult {
  invoiceUrl?: string | null;
  error?: string;
  externalId?: string;
}

export async function createXenditInvoice(args: CreateXenditInvoiceArgs): Promise<CreateXenditInvoiceResult> {
  if (!xenditClient) {
    console.error('Xendit client is not initialized. XENDIT_SECRET_KEY might be missing.');
    return { error: 'Payment system is not configured. Please contact support.' };
  }

  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const appBaseUrl = `${protocol}://${host}`;

  const externalId = `flarebee-tmpl-${args.templateId}-${randomUUID()}`;
  const successRedirectUrl = `${appBaseUrl}/purchase/success?external_id=${externalId}&source=xendit`;
  const failureRedirectUrl = `${appBaseUrl}/purchase/cancelled?external_id=${externalId}&source=xendit`;
  const invoiceCurrency = args.currency || 'USD'; // Default to USD

  try {
    const { Invoice } = xenditClient;
    const invoiceSpecificOptions = {}; // Add any Xendit specific options here if needed
    const inv = new Invoice(invoiceSpecificOptions);

    const resp = await inv.createInvoice({
      externalID: externalId,
      amount: args.price, // Xendit expects amount in the main currency unit
      payerEmail: args.payerEmail, // Optional
      description: `Purchase of template: ${args.templateName} (ID: ${args.templateId})`,
      successRedirectURL: successRedirectUrl,
      failureRedirectURL: failureRedirectUrl,
      currency: invoiceCurrency,
      // customer: args.userId ? { id: args.userId } : undefined, // If you have customer management with Xendit
      metadata: {
        templateId: args.templateId,
        userId: args.userId || '',
        appName: 'Flarebee Templates'
      }
    });

    if (resp.invoiceUrl) {
      return { invoiceUrl: resp.invoiceUrl, externalId: resp.externalId };
    } else {
      console.error('Xendit invoice creation response did not include an invoiceUrl:', resp);
      return { error: 'Failed to get payment URL from Xendit.' };
    }
  } catch (error: any) {
    console.error('Error creating Xendit invoice:', error);
    let errorMessage = 'Could not create payment invoice due to an unexpected error.';
    if (error.status && error.message) { // Xendit SDK often returns error with status and message
        errorMessage = `Xendit Error (${error.status}): ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
