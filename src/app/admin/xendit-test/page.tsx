
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getXenditBalance, 
  createXenditPaymentRequest,
  createXenditTestInvoice,
  getXenditTestInvoice,
  simulateXenditInvoicePayment,
  simulateXenditVAPayment, // New import
  type XenditBalanceResult,
  type XenditPaymentRequestResult,
  type CreatePaymentRequestArgs,
  type XenditInvoiceResult,
  type CreateTestInvoiceArgs,
  type XenditSimulatePaymentResult,
  type SimulatePaymentArgs,
  type SimulateVAPaymentArgs, // New import
  type XenditSimulateVAPaymentResult, // New import
} from '@/lib/actions/xenditAdmin.actions';
import { Loader2, CheckCircle, AlertTriangle, Wifi, Banknote, CreditCard, FileText, Search, Send, Landmark } from 'lucide-react'; // Added Landmark
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

  // Invoice Creation Simulation State
  const [invoiceAmount, setInvoiceAmount] = useState<number>(50000);
  const [invoiceDescription, setInvoiceDescription] = useState('Sample Flarebee Test Invoice');
  const [invoicePayerEmail, setInvoicePayerEmail] = useState('');
  const [requestFva, setRequestFva] = useState(false);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [invoiceCreationResult, setInvoiceCreationResult] = useState<XenditInvoiceResult | null>(null);

  // Get Invoice State
  const [getInvoiceId, setGetInvoiceId] = useState('');
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);
  const [getInvoiceResult, setGetInvoiceResult] = useState<XenditInvoiceResult | null>(null);

  // Simulate Invoice Payment State
  const [simulatePaymentInvoiceId, setSimulatePaymentInvoiceId] = useState('');
  const [simulatePaymentAmount, setSimulatePaymentAmount] = useState<string>(''); // string to allow empty
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simulatePaymentResult, setSimulatePaymentResult] = useState<XenditSimulatePaymentResult | null>(null);

  // Simulate Direct VA Payment State
  const [vaBankCode, setVaBankCode] = useState('BCA');
  const [vaAccountNumber, setVaAccountNumber] = useState('');
  const [vaAmount, setVaAmount] = useState<number>(50000);
  const [isSimulatingVAPayment, setIsSimulatingVAPayment] = useState(false);
  const [simulateVAPaymentResult, setSimulateVAPaymentResult] = useState<XenditSimulateVAPaymentResult | null>(null);


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
    setInvoiceCreationResult(null);
    const args: CreateTestInvoiceArgs = {
      amount: invoiceAmount,
      description: invoiceDescription,
      payerEmail: invoicePayerEmail || undefined,
      requestFva: requestFva,
    };
    const response = await createXenditTestInvoice(args);
    setInvoiceCreationResult(response);
    if (response.data?.id) {
      setGetInvoiceId(response.data.id); 
      setSimulatePaymentInvoiceId(response.data.id); 
    }
    setIsProcessingInvoice(false);
  };

  const handleGetInvoice = async () => {
    if (!getInvoiceId) return;
    setIsFetchingInvoice(true);
    setGetInvoiceResult(null);
    const response = await getXenditTestInvoice(getInvoiceId);
    setGetInvoiceResult(response);
    setIsFetchingInvoice(false);
  };

  const handleSimulatePayment = async () => {
    if (!simulatePaymentInvoiceId) return;
    setIsSimulatingPayment(true);
    setSimulatePaymentResult(null);
    const paymentAmount = simulatePaymentAmount ? parseFloat(simulatePaymentAmount) : undefined;
    const args: SimulatePaymentArgs = {
      invoiceId: simulatePaymentInvoiceId,
      amount: paymentAmount,
    };
    const response = await simulateXenditInvoicePayment(args);
    setSimulatePaymentResult(response);
    setIsSimulatingPayment(false);
  }

  const handleSimulateVAPayment = async () => {
    if (!vaBankCode || !vaAccountNumber || vaAmount <= 0) return;
    setIsSimulatingVAPayment(true);
    setSimulateVAPaymentResult(null);
    const args: SimulateVAPaymentArgs = {
      bankCode: vaBankCode,
      accountNumber: vaAccountNumber,
      amount: vaAmount,
    };
    const response = await simulateXenditVAPayment(args);
    setSimulateVAPaymentResult(response);
    setIsSimulatingVAPayment(false);
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
            Ensure your <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">XENDIT_SECRET_KEY</code> is correctly configured.
          </CardDescription>
        </CardHeader>
        
        {/* Balance Check Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Banknote className="mr-2 h-5 w-5 text-primary/80" />
            1. Check Xendit Account Balance (GET /balance)
          </h3>
          <Button onClick={handleTestBalance} disabled={isFetchingBalance} size="lg" className="w-full sm:w-auto">
            {isFetchingBalance ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
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
              ) : null }
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
              <Input id="prAmount" type="number" value={prAmount} onChange={(e) => setPrAmount(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="prDescription">Description</Label>
              <Input id="prDescription" type="text" value={prDescription} onChange={(e) => setPrDescription(e.target.value)} className="mt-1" />
            </div>
          </div>
          <Button onClick={handleCreatePaymentRequest} disabled={isProcessingPr || prAmount <= 0} size="lg" className="w-full sm:w-auto">
            {isProcessingPr ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
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
                  <AlertTitle className="text-primary">Payment Request Created!</AlertTitle>
                  <AlertDescription className="text-foreground/80 space-y-1">
                    <p>Status: <span className="font-semibold">{prResult.data.status}</span>, ID: <span className="font-semibold">{prResult.data.id}</span></p>
                    {prResult.data.payment_method?.qr_code?.channel_properties?.qr_string && (
                        <p>QR String: <code className="text-xs bg-muted px-1 rounded-sm truncate block max-w-xs sm:max-w-sm md:max-w-md">{prResult.data.payment_method.qr_code.channel_properties.qr_string}</code></p>
                    )}
                    {prResult.rawResponse && renderRawResponse(prResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : null }
            </div>
          )}
        </CardContent>
        
        <Separator className="my-6" />

        {/* Invoice Creation Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <FileText className="mr-2 h-5 w-5 text-primary/80" />
            3. Create Test Invoice (POST /v2/invoices)
          </h3>
          <div className="space-y-4 max-w-md">
            <div><Label htmlFor="invoiceAmount">Amount (IDR)</Label><Input id="invoiceAmount" type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(Number(e.target.value))} className="mt-1"/></div>
            <div><Label htmlFor="invoiceDescription">Description</Label><Input id="invoiceDescription" type="text" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} className="mt-1"/></div>
            <div><Label htmlFor="invoicePayerEmail">Payer Email (Optional)</Label><Input id="invoicePayerEmail" type="email" value={invoicePayerEmail} onChange={(e) => setInvoicePayerEmail(e.target.value)} className="mt-1"/></div>
            <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="requestFva" checked={requestFva} onCheckedChange={(checked) => setRequestFva(checked as boolean)} />
                <Label htmlFor="requestFva" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Request Fixed Virtual Account (FVA) Payment Methods
                </Label>
            </div>
          </div>
          <Button onClick={handleCreateTestInvoice} disabled={isProcessingInvoice || invoiceAmount <= 0} size="lg" className="w-full sm:w-auto">
            {isProcessingInvoice ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
            Create Test Invoice
          </Button>
          {invoiceCreationResult && (
            <div className="mt-4">
              {invoiceCreationResult.error ? (
                <Alert variant="destructive"><AlertTriangle className="h-5 w-5" /><AlertTitle>Error Creating Invoice</AlertTitle><AlertDescription><p>{invoiceCreationResult.error}</p>{invoiceCreationResult.rawResponse && renderRawResponse(invoiceCreationResult.rawResponse)}</AlertDescription></Alert>
              ) : invoiceCreationResult.data ? (
                 <Alert variant="default" className="border-blue-500 bg-blue-500/10"><CheckCircle className="h-5 w-5 text-blue-600" /><AlertTitle className="text-blue-700">Invoice Created!</AlertTitle><AlertDescription className="text-blue-600/90 space-y-1">
                    <p>Status: <span className="font-semibold">{invoiceCreationResult.data.status}</span>, External ID: <span className="font-semibold">{invoiceCreationResult.data.external_id}</span></p>
                    <p>Invoice ID: <span className="font-semibold">{invoiceCreationResult.data.id}</span></p>
                    {invoiceCreationResult.data.invoice_url && (<p>URL: <Link href={invoiceCreationResult.data.invoice_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-700 ml-1">{invoiceCreationResult.data.invoice_url.substring(0,50)}...</Link></p>)}
                    {invoiceCreationResult.data.payment_methods && (<p>Payment Methods: {invoiceCreationResult.data.payment_methods.map((pm: any) => pm.type || pm).join(', ')}</p>)}
                    {invoiceCreationResult.rawResponse && renderRawResponse(invoiceCreationResult.rawResponse)}</AlertDescription></Alert>
              ) : null}
            </div>
          )}
        </CardContent>

        <Separator className="my-6" />

        {/* Get Invoice Details Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Search className="mr-2 h-5 w-5 text-primary/80" />
            4. Get Invoice Details (GET /v2/invoices/:invoice_id)
          </h3>
          <div className="space-y-4 max-w-md">
            <div><Label htmlFor="getInvoiceId">Invoice ID</Label><Input id="getInvoiceId" type="text" value={getInvoiceId} onChange={(e) => setGetInvoiceId(e.target.value)} placeholder="inv_..." className="mt-1"/></div>
          </div>
          <Button onClick={handleGetInvoice} disabled={isFetchingInvoice || !getInvoiceId} size="lg" className="w-full sm:w-auto">
            {isFetchingInvoice ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            Fetch Invoice Details
          </Button>
          {getInvoiceResult && (
            <div className="mt-4">
              {getInvoiceResult.error ? (
                <Alert variant="destructive"><AlertTriangle className="h-5 w-5" /><AlertTitle>Error Fetching Invoice</AlertTitle><AlertDescription><p>{getInvoiceResult.error}</p>{getInvoiceResult.rawResponse && renderRawResponse(getInvoiceResult.rawResponse)}</AlertDescription></Alert>
              ) : getInvoiceResult.data ? (
                 <Alert variant="default" className="border-purple-500 bg-purple-500/10"><CheckCircle className="h-5 w-5 text-purple-600" /><AlertTitle className="text-purple-700">Invoice Details Fetched!</AlertTitle><AlertDescription className="text-purple-600/90 space-y-1">
                    <p>Status: <span className="font-semibold">{getInvoiceResult.data.status}</span>, Amount: <span className="font-semibold">{formatIDR(getInvoiceResult.data.amount)}</span></p>
                    <p>External ID: <span className="font-semibold">{getInvoiceResult.data.external_id}</span></p>
                    {getInvoiceResult.data.payment_methods && (<p>Payment Methods: {getInvoiceResult.data.payment_methods.map((pm: any) => pm.type || pm).join(', ')}</p>)}
                    {getInvoiceResult.rawResponse && renderRawResponse(getInvoiceResult.rawResponse)}</AlertDescription></Alert>
              ) : null}
            </div>
          )}
        </CardContent>

        <Separator className="my-6" />
        
        {/* Simulate Invoice Payment Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Send className="mr-2 h-5 w-5 text-primary/80" />
            5. Simulate Invoice Payment (POST /v2/invoices/:invoice_id/simulate_payment)
          </h3>
          <div className="space-y-4 max-w-md">
            <div><Label htmlFor="simulatePaymentInvoiceId">Invoice ID to Simulate Payment For</Label><Input id="simulatePaymentInvoiceId" type="text" value={simulatePaymentInvoiceId} onChange={(e) => setSimulatePaymentInvoiceId(e.target.value)} placeholder="inv_..." className="mt-1"/></div>
            <div><Label htmlFor="simulatePaymentAmount">Simulated Payment Amount (IDR, Optional)</Label><Input id="simulatePaymentAmount" type="number" value={simulatePaymentAmount} onChange={(e) => setSimulatePaymentAmount(e.target.value)} placeholder="e.g., 50000 (uses invoice amount if blank)" className="mt-1"/></div>
          </div>
          <Button onClick={handleSimulatePayment} disabled={isSimulatingPayment || !simulatePaymentInvoiceId} size="lg" className="w-full sm:w-auto">
            {isSimulatingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            Simulate Invoice Payment
          </Button>
          {simulatePaymentResult && (
            <div className="mt-4">
              {simulatePaymentResult.error ? (
                <Alert variant="destructive"><AlertTriangle className="h-5 w-5" /><AlertTitle>Error Simulating Invoice Payment</AlertTitle><AlertDescription><p>{simulatePaymentResult.error}</p>{simulatePaymentResult.rawResponse && renderRawResponse(simulatePaymentResult.rawResponse)}</AlertDescription></Alert>
              ) : simulatePaymentResult.data ? (
                 <Alert variant="default" className="border-teal-500 bg-teal-500/10"><CheckCircle className="h-5 w-5 text-teal-600" /><AlertTitle className="text-teal-700">Invoice Payment Simulation Successful!</AlertTitle><AlertDescription className="text-teal-600/90 space-y-1">
                    <p>Invoice should now be marked as PAID (or relevant status).</p>
                    <p>Response Status: <span className="font-semibold">{simulatePaymentResult.data.status || "N/A (Check raw response)"}</span></p>
                    <p>Check "Get Invoice Details" again for updated status.</p>
                    {simulatePaymentResult.rawResponse && renderRawResponse(simulatePaymentResult.rawResponse)}</AlertDescription></Alert>
              ) : null}
            </div>
          )}
        </CardContent>

        <Separator className="my-6" />

        {/* Simulate Direct VA Payment Section */}
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Landmark className="mr-2 h-5 w-5 text-primary/80" />
            6. Simulate Direct Virtual Account (VA) Payment (POST /pool_virtual_accounts/simulate_payment)
          </h3>
          <div className="space-y-4 max-w-md">
            <div><Label htmlFor="vaBankCode">Bank Code (e.g., BCA, MANDIRI)</Label><Input id="vaBankCode" type="text" value={vaBankCode} onChange={(e) => setVaBankCode(e.target.value)} placeholder="BCA" className="mt-1"/></div>
            <div><Label htmlFor="vaAccountNumber">Bank Account Number (VA Number)</Label><Input id="vaAccountNumber" type="text" value={vaAccountNumber} onChange={(e) => setVaAccountNumber(e.target.value)} placeholder="Test VA Number" className="mt-1"/></div>
            <div><Label htmlFor="vaAmount">Transfer Amount (IDR)</Label><Input id="vaAmount" type="number" value={vaAmount} onChange={(e) => setVaAmount(Number(e.target.value))} placeholder="50000" className="mt-1"/></div>
          </div>
          <Button onClick={handleSimulateVAPayment} disabled={isSimulatingVAPayment || !vaBankCode || !vaAccountNumber || vaAmount <=0} size="lg" className="w-full sm:w-auto">
            {isSimulatingVAPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Landmark className="mr-2 h-5 w-5" />}
            Simulate VA Payment
          </Button>
          {simulateVAPaymentResult && (
            <div className="mt-4">
              {simulateVAPaymentResult.error ? (
                <Alert variant="destructive"><AlertTriangle className="h-5 w-5" /><AlertTitle>Error Simulating VA Payment</AlertTitle><AlertDescription><p>{simulateVAPaymentResult.error}</p>{simulateVAPaymentResult.rawResponse && renderRawResponse(simulateVAPaymentResult.rawResponse)}</AlertDescription></Alert>
              ) : simulateVAPaymentResult.data ? (
                 <Alert variant="default" className="border-orange-500 bg-orange-500/10"><CheckCircle className="h-5 w-5 text-orange-600" /><AlertTitle className="text-orange-700">VA Payment Simulation Submitted!</AlertTitle><AlertDescription className="text-orange-600/90 space-y-1">
                    <p>Status: <span className="font-semibold">{simulateVAPaymentResult.data.status}</span></p>
                    <p>Message: {simulateVAPaymentResult.data.message}</p>
                    {simulateVAPaymentResult.rawResponse && renderRawResponse(simulateVAPaymentResult.rawResponse)}</AlertDescription></Alert>
              ) : null}
            </div>
          )}
        </CardContent>


        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full pt-4">
                Note: These tests directly interact with the Xendit API using your configured secret key in test mode.
                These actions will create/modify test objects in your Xendit dashboard.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

