
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  createIpaymuRedirectPayment,
  checkIpaymuTransaction,
  type IpaymuPaymentResult,
  type IpaymuTransactionStatusResult,
  type CreateIpaymuPaymentArgs,
} from '@/lib/actions/ipaymu.actions';
import { Loader2, CheckCircle, AlertTriangle, ExternalLink, CreditCard, Search, Receipt, Send } from 'lucide-react';
import Link from 'next/link';
import CryptoJS from 'crypto-js';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function IpaymuTestPage() {
  // Create Payment State (Server Action)
  const [productName, setProductName] = useState('Sample RIO Template');
  const [productQty, setProductQty] = useState(1);
  const [productPrice, setProductPrice] = useState(75000);
  const [buyerName, setBuyerName] = useState('Test Buyer');
  const [buyerEmail, setBuyerEmail] = useState('testbuyer@example.com');
  const [buyerPhone, setBuyerPhone] = useState('081234567890');
  const [isProcessingPaymentSA, setIsProcessingPaymentSA] = useState(false);
  const [paymentResultSA, setPaymentResultSA] = useState<IpaymuPaymentResult | null>(null);

  // Check Transaction State (Server Action)
  const [transactionIdSA, setTransactionIdSA] = useState('');
  const [isCheckingTransactionSA, setIsCheckingTransactionSA] = useState(false);
  const [transactionStatusResultSA, setTransactionStatusResultSA] = useState<IpaymuTransactionStatusResult | null>(null);

  // Client-Side Hardcoded Test State
  const [isProcessingClientTest, setIsProcessingClientTest] = useState(false);
  const [clientTestResult, setClientTestResult] = useState<any | null>(null);
  const [clientTestError, setClientTestError] = useState<string | null>(null);


  const handleCreatePaymentServerAction = async () => {
    setIsProcessingPaymentSA(true);
    setPaymentResultSA(null);

    const items = [{ name: productName, quantity: productQty, price: productPrice }];
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const args: CreateIpaymuPaymentArgs = {
      items,
      totalAmount,
      buyerName,
      buyerEmail,
      buyerPhone,
    };
    const response = await createIpaymuRedirectPayment(args);
    setPaymentResultSA(response);
    if (response.success && response.data?.SessionID) {
        setTransactionIdSA(response.data.SessionID); 
    }
    setIsProcessingPaymentSA(false);
  };

  const handleCheckTransactionServerAction = async () => {
    if (!transactionIdSA) return;
    setIsCheckingTransactionSA(true);
    setTransactionStatusResultSA(null);
    const response = await checkIpaymuTransaction(transactionIdSA);
    setTransactionStatusResultSA(response);
    setIsCheckingTransactionSA(false);
  };
  
  const handleClientSideHardcodedTest = async () => {
    setIsProcessingClientTest(true);
    setClientTestResult(null);
    setClientTestError(null);

    const apikey = "SANDBOX3D93FE0D-571E-417F-ABA6-1CF895B19F90"; // From user example
    const va = "0000002233999510"; // From user example
    const url = "https://sandbox.ipaymu.com/api/v2/payment";

    const appBaseUrl = window.location.origin;

    const body = {
      product: ["Jacket"],
      qty: ["1"],
      price: ["150000"],
      amount: "10000", // Note: This is different from product price*qty. iPaymu might use this as the actual charge.
      returnUrl: `${appBaseUrl}/admin/ipaymu-test?status=success_client_test`,
      cancelUrl: `${appBaseUrl}/admin/ipaymu-test?status=cancelled_client_test`,
      notifyUrl: `${appBaseUrl}/api/webhooks/ipaymu-client-test-hook`, // Different notify for clarity
      referenceId: `client-test-${Date.now()}`,
      buyerName: "Putu ClientTest",
      buyerPhone: "08987654321",
      buyerEmail: "putu.clienttest@example.com",
    };

    try {
      const bodyJsonString = JSON.stringify(body);
      const bodyEncrypt = CryptoJS.SHA256(bodyJsonString).toString(CryptoJS.enc.Hex);
      const stringToSign = "POST:" + va + ":" + bodyEncrypt + ":" + apikey;
      const signature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(stringToSign, apikey));
      const currentTimestamp = Math.floor(new Date().getTime() / 1000).toString();
      
      console.log("Client-Side Test - Body:", bodyJsonString);
      console.log("Client-Side Test - BodyEncrypted:", bodyEncrypt);
      console.log("Client-Side Test - StringToSign:", stringToSign);
      console.log("Client-Side Test - Signature:", signature);
      console.log("Client-Side Test - Timestamp:", currentTimestamp);


      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          va: va,
          signature: signature,
          timestamp: currentTimestamp,
        },
        body: bodyJsonString,
      });

      const responseJson = await response.json();
      console.log("Client-Side Test - Response:", responseJson);
      setClientTestResult(responseJson);

      if (!response.ok || responseJson.Status !== 200) {
        setClientTestError(responseJson.Message || `iPaymu API request failed with status ${response.status}`);
      }

    } catch (error: any) {
      console.error("Client-Side Test - Fetch Error:", error);
      setClientTestError(error.message || "An unexpected error occurred during client-side test.");
      setClientTestResult({ error: error.message });
    } finally {
      setIsProcessingClientTest(false);
    }
  };


  const renderRawResponse = (title: string, rawResponse: any) => (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer hover:underline text-muted-foreground">{title}</summary>
      <pre className="mt-1 p-2 bg-muted/50 rounded-md overflow-x-auto text-xs">
        {JSON.stringify(rawResponse, null, 2)}
      </pre>
    </details>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <CreditCard className="h-7 w-7 text-primary mr-3" />
            iPaymu Integration Test Panel
          </CardTitle>
          <CardDescription>
            Test iPaymu payment gateway integration. Ensure your 
            <code className="font-mono bg-muted px-1 py-0.5 rounded-sm text-xs mx-1">IPAYMU_VA</code> and 
            <code className="font-mono bg-muted px-1 py-0.5 rounded-sm text-xs mx-1">IPAYMU_API_KEY</code> are correctly configured for Server Actions.
            Client-side tests use hardcoded sandbox credentials.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4" defaultValue={["create-payment-sa"]}>
            {/* Create Payment Section (Server Action) */}
            <AccordionItem value="create-payment-sa" className="border-b-0">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline p-4 bg-muted/30 rounded-t-lg">
                <div className="flex items-center text-left"> 
                  <span className="mr-2"><CreditCard className="h-5 w-5 text-primary/80" /></span>
                  1. Create iPaymu Redirect Payment (Server Action)
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border border-t-0 rounded-b-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="productName">Product Name</Label><Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} className="mt-1"/></div>
                  <div><Label htmlFor="productQty">Quantity</Label><Input id="productQty" type="number" value={productQty} onChange={(e) => setProductQty(Number(e.target.value))} className="mt-1"/></div>
                  <div><Label htmlFor="productPrice">Price per Item (IDR)</Label><Input id="productPrice" type="number" value={productPrice} onChange={(e) => setProductPrice(Number(e.target.value))} className="mt-1"/></div>
                  <div><Label htmlFor="totalAmountDisplay">Total Amount</Label><Input id="totalAmountDisplay" value={formatIDR(productPrice * productQty)} className="mt-1 bg-muted" readOnly/></div>
                  <div><Label htmlFor="buyerName">Buyer Name</Label><Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="mt-1"/></div>
                  <div><Label htmlFor="buyerEmail">Buyer Email</Label><Input id="buyerEmail" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="mt-1"/></div>
                  <div><Label htmlFor="buyerPhone">Buyer Phone</Label><Input id="buyerPhone" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="mt-1"/></div>
                </div>
                <Button onClick={handleCreatePaymentServerAction} disabled={isProcessingPaymentSA || productQty <= 0 || productPrice <= 0} size="lg" className="w-full sm:w-auto">
                  {isProcessingPaymentSA ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                  Create Test Payment (Server Action)
                </Button>
                {paymentResultSA && (
                  <div className="mt-4">
                    {!paymentResultSA.success ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle>Error Creating Payment</AlertTitle>
                        <AlertDescription>
                          <p>{paymentResultSA.message || paymentResultSA.error || 'An unknown error occurred.'}</p>
                          {paymentResultSA.rawResponse && renderRawResponse("Raw API Response (Server Action)", paymentResultSA.rawResponse)}
                        </AlertDescription>
                      </Alert>
                    ) : paymentResultSA.data ? (
                      <Alert variant="default" className="border-green-500 bg-green-500/10">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertTitle className="text-green-700">Payment Initiated Successfully! (Server Action)</AlertTitle>
                        <AlertDescription className="text-green-600/90 space-y-2">
                          <p>Session ID: <span className="font-semibold">{paymentResultSA.data.SessionID}</span></p>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            <Link href={paymentResultSA.data.Url} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-green-700 break-all">
                              Open iPaymu Payment Page
                            </Link>
                          </div>
                          <p className="text-xs">{paymentResultSA.message}</p>
                          {paymentResultSA.rawResponse && renderRawResponse("Raw API Response (Server Action)", paymentResultSA.rawResponse)}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Check Transaction Status Section (Server Action) */}
            <AccordionItem value="check-transaction-sa" className="border-b-0">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline p-4 bg-muted/30 rounded-t-lg">
                <div className="flex items-center text-left"> 
                  <span className="mr-2"><Search className="h-5 w-5 text-primary/80" /></span>
                  2. Check iPaymu Transaction Status (Server Action)
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border border-t-0 rounded-b-lg space-y-6">
                <div className="max-w-md">
                  <Label htmlFor="transactionIdSA">iPaymu Transaction ID (SessionID from Server Action)</Label>
                  <Input id="transactionIdSA" value={transactionIdSA} onChange={(e) => setTransactionIdSA(e.target.value)} placeholder="Enter iPaymu Session ID / Trx ID" className="mt-1"/>
                </div>
                <Button onClick={handleCheckTransactionServerAction} disabled={isCheckingTransactionSA || !transactionIdSA} size="lg" className="w-full sm:w-auto">
                  {isCheckingTransactionSA ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                  Check Transaction Status (Server Action)
                </Button>
                 {transactionStatusResultSA && (
                  <div className="mt-4">
                    {!transactionStatusResultSA.success ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle>Error Checking Transaction</AlertTitle>
                        <AlertDescription>
                            <p>{transactionStatusResultSA.message || 'An unknown error occurred.'}</p>
                            {transactionStatusResultSA.rawResponse && renderRawResponse("Raw API Response (Server Action)", transactionStatusResultSA.rawResponse)}
                        </AlertDescription>
                      </Alert>
                    ) : transactionStatusResultSA.data ? (
                      <Alert variant="default" className="border-blue-500 bg-blue-500/10">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="text-blue-700">Transaction Status (Server Action)</AlertTitle>
                        <AlertDescription className="text-blue-600/90 space-y-1">
                          <p>Status: <span className="font-semibold">{transactionStatusResultSA.data.StatusDesc} (Code: {transactionStatusResultSA.data.StatusCode}, Num: {transactionStatusResultSA.data.Status})</span></p>
                          <p>Transaction ID: <span className="font-semibold">{transactionStatusResultSA.data.TransactionId}</span></p>
                          <p>Session ID: <span className="font-semibold">{transactionStatusResultSA.data.SessionId}</span></p>
                          <p>Reference ID: <span className="font-semibold">{transactionStatusResultSA.data.ReferenceId}</span></p>
                          <p>Amount: <span className="font-semibold">{formatIDR(transactionStatusResultSA.data.Amount)}</span> (Fee: {formatIDR(transactionStatusResultSA.data.Fee)})</p>
                          <p>Payment Channel: <span className="font-semibold">{transactionStatusResultSA.data.Via} - {transactionStatusResultSA.data.Channel}</span></p>
                          <p>Payment No/Code: <span className="font-semibold">{transactionStatusResultSA.data.PaymentNo}</span></p>
                          <p>Expired: <span className="font-semibold">{transactionStatusResultSA.data.Expired}</span></p>
                          {transactionStatusResultSA.rawResponse && renderRawResponse("Raw API Response (Server Action)", transactionStatusResultSA.rawResponse)}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Client-Side Hardcoded Test Section */}
            <AccordionItem value="client-hardcoded-test" className="border-b-0">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline p-4 bg-muted/30 rounded-t-lg">
                <div className="flex items-center text-left">
                  <span className="mr-2"><Send className="h-5 w-5 text-primary/80" /></span>
                  3. Send Exact Hardcoded Test Request (Client-Side)
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border border-t-0 rounded-b-lg space-y-6">
                <p className="text-sm text-muted-foreground">
                  This button sends a predefined request directly from your browser to iPaymu's sandbox using hardcoded credentials and logic from your example.
                  This is for isolated testing of the raw API call.
                </p>
                <Button onClick={handleClientSideHardcodedTest} disabled={isProcessingClientTest} size="lg" className="w-full sm:w-auto">
                  {isProcessingClientTest ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  Send Exact Test Request (Client-Side)
                </Button>
                {clientTestResult && (
                  <div className="mt-4">
                    {clientTestError ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle>Client-Side Test Error</AlertTitle>
                        <AlertDescription>
                          <p>{clientTestError}</p>
                          {clientTestResult && renderRawResponse("Raw Client-Side Response", clientTestResult)}
                        </AlertDescription>
                      </Alert>
                    ) : clientTestResult.Data ? (
                      <Alert variant="default" className="border-purple-500 bg-purple-500/10">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        <AlertTitle className="text-purple-700">Client-Side Test Successful!</AlertTitle>
                        <AlertDescription className="text-purple-600/90 space-y-2">
                          <p>Status Code from iPaymu: <span className="font-semibold">{clientTestResult.Status}</span></p>
                          <p>Message: <span className="font-semibold">{clientTestResult.Message}</span></p>
                          <p>Session ID: <span className="font-semibold">{clientTestResult.Data?.SessionID}</span></p>
                          {clientTestResult.Data?.Url && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              <Link href={clientTestResult.Data.Url} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-purple-700 break-all">
                                Open iPaymu Payment Page (from Client Test)
                              </Link>
                            </div>
                          )}
                          {renderRawResponse("Raw Client-Side Response", clientTestResult)}
                        </AlertDescription>
                      </Alert>
                    ) : (
                       <Alert variant="destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle>Client-Side Test - Unexpected Response</AlertTitle>
                        <AlertDescription>
                          <p>{clientTestResult.Message || "The response from iPaymu was not in the expected format."}</p>
                          {renderRawResponse("Raw Client-Side Response", clientTestResult)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full pt-4">
                Note: Server Action tests use your configured credentials. Client-Side test uses hardcoded sandbox credentials.
                A webhook endpoint at <code className="font-mono bg-muted px-1 py-0.5 rounded-sm text-xs mx-1">/api/webhooks/ipaymu</code> should be set up in your iPaymu merchant dashboard.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    