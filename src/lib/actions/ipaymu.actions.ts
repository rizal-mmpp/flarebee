
'use server';

import CryptoJS from 'crypto-js'; // Import crypto-js
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
  totalAmount: number;
  referenceId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface IpaymuPaymentResponseData {
  SessionID: string;
  Url: string;
}

export interface IpaymuPaymentResult {
  success: boolean;
  message?: string;
  data?: IpaymuPaymentResponseData;
  rawResponse?: any;
  error?: string;
}

interface IpaymuTransactionStatusData {
  TransactionId: number;
  SessionId: string;
  ReferenceId: string;
  Via: string;
  Channel: string;
  PaymentNo: string;
  PaymentName: string;
  Amount: number;
  Fee: number;
  Total: number;
  Expired: string;
  Status: number;
  StatusCode: string;
  StatusDesc: string;
}

export interface IpaymuTransactionStatusResult {
  success: boolean;
  message?: string;
  data?: IpaymuTransactionStatusData;
  rawResponse?: any;
}

function getCurrentFormattedTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate iPaymu signature using the raw JSON body string
function generateIpaymuSignature(httpMethod: 'POST' | 'GET', requestBodyJsonString: string): string {
  if (!IPAYMU_VA || !IPAYMU_API_KEY) {
    throw new Error('iPaymu VA or API Key is not configured.');
  }
  // The string to sign uses the raw JSON body string for these specific endpoints
  const stringToSign = `${httpMethod.toUpperCase()}:${IPAYMU_VA}:${requestBodyJsonString}:${IPAYMU_API_KEY}`;
  return CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(stringToSign, IPAYMU_API_KEY));
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
  const internalReferenceId = args.referenceId || `rio-ipaymu-${randomUUID()}`;

  const requestBody = {
    product: args.items.map(item => item.name),
    qty: args.items.map(item => String(item.quantity)), // Ensure qty items are strings
    price: args.items.map(item => String(item.price)),   // Ensure price items are strings
    amount: String(args.totalAmount),
    returnUrl: `${appBaseUrl}/admin/ipaymu-test?status=success&ref_id=${internalReferenceId}`,
    cancelUrl: `${appBaseUrl}/admin/ipaymu-test?status=cancelled&ref_id=${internalReferenceId}`,
    notifyUrl: `${appBaseUrl}/api/webhooks/ipaymu`,
    referenceId: internalReferenceId,
    buyerName: args.buyerName,
    buyerEmail: args.buyerEmail,
    buyerPhone: args.buyerPhone,
  };

  const requestBodyJsonString = JSON.stringify(requestBody);
  const signature = generateIpaymuSignature('POST', requestBodyJsonString);
  const timestamp = getCurrentFormattedTimestamp();
  const endpoint = `${IPAYMU_BASE_URL}/payment`;

  try {
    console.log("Sending to iPaymu:", endpoint, "Body:", requestBodyJsonString, "Signature:", signature, "Timestamp:", timestamp);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'va': IPAYMU_VA,
        'signature': signature,
        'timestamp': timestamp,
      },
      body: requestBodyJsonString,
    });

    const responseData = await response.json();
    console.log("iPaymu Response:", responseData);

    if (!response.ok || responseData.Status !== 200) {
      const errorMessage = responseData.Message || `iPaymu API request failed with status ${response.status}`;
      return { success: false, message: errorMessage, rawResponse: responseData, error: errorMessage };
    }

    if (!responseData.Data || !responseData.Data.Url || !responseData.Data.SessionID) {
         return { success: false, message: "iPaymu response missing SessionID or Url.", rawResponse: responseData, error: "iPaymu response missing SessionID or Url." };
    }

    return {
      success: true,
      message: responseData.Message || 'Payment initiated successfully.',
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

    const requestBodyJsonString = JSON.stringify(requestBody);
    const signature = generateIpaymuSignature('POST', requestBodyJsonString);
    const timestamp = getCurrentFormattedTimestamp();
    const endpoint = `${IPAYMU_BASE_URL}/transaction`;

    try {
        console.log("Checking iPaymu Transaction:", endpoint, "Body:", requestBodyJsonString, "Signature:", signature, "Timestamp:", timestamp);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'va': IPAYMU_VA,
                'signature': signature,
                'timestamp': timestamp,
            },
            body: requestBodyJsonString,
        });

        const responseData = await response.json();
        console.log("iPaymu Transaction Status Response:", responseData);

        if (!response.ok || responseData.Status !== 200) {
            const errorMessage = responseData.Message || `iPaymu API request failed with status ${response.status}`;
            return { success: false, message: errorMessage, rawResponse: responseData };
        }

        if (!responseData.Data) {
            return { success: false, message: "iPaymu transaction status response missing Data.", rawResponse: responseData };
        }
        
        let statusDesc = responseData.Data.StatusDesc || "Unknown";
        if (responseData.Data.StatusCode === "00") statusDesc = "SUCCESS"; 
        else if (responseData.Data.StatusCode === "01") statusDesc = "PENDING"; 
        else if (responseData.Data.Status !== undefined) { 
            if(responseData.Data.Status === 0) statusDesc = "SUCCESS";
            else if (responseData.Data.Status === 1 || responseData.Data.Status === -3 || responseData.Data.Status === -2) statusDesc = "PENDING";
            else statusDesc = "FAILED"; 
        }

        return {
            success: true,
            message: `Transaction status: ${statusDesc}`,
            data: {
                ...responseData.Data,
                StatusDesc: statusDesc 
            },
            rawResponse: responseData,
        };

    } catch (error: any) {
        console.error('Error checking iPaymu transaction status:', error);
        return { success: false, message: error.message || 'An unexpected error occurred.', rawResponse: error };
    }
}
