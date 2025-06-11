
'use server';

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
  // More fields can be added for flexibility if needed
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
  // ... other fields as per Xendit's full response
}


export interface XenditPaymentRequestResult {
  data?: XenditPaymentRequestData; // Using defined type
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
        channel_code: "DANA" // As per example
      }
    },
    description: description,
    metadata: { // As per example
      foo: "bar"
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
      const errorMessage = responseData.message || `Xendit API request failed with status ${response.status}`;
      console.error('Xendit API Error (Payment Request):', responseData);
      return { error: errorMessage, rawResponse: responseData };
    }
    
    // Assuming responseData matches XenditPaymentRequestData structure on success
    return { data: responseData as XenditPaymentRequestData, rawResponse: responseData };

  } catch (error: any) {
    console.error('Error creating Xendit payment request:', error);
    return { error: error.message || 'An unexpected error occurred while creating the payment request.' };
  }
}
