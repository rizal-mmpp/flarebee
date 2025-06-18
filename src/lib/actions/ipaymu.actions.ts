
'use server';

import CryptoJS from 'crypto-js';
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

function getCurrentUnixTimestampString(): string {
  return Math.floor(new Date().getTime() / 1000).toString();
}

// Generate iPaymu signature using the HASHED JSON body string
function generateIpaymuSignature(httpMethod: 'POST' | 'GET', requestBody: Record<string, any>): string {
  if (!IPAYMU_VA || !IPAYMU_API_KEY) {
    throw new Error('iPaymu VA or API Key is not configured.');
  }
  
  const bodyJsonString = JSON.stringify(requestBody);
  const bodyEncrypt = CryptoJS.SHA256(bodyJsonString).toString(CryptoJS.enc.Hex);
  const stringToSign = `${httpMethod.toUpperCase()}:${IPAYMU_VA}:${bodyEncrypt}:${IPAYMU_API_KEY}`;
  
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
    qty: args.items.map(item => String(item.quantity)),
    price: args.items.map(item => String(item.price)),
    amount: String(args.totalAmount),
    returnUrl: `${appBaseUrl}/admin/ipaymu-test?status=success&ref_id=${internalReferenceId}`,
    cancelUrl: `${appBaseUrl}/admin/ipaymu-test?status=cancelled&ref_id=${internalReferenceId}`,
    notifyUrl: `${appBaseUrl}/api/webhooks/ipaymu`, // Ensure this webhook is set up
    referenceId: internalReferenceId,
    buyerName: args.buyerName,
    buyerEmail: args.buyerEmail,
    buyerPhone: args.buyerPhone,
  };

  const signature = generateIpaymuSignature('POST', requestBody);
  const timestamp = getCurrentUnixTimestampString();
  const endpoint = `${IPAYMU_BASE_URL}/payment`; // This is the redirect payment endpoint

  try {
    console.log("Sending to iPaymu (Redirect):", endpoint);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    console.log("VA:", IPAYMU_VA);
    console.log("Signature:", signature);
    console.log("Timestamp:", timestamp);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'va': IPAYMU_VA,
        'signature': signature,
        'timestamp': timestamp,
      },
      body: JSON.stringify(requestBody),
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

    const signature = generateIpaymuSignature('POST', requestBody);
    const timestamp = getCurrentUnixTimestampString();
    const endpoint = `${IPAYMU_BASE_URL}/transaction`;

    try {
        console.log("Checking iPaymu Transaction:", endpoint);
        console.log("Request Body:", JSON.stringify(requestBody, null, 2));
        console.log("VA:", IPAYMU_VA);
        console.log("Signature:", signature);
        console.log("Timestamp:", timestamp);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'va': IPAYMU_VA,
                'signature': signature,
                'timestamp': timestamp,
            },
            body: JSON.stringify(requestBody),
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
