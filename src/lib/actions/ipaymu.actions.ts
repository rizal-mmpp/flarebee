
'use server';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

const IPAYMU_VA = process.env.IPAYMU_VA;
const IPAYMU_API_KEY = process.env.IPAYMU_API_KEY;
const IS_SANDBOX = process.env.NEXT_PUBLIC_IPAYMU_SANDBOX_MODE === 'true' || process.env.NEXT_PUBLIC_IPAYMU_SANDBOX_MODE === undefined;

const IPAYMU_BASE_URL = IS_SANDBOX ? 'https://sandbox.ipaymu.com/api/v2' : 'https://my.ipaymu.com/api/v2';

interface IpaymuItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateIpaymuPaymentArgs {
  items: IpaymuItem[];
  totalAmount: number; // Ensure this matches sum of item prices * qty
  referenceId?: string; // Your internal order ID
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface IpaymuPaymentResponseData {
  SessionID: string;
  Url: string;
  // Potentially other fields from iPaymu
}

export interface IpaymuPaymentResult {
  success: boolean;
  message?: string;
  data?: IpaymuPaymentResponseData;
  rawResponse?: any;
  error?: string; // Added for consistency
}

interface IpaymuTransactionStatusData {
  TransactionId: number;
  SessionId: string;
  ReferenceId: string;
  Via: string; // e.g., "va", "qris"
  Channel: string; // e.g., "BCA VA", "QRIS DYNAMIC"
  PaymentNo: string; // VA number or QR string
  PaymentName: string; // Usually buyer name or "QRIS Customer"
  Amount: number;
  Fee: number;
  Total: number;
  Expired: string; // "2024-01-01 23:59:59"
  Status: number; // -3:Pending, -2:Processing, 0:Berhasil, 1:Pending, 2:Gagal
  StatusCode: string; // "00": success, "01": pending, else: failed
  StatusDesc: string; // "SUCCESS", "PENDING", "FAILED"
  // ... and other fields
}

export interface IpaymuTransactionStatusResult {
  success: boolean;
  message?: string;
  data?: IpaymuTransactionStatusData;
  rawResponse?: any;
}

// Helper to generate iPaymu signature
function generateIpaymuSignature(httpMethod: 'POST' | 'GET', requestBodyJsonString: string): string {
  if (!IPAYMU_VA || !IPAYMU_API_KEY) {
    throw new Error('iPaymu VA or API Key is not configured.');
  }
  // The requestBodyJsonString should be the exact JSON string representation of the body
  const stringToSign = `${httpMethod.toUpperCase()}:${IPAYMU_VA}:${requestBodyJsonString}:${IPAYMU_API_KEY}`;
  return crypto.createHmac('sha256', IPAYMU_API_KEY).update(stringToSign).digest('hex');
}

export async function createIpaymuRedirectPayment(args: CreateIpaymuPaymentArgs): Promise<IpaymuPaymentResult> {
  if (!IPAYMU_VA || !IPAYMU_API_KEY) {
    return { success: false, error: 'iPaymu credentials not configured.' };
  }

  const hostHeaders = await headers();
  const host = hostHeaders.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  if (!host) {
    return { success: false, error: 'Failed to determine application host.' };
  }
  const appBaseUrl = `${protocol}://${host}`;

  const internalReferenceId = args.referenceId || `rio-ipaymu-test-${randomUUID()}`;

  const requestBody = {
    product: args.items.map(item => item.name),
    qty: args.items.map(item => item.quantity),
    price: args.items.map(item => item.price),
    amount: args.totalAmount, // Total amount, should match sum of items
    returnUrl: `${appBaseUrl}/admin/ipaymu-test?status=success&ref_id=${internalReferenceId}`,
    cancelUrl: `${appBaseUrl}/admin/ipaymu-test?status=cancelled&ref_id=${internalReferenceId}`,
    notifyUrl: `${appBaseUrl}/api/webhooks/ipaymu`, // You'll need to create this webhook endpoint
    referenceId: internalReferenceId,
    buyerName: args.buyerName,
    buyerEmail: args.buyerEmail,
    buyerPhone: args.buyerPhone,
    // paymentMethod: "va", // Can be specified or let user choose on iPaymu page
    // paymentChannel: "bca", // Specific channel if paymentMethod is set
  };

  // Use standard JSON string for signature calculation, consistent with Postman for /payment endpoint
  const requestBodyJsonStringForSignature = JSON.stringify(requestBody);
  const signature = generateIpaymuSignature('POST', requestBodyJsonStringForSignature);
  const endpoint = `${IPAYMU_BASE_URL}/payment`;

  try {
    console.log("Sending to iPaymu:", endpoint, "Body:", JSON.stringify(requestBody), "Signature:", signature);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'va': IPAYMU_VA,
        'signature': signature,
        'timestamp': new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
      },
      body: JSON.stringify(requestBody), // Send standard stringified JSON
    });

    const responseData = await response.json();
    console.log("iPaymu Response:", responseData);

    if (!response.ok || responseData.status !== 200) {
      const errorMessage = responseData.message || `iPaymu API request failed with status ${response.status}`;
      return { success: false, message: errorMessage, rawResponse: responseData };
    }

    if (!responseData.Data || !responseData.Data.Url || !responseData.Data.SessionID) {
         return { success: false, message: "iPaymu response missing SessionID or Url.", rawResponse: responseData };
    }

    return {
      success: true,
      message: responseData.message || 'Payment initiated successfully.',
      data: {
        SessionID: responseData.Data.SessionID,
        Url: responseData.Data.Url,
      },
      rawResponse: responseData,
    };
  } catch (error: any) {
    console.error('Error creating iPaymu redirect payment:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.', rawResponse: error };
  }
}


export async function checkIpaymuTransaction(transactionId: string): Promise<IpaymuTransactionStatusResult> {
    if (!IPAYMU_VA || !IPAYMU_API_KEY) {
        return { success: false, message: 'iPaymu credentials not configured.' };
    }
    if (!transactionId) {
        return { success: false, message: 'Transaction ID is required.' };
    }

    const requestBody = {
        transactionId: transactionId.trim(),
    };

    const requestBodyJsonString = JSON.stringify(requestBody); // Standard JSON string
    const signature = generateIpaymuSignature('POST', requestBodyJsonString);
    const endpoint = `${IPAYMU_BASE_URL}/transaction`;

    try {
        console.log("Checking iPaymu Transaction:", endpoint, "Body:", requestBody, "Signature:", signature);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'va': IPAYMU_VA,
                'signature': signature,
                'timestamp': new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
            },
            body: requestBodyJsonString,
        });

        const responseData = await response.json();
        console.log("iPaymu Transaction Status Response:", responseData);

        if (!response.ok || responseData.status !== 200) {
            const errorMessage = responseData.message || `iPaymu API request failed with status ${response.status}`;
            return { success: false, message: errorMessage, rawResponse: responseData };
        }

        if (!responseData.Data) {
            return { success: false, message: "iPaymu transaction status response missing Data.", rawResponse: responseData };
        }
        
        // Map iPaymu status codes to descriptions
        // Status: -3:Pending, -2:Processing, 0:Berhasil, 1:Pending, 2:Gagal
        // StatusCode "00": success, "01": pending, else: failed
        let statusDesc = responseData.Data.StatusDesc || "Unknown";
        if (responseData.Data.StatusCode === "00") statusDesc = "SUCCESS";
        else if (responseData.Data.StatusCode === "01") statusDesc = "PENDING";
        else if (responseData.Data.Status !== undefined) { // Fallback to numeric Status
            if(responseData.Data.Status === 0) statusDesc = "SUCCESS";
            else if (responseData.Data.Status === 1 || responseData.Data.Status === -3 || responseData.Data.Status === -2) statusDesc = "PENDING";
            else statusDesc = "FAILED";
        }


        return {
            success: true,
            message: `Transaction status: ${statusDesc}`,
            data: {
                ...responseData.Data,
                StatusDesc: statusDesc // Overwrite with consistent description
            },
            rawResponse: responseData,
        };

    } catch (error: any) {
        console.error('Error checking iPaymu transaction status:', error);
        return { success: false, message: error.message || 'An unexpected error occurred.', rawResponse: error };
    }
}
