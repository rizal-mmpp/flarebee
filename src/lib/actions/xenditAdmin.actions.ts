
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
      console.error('Xendit API Error:', responseData);
      return { error: errorMessage, rawResponse: responseData };
    }

    // Validate the structure of the successful response
    if (typeof responseData.balance !== 'number') {
        console.error('Xendit API Error: "balance" field is missing or not a number.', responseData);
        return { error: 'Invalid balance data received from Xendit.', rawResponse: responseData };
    }

    return { data: responseData as XenditBalanceResponse, rawResponse: responseData };
  } catch (error: any) {
    console.error('Error fetching Xendit balance:', error);
    return { error: error.message || 'An unexpected error occurred while fetching balance.' };
  }
}
