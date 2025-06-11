
'use server';

import { Xendit } from 'xendit-node';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';


export interface XenditBalanceResponse {
  balance: number;
}

export interface XenditBalanceResult {
  data?: XenditBalanceResponse;
  error?: string;
  rawResponse?: any; // For debugging purposes
}

export async function getXenditBalance(): Promise<XenditBalanceResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    return { error: 'XENDIT_SECRET_KEY is not set in environment variables.' };
  }

  try {
    const encodedKey = Buffer.from(secretKey + ':').toString('base64');
    const response = await fetch('https://api.xendit.co/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data is fetched
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `Xendit API request failed with status ${response.status}`;
      console.error('Xendit API Error (Balance):', responseData);
      return { error: errorMessage, rawResponse: responseData };
    }

    if (typeof responseData.balance !== 'number') {
        console.error('Xendit API Error (Balance): "balance" field is missing or not a number.', responseData);
        return { error: 'Invalid balance data received from Xendit.', rawResponse: responseData };
    }

    return { data: responseData as XenditBalanceResponse, rawResponse: responseData };
  } catch (error: any) {
    console.error('Error fetching Xendit balance:', error);
    return { error: error.message || 'An unexpected error occurred while fetching balance.' };
  }
}

// Types for Payment Request Simulation
export interface CreatePaymentRequestArgs {
  amount: number;
  description: string;
  currency?: string; // Defaults to IDR
}

export interface XenditPaymentRequestData {
  id: string;
  country: string;
  amount: number;
  currency: string;
  business_id: string;
  reference_id: string;
  payment_method: {
    id: string;
    type: string;
    reference_id: string;
    description: string | null;
    created: string;
    updated: string;
    qr_code?: {
      amount: number;
      currency: string;
      channel_code: string;
      channel_properties: {
        qr_string: string;
        expires_at: string;
      };
    };
    reusability: string;
    status: string;
  };
  description: string | null;
  metadata: Record<string, any> | null;
  status: string; // e.g., PENDING, SUCCEEDED, FAILED
  created: string;
  updated: string;
}


export interface XenditPaymentRequestResult {
  data?: XenditPaymentRequestData;
  error?: string;
  rawResponse?: any;
}

export async function createXenditPaymentRequest(args: CreatePaymentRequestArgs): Promise<XenditPaymentRequestResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    return { error: 'XENDIT_SECRET_KEY is not set in environment variables.' };
  }

  const { amount, description } = args;
  const currency = args.currency || 'IDR';

  const payload = {
    amount: amount,
    currency: currency,
    payment_method: {
      type: "QR_CODE",
      reusability: "ONE_TIME_USE",
      qr_code: {
        channel_code: "DANA"
      }
    },
    description: description,
    metadata: {
      test_reference: `flarebee_payment_request_test_${randomUUID()}`
    }
  };

  try {
    const encodedKey = Buffer.from(secretKey + ':').toString('base64');
    const response = await fetch('https://api.xendit.co/payment_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.error_code ? `${responseData.error_code}: ${responseData.message}` : (responseData.message || `Xendit API request failed with status ${response.status}`);
      console.error('Xendit API Error (Payment Request):', responseData);
      return { error: errorMessage, rawResponse: responseData };
    }
    
    return { data: responseData as XenditPaymentRequestData, rawResponse: responseData };

  } catch (error: any) {
    console.error('Error creating Xendit payment request:', error);
    return { error: error.message || 'An unexpected error occurred while creating the payment request.' };
  }
}


// Types for Invoice Simulation
interface XenditSDKInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  url?: string;
}
export interface CreateTestInvoiceArgs {
  amount: number;
  description: string;
  payerEmail?: string;
  requestFva?: boolean;
}

export interface XenditInvoiceData {
  id: string;
  external_id: string;
  user_id: string;
  status: string; // e.g., PENDING, PAID, EXPIRED
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  payer_email: string | null;
  description: string;
  invoice_url: string;
  expiry_date: string;
  currency: string;
  created: string;
  updated: string;
  payment_methods?: any[];
  // ... other fields as per Xendit's full response
}

export interface XenditInvoiceResult {
  data?: XenditInvoiceData;
  error?: string;
  rawResponse?: any;
}

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});
const { Invoice } = xenditClient;

export async function createXenditTestInvoice(args: CreateTestInvoiceArgs): Promise<XenditInvoiceResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    return { error: 'XENDIT_SECRET_KEY is not set in environment variables.' };
  }

  try {
    const hostHeaders = await headers();
    const host = hostHeaders.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    if (!host) {
        console.error("Error in createXenditTestInvoice: Host header is missing or null.");
        return { error: "Failed to determine application host. Cannot proceed with payment test." };
    }
    const appBaseUrl = `${protocol}://${host}`;

    const externalId = `flarebee-test-invoice-${randomUUID()}`;
    const sampleItems: XenditSDKInvoiceItem[] = [
      { name: 'Test Item 1', quantity: 1, price: Math.floor(args.amount * 0.6) , category: 'Test Category', url: `${appBaseUrl}/templates/sample-item-1`},
      { name: 'Test Item 2', quantity: 1, price: args.amount - Math.floor(args.amount * 0.6), category: 'Test Category', url: `${appBaseUrl}/templates/sample-item-2` },
    ];
    // Ensure total item price matches args.amount for this test
    const itemsTotal = sampleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (itemsTotal !== args.amount && args.amount > 0) {
        const diff = args.amount - (itemsTotal - (sampleItems[sampleItems.length-1]?.price || 0) );
        if (sampleItems.length > 0 && diff > 0) {
            sampleItems[sampleItems.length-1].price = diff;
        } else if (sampleItems.length === 0) {
             sampleItems.push({ name: 'Single Test Item', quantity: 1, price: args.amount, category: 'Test Category', url: `${appBaseUrl}/templates/sample-item` });
        }
    } else if (args.amount === 0 && sampleItems.length > 0) {
        sampleItems.forEach(item => item.price = 0);
    }


    const invoicePayload: any = {
      externalId: externalId,
      amount: args.amount,
      payerEmail: args.payerEmail || undefined, 
      description: args.description,
      currency: 'IDR',
      items: sampleItems,
      successRedirectUrl: `${appBaseUrl}/purchase/success?external_id=${externalId}&source=xendit_test`,
      failureRedirectUrl: `${appBaseUrl}/purchase/cancelled?external_id=${externalId}&source=xendit_test`,
      customer: args.payerEmail ? { email: args.payerEmail } : undefined,
      shouldSendEmail: true,
    };

    if (args.requestFva) {
      invoicePayload.paymentMethods = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA']; // Common FVA bank codes
    }

    const invoice = await Invoice.createInvoice({ data: invoicePayload });
    
    return { data: invoice as XenditInvoiceData, rawResponse: invoice };

  } catch (error: any) {
    console.error('Error creating Xendit test invoice:', error);
    let errorMessage = "An unexpected error occurred while creating the test invoice.";
    if (error.status && error.message) { 
        errorMessage = `Xendit SDK Error (${error.status}): ${error.message}`;
        if (error.errorCode) {
          errorMessage = `Xendit SDK Error (${error.errorCode} - ${error.status}): ${error.message}`;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage, rawResponse: error };
  }
}

export async function getXenditTestInvoice(invoiceId: string): Promise<XenditInvoiceResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    return { error: 'XENDIT_SECRET_KEY is not set in environment variables.' };
  }
  if (!invoiceId) {
    return { error: 'Invoice ID is required.' };
  }

  try {
    const invoice = await Invoice.getInvoice({ invoiceID: invoiceId });
    return { data: invoice as XenditInvoiceData, rawResponse: invoice };
  } catch (error: any) {
    console.error(`Error fetching Xendit invoice ${invoiceId}:`, error);
    let errorMessage = `An unexpected error occurred while fetching invoice ${invoiceId}.`;
     if (error.status && error.message) { 
        errorMessage = `Xendit SDK Error (${error.status}): ${error.message}`;
        if (error.errorCode) {
          errorMessage = `Xendit SDK Error (${error.errorCode} - ${error.status}): ${error.message}`;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage, rawResponse: error };
  }
}

export interface SimulatePaymentArgs {
  invoiceId: string;
  amount?: number; // Optional amount for simulation
}

export interface XenditSimulatePaymentResult {
  data?: XenditInvoiceData; // Simulating payment often returns the updated invoice
  error?: string;
  rawResponse?: any;
}

export async function simulateXenditInvoicePayment(args: SimulatePaymentArgs): Promise<XenditSimulatePaymentResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    return { error: 'XENDIT_SECRET_KEY is not set in environment variables.' };
  }
  if (!args.invoiceId) {
    return { error: 'Invoice ID is required for payment simulation.' };
  }

  try {
    const simulationPayload: { invoiceID: string; amount?: number } = { invoiceID: args.invoiceId };
    if (args.amount && args.amount > 0) {
      simulationPayload.amount = args.amount;
    }
    // The simulatePayment method in the SDK might not return the full invoice,
    // but typically the API itself does. Let's assume it might return something.
    // If it returns a simple success/status, we might need to re-fetch the invoice.
    // For now, we'll type the response as potentially an invoice.
    const simulationResponse = await Invoice.simulatePayment(simulationPayload);
    
    // Xendit's simulate payment API usually returns the updated invoice object or a success message.
    // If it only returns a success message, you might want to call getXenditTestInvoice immediately after.
    // For now, we'll assume simulationResponse could be the updated invoice.
    return { data: simulationResponse as XenditInvoiceData, rawResponse: simulationResponse };

  } catch (error: any) {
    console.error(`Error simulating payment for Xendit invoice ${args.invoiceId}:`, error);
    let errorMessage = `An unexpected error occurred while simulating payment for invoice ${args.invoiceId}.`;
    if (error.status && error.message) { 
        errorMessage = `Xendit SDK Error (${error.status}): ${error.message}`;
        if (error.errorCode) {
          errorMessage = `Xendit SDK Error (${error.errorCode} - ${error.status}): ${error.message}`;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { error: errorMessage, rawResponse: error };
  }
}
