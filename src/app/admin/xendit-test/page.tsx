
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getXenditBalance, type XenditBalanceResult } from '@/lib/actions/xenditAdmin.actions';
import { Loader2, CheckCircle, AlertTriangle, Wifi, Banknote } from 'lucide-react';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // Xendit balance is usually an integer
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function XenditTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<XenditBalanceResult | null>(null);

  const handleTestBalance = async () => {
    setIsLoading(true);
    setResult(null);
    const response = await getXenditBalance();
    setResult(response);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Wifi className="mr-3 h-7 w-7 text-primary" />
            Xendit Integration Test
          </CardTitle>
          <CardDescription>
            Test the connection to the Xendit API by fetching your account balance.
            This uses your <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">XENDIT_SECRET_KEY</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleTestBalance} disabled={isLoading} size="lg" className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Banknote className="mr-2 h-5 w-5" />
            )}
            Fetch Xendit Balance
          </Button>

          {result && (
            <div className="mt-6">
              {result.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Error Fetching Balance</AlertTitle>
                  <AlertDescription>
                    <p>{result.error}</p>
                    {result.rawResponse && (
                       <details className="mt-2 text-xs">
                        <summary>Raw Error Response</summary>
                        <pre className="mt-1 p-2 bg-destructive/10 rounded-md overflow-x-auto">
                          {JSON.stringify(result.rawResponse, null, 2)}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              ) : result.data ? (
                <Alert variant="default" className="border-green-500 bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-700">Balance Fetched Successfully!</AlertTitle>
                  <AlertDescription className="text-green-600">
                    <p className="text-2xl font-bold">{formatIDR(result.data.balance)}</p>
                     <details className="mt-2 text-xs text-muted-foreground">
                        <summary>Raw Success Response</summary>
                        <pre className="mt-1 p-2 bg-green-500/5 rounded-md overflow-x-auto">
                          {JSON.stringify(result.rawResponse, null, 2)}
                        </pre>
                      </details>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>No Result</AlertTitle>
                  <AlertDescription>The test did not return a clear result. This should not happen.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
       <p className="text-xs text-muted-foreground text-center">
        Note: This page is for testing purposes only and demonstrates a direct API call to Xendit.
        Ensure your <code className="font-mono bg-muted px-0.5 py-0.5 rounded-sm">XENDIT_SECRET_KEY</code> is correctly configured in your environment variables.
        The balance shown is from your Xendit test or live account, depending on the key used.
      </p>
    </div>
  );
}
