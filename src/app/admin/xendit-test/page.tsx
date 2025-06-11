
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  getXenditBalance, 
  createXenditPaymentRequest,
  createXenditTestInvoice,
  type XenditBalanceResult,
  type XenditPaymentRequestResult,
  type CreatePaymentRequestArgs,
  type XenditInvoiceResult,
  type CreateTestInvoiceArgs,
} from '@/lib/actions/xenditAdmin.actions';
import { Loader2, CheckCircle, AlertTriangle, Wifi, Banknote, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function XenditTestPage() {
  // Balance Check State
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<XenditBalanceResult | null>(null);

  // Payment Request Simulation State
  const [prAmount, setPrAmount] = useState<number>(15000);
  const [prDescription, setPrDescription] = useState('Sample Flarebee Payment Request (DANA QR)');
  const [isProcessingPr, setIsProcessingPr] = useState(false);
  const [prResult, setPrResult] = useState<XenditPaymentRequestResult | null>(null);

  // Invoice Simulation State
  const [invoiceAmount, setInvoiceAmount] = useState<number>(50000);
  const [invoiceDescription, setInvoiceDescription] = useState('Sample Flarebee Test Invoice');
  const [invoicePayerEmail, setInvoicePayerEmail] = useState('');
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<XenditInvoiceResult | null>(null);


  const handleTestBalance = async () => {
    setIsFetchingBalance(true);
    setBalanceResult(null);
    const response = await getXenditBalance();
    setBalanceResult(response);
    setIsFetchingBalance(false);
  };

  const handleCreatePaymentRequest = async () => {
    setIsProcessingPr(true);
    setPrResult(null);
    const args: CreatePaymentRequestArgs = {
      amount: prAmount,
      description: prDescription,
      currency: 'IDR',
    };
    const response = await createXenditPaymentRequest(args);
    setPrResult(response);
    setIsProcessingPr(false);
  };

  const handleCreateTestInvoice = async () => {
    setIsProcessingInvoice(true);
    setInvoiceResult(null);
    const args: CreateTestInvoiceArgs = {
      amount: invoiceAmount,
      description: invoiceDescription,
      payerEmail: invoicePayerEmail || undefined,
    };
    const response = await createXenditTestInvoice(args);
    setInvoiceResult(response);
    setIsProcessingInvoice(false);
  };

  const renderRawResponse = (rawResponse: any) => (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer hover:underline">Raw API Response</summary>
      <pre className="mt-1 p-2 bg-muted/50 rounded-md overflow-x-auto text-xs">
        {JSON.stringify(rawResponse, null, 2)}
      </pre>
    </details>
  );


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Wifi className="mr-3 h-7 w-7 text-primary" />
            Xendit Integration Tests
          </CardTitle>
          <CardDescription>
            Test connections and simulate API calls to Xendit.
            Ensure your <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">XENDIT_SECRET_KEY</code> is correctly configured in your environment variables.
          </CardDescription>
        </CardHeader>
        
        {/* Balance Check Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Banknote className="mr-2 h-5 w-5 text-primary/80" />
            1. Check Xendit Account Balance (GET /balance)
          </h3>
          <Button onClick={handleTestBalance} disabled={isFetchingBalance} size="lg" className="w-full sm:w-auto">
            {isFetchingBalance ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Banknote className="mr-2 h-5 w-5" />
            )}
            Fetch Xendit Balance
          </Button>

          {balanceResult && (
            <div className="mt-4">
              {balanceResult.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Error Fetching Balance</AlertTitle>
                  <AlertDescription>
                    <p>{balanceResult.error}</p>
                    {balanceResult.rawResponse && renderRawResponse(balanceResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : balanceResult.data ? (
                <Alert variant="default" className="border-green-500 bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-700">Balance Fetched Successfully!</AlertTitle>
                  <AlertDescription className="text-green-600">
                    <p className="text-2xl font-bold">{formatIDR(balanceResult.data.balance)}</p>
                    {balanceResult.rawResponse && renderRawResponse(balanceResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>No Balance Result</AlertTitle>
                  <AlertDescription>The test did not return a clear result.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <Separator className="my-6" />

        {/* Payment Request Simulation Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <CreditCard className="mr-2 h-5 w-5 text-primary/80" />
            2. Simulate Payment Request (POST /payment_requests - QR Code DANA)
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="prAmount">Amount (IDR)</Label>
              <Input 
                id="prAmount" 
                type="number" 
                value={prAmount}
                onChange={(e) => setPrAmount(Number(e.target.value))}
                className="mt-1"
                placeholder="e.g., 15000"
              />
            </div>
            <div>
              <Label htmlFor="prDescription">Description</Label>
              <Input 
                id="prDescription" 
                type="text" 
                value={prDescription}
                onChange={(e) => setPrDescription(e.target.value)}
                className="mt-1"
                placeholder="e.g., Test payment for DANA QR"
              />
            </div>
          </div>
          <Button onClick={handleCreatePaymentRequest} disabled={isProcessingPr || prAmount <= 0} size="lg" className="w-full sm:w-auto">
            {isProcessingPr ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Create Test Payment Request
          </Button>

          {prResult && (
            <div className="mt-4">
              {prResult.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Error Creating Payment Request</AlertTitle>
                  <AlertDescription>
                    <p>{prResult.error}</p>
                    {prResult.rawResponse && renderRawResponse(prResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : prResult.data ? (
                 <Alert variant="default" className="border-primary bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <AlertTitle className="text-primary">Payment Request Created Successfully!</AlertTitle>
                  <AlertDescription className="text-foreground/80 space-y-1">
                    <p>Status: <span className="font-semibold">{prResult.data.status}</span></p>
                    <p>ID: <span className="font-semibold">{prResult.data.id}</span></p>
                    {prResult.data.payment_method?.qr_code?.channel_properties?.qr_string && (
                        <p>QR String (simulated): <code className="text-xs bg-muted px-1 rounded-sm truncate block max-w-xs sm:max-w-sm md:max-w-md">{prResult.data.payment_method.qr_code.channel_properties.qr_string}</code></p>
                    )}
                    {prResult.rawResponse && renderRawResponse(prResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>No Payment Request Result</AlertTitle>
                  <AlertDescription>The simulation did not return a clear result.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        
        <Separator className="my-6" />

        {/* Invoice Simulation Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <FileText className="mr-2 h-5 w-5 text-primary/80" />
            3. Simulate Invoice Creation (POST /v2/invoices)
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="invoiceAmount">Amount (IDR)</Label>
              <Input 
                id="invoiceAmount" 
                type="number" 
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                className="mt-1"
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <Label htmlFor="invoiceDescription">Description</Label>
              <Input 
                id="invoiceDescription" 
                type="text" 
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
                className="mt-1"
                placeholder="e.g., Test invoice for product"
              />
            </div>
             <div>
              <Label htmlFor="invoicePayerEmail">Payer Email (Optional)</Label>
              <Input 
                id="invoicePayerEmail" 
                type="email" 
                value={invoicePayerEmail}
                onChange={(e) => setInvoicePayerEmail(e.target.value)}
                className="mt-1"
                placeholder="e.g., customer@example.com"
              />
            </div>
          </div>
          <Button onClick={handleCreateTestInvoice} disabled={isProcessingInvoice || invoiceAmount <= 0} size="lg" className="w-full sm:w-auto">
            {isProcessingInvoice ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileText className="mr-2 h-5 w-5" />
            )}
            Create Test Invoice
          </Button>

          {invoiceResult && (
            <div className="mt-4">
              {invoiceResult.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Error Creating Test Invoice</AlertTitle>
                  <AlertDescription>
                    <p>{invoiceResult.error}</p>
                    {invoiceResult.rawResponse && renderRawResponse(invoiceResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : invoiceResult.data ? (
                 <Alert variant="default" className="border-blue-500 bg-blue-500/10">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-700">Test Invoice Created Successfully!</AlertTitle>
                  <AlertDescription className="text-blue-600/90 space-y-1">
                    <p>Status: <span className="font-semibold">{invoiceResult.data.status}</span></p>
                    <p>External ID: <span className="font-semibold">{invoiceResult.data.external_id}</span></p>
                    <p>Invoice ID: <span className="font-semibold">{invoiceResult.data.id}</span></p>
                    {invoiceResult.data.invoice_url && (
                        <p>Invoice URL: 
                            <Link href={invoiceResult.data.invoice_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-700 ml-1">
                                {invoiceResult.data.invoice_url.substring(0,50)}...
                            </Link>
                        </p>
                    )}
                    {invoiceResult.rawResponse && renderRawResponse(invoiceResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>No Invoice Result</AlertTitle>
                  <AlertDescription>The simulation did not return a clear result.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>


        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                Note: These tests directly interact with the Xendit API using your configured secret key in test mode.
                The payment request and invoice simulations create real (test mode) objects in Xendit.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

