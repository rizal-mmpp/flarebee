
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
  type XenditBalanceResult,
  type XenditPaymentRequestResult,
  type CreatePaymentRequestArgs
} from '@/lib/actions/xenditAdmin.actions';
import { Loader2, CheckCircle, AlertTriangle, Wifi, Banknote, CreditCard } from 'lucide-react';

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
  const [paymentAmount, setPaymentAmount] = useState<number>(15000);
  const [paymentDescription, setPaymentDescription] = useState('Sample Flarebee Test Payment');
  const [isProcessingPaymentRequest, setIsProcessingPaymentRequest] = useState(false);
  const [paymentRequestResult, setPaymentRequestResult] = useState<XenditPaymentRequestResult | null>(null);

  const handleTestBalance = async () => {
    setIsFetchingBalance(true);
    setBalanceResult(null);
    const response = await getXenditBalance();
    setBalanceResult(response);
    setIsFetchingBalance(false);
  };

  const handleCreatePaymentRequest = async () => {
    setIsProcessingPaymentRequest(true);
    setPaymentRequestResult(null);
    const args: CreatePaymentRequestArgs = {
      amount: paymentAmount,
      description: paymentDescription,
      currency: 'IDR', // Fixed to IDR as per example
    };
    const response = await createXenditPaymentRequest(args);
    setPaymentRequestResult(response);
    setIsProcessingPaymentRequest(false);
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
            1. Check Xendit Account Balance
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
            2. Simulate Payment Request (QR Code - DANA)
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="paymentAmount">Amount (IDR)</Label>
              <Input 
                id="paymentAmount" 
                type="number" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="mt-1"
                placeholder="e.g., 15000"
              />
            </div>
            <div>
              <Label htmlFor="paymentDescription">Description</Label>
              <Input 
                id="paymentDescription" 
                type="text" 
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                className="mt-1"
                placeholder="e.g., Test payment for item"
              />
            </div>
          </div>
          <Button onClick={handleCreatePaymentRequest} disabled={isProcessingPaymentRequest || paymentAmount <= 0} size="lg" className="w-full sm:w-auto">
            {isProcessingPaymentRequest ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Create Test Payment Request
          </Button>

          {paymentRequestResult && (
            <div className="mt-4">
              {paymentRequestResult.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Error Creating Payment Request</AlertTitle>
                  <AlertDescription>
                    <p>{paymentRequestResult.error}</p>
                    {paymentRequestResult.rawResponse && renderRawResponse(paymentRequestResult.rawResponse)}
                  </AlertDescription>
                </Alert>
              ) : paymentRequestResult.data ? (
                 <Alert variant="default" className="border-primary bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <AlertTitle className="text-primary">Payment Request Created Successfully!</AlertTitle>
                  <AlertDescription className="text-foreground/80">
                    <p>Status: <span className="font-semibold">{paymentRequestResult.data.status}</span></p>
                    <p>ID: <span className="font-semibold">{paymentRequestResult.data.id}</span></p>
                    {paymentRequestResult.data.payment_method?.qr_code?.channel_properties?.qr_string && (
                        <p className="mt-2">QR String (simulated): <code className="text-xs bg-muted px-1 rounded-sm truncate block max-w-xs sm:max-w-sm md:max-w-md">{paymentRequestResult.data.payment_method.qr_code.channel_properties.qr_string}</code></p>
                    )}
                    {paymentRequestResult.rawResponse && renderRawResponse(paymentRequestResult.rawResponse)}
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
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center">
                Note: These tests directly interact with the Xendit API using your configured secret key.
                The payment request simulation creates a real (test mode) payment request in Xendit.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

