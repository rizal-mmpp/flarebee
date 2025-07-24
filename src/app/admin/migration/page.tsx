
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, DatabaseZap, CheckCircle, AlertTriangle, ListChecks, ServerCrash, SkipForward, Info } from 'lucide-react';
import { runSingleMigrationAction } from '@/lib/actions/migration.actions';
import type { MigrationStatus } from '@/lib/actions/migration.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getServicesFromErpNext } from '@/lib/actions/erpnext/item.actions';

const MIGRATABLE_COLLECTIONS = ['services', 'subscriptionPlans', 'sitePages', 'siteSettings', 'userCarts'];

const COLLECTION_DESCRIPTIONS: { [key: string]: string } = {
  services: 'Migrates services from Firebase to Items in ERPNext.',
  subscriptionPlans: 'Seeds default subscription plans (Free, Personal, Pro) into ERPNext.',
  sitePages: 'Migrates static pages (About Us, etc.) from Firebase to Site Pages in ERPNext.',
  siteSettings: 'Migrates general site settings from Firebase to ERPNext.',
  userCarts: 'Migrates saved user carts from Firebase to ERPNext.'
};

export default function MigrationPage() {
  const { authMethod, erpSid } = useCombinedAuth();
  const { toast } = useToast();
  
  const [migrationStates, setMigrationStates] = useState<Record<string, { running: boolean; status: MigrationStatus | null }>>(
    MIGRATABLE_COLLECTIONS.reduce((acc, name) => ({ ...acc, [name]: { running: false, status: null } }), {})
  );

  const [hasServices, setHasServices] = useState(false);
  const [isCheckingServices, setIsCheckingServices] = useState(true);

  useEffect(() => {
    async function checkExistingServices() {
        if (!erpSid) {
            setIsCheckingServices(false);
            return;
        }
        setIsCheckingServices(true);
        const result = await getServicesFromErpNext({ sid: erpSid });
        if (result.success && result.data && result.data.length > 0) {
            setHasServices(true);
        } else {
            setHasServices(false);
        }
        setIsCheckingServices(false);
    }
    checkExistingServices();
  }, [erpSid]);


  const handleRunMigration = (collectionName: string) => {
    if (authMethod !== 'erpnext' || !erpSid) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in with ERPNext to perform data migration.',
        variant: 'destructive',
      });
      return;
    }

    setMigrationStates(prev => ({ ...prev, [collectionName]: { running: true, status: null } }));
    
    runSingleMigrationAction(collectionName, erpSid).then(status => {
       setMigrationStates(prev => ({ ...prev, [collectionName]: { running: false, status } }));
       if (status.success) {
         toast({ title: "Migration Complete", description: `Finished processing "${collectionName}".` });
         if (collectionName === 'services' && status.count > 0) {
             setHasServices(true); // If services were successfully migrated, enable plan migration
         }
       } else {
         toast({ title: "Migration Failed", description: `Error on "${collectionName}": ${status.error}`, variant: "destructive" });
       }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <DatabaseZap className="h-7 w-7 text-primary mr-3" />
            Firebase to ERPNext Data Migration
          </CardTitle>
          <CardDescription>
            Migrate data from Firebase collections to corresponding Doctypes in ERPNext, one at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: Idempotent Action</AlertTitle>
            <AlertDescription>
              This process will attempt to create new records in ERPNext if they do not already exist based on a unique key (e.g., slug, ID). Running it multiple times is safe and will not create duplicate entries.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MIGRATABLE_COLLECTIONS.map(name => {
              const state = migrationStates[name];
              const isSubscriptionPlan = name === 'subscriptionPlans';
              const isSubscriptionPlanDisabled = isSubscriptionPlan && (!hasServices || isCheckingServices);
              
              return (
                 <Card key={name}>
                    <CardHeader>
                        <CardTitle className="capitalize">{name.replace(/([A-Z])/g, ' $1')}</CardTitle>
                        <CardDescription>{COLLECTION_DESCRIPTIONS[name]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSubscriptionPlanDisabled && (
                             <Alert variant="default" className="border-blue-500/50 bg-blue-500/5 mb-4">
                                <Info className="h-4 w-4 text-blue-600"/>
                                <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
                                    You must migrate "Services" before you can migrate "Subscription Plans".
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button onClick={() => handleRunMigration(name)} disabled={state.running || isSubscriptionPlanDisabled} className="w-full">
                            {state.running || (isCheckingServices && isSubscriptionPlan) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <DatabaseZap className="mr-2 h-4 w-4" />
                            )}
                            { (isCheckingServices && isSubscriptionPlan) ? 'Checking dependencies...' : `Migrate ${name.replace(/([A-Z])/g, ' $1')}` }
                        </Button>
                    </CardContent>
                    {state.status && (
                        <CardFooter>
                             <div className="w-full">
                                {state.status.success ? (
                                    <Alert className="border-green-500 bg-green-500/10">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-700">Migration Successful</AlertTitle>
                                        <AlertDescription className="text-green-600/90 text-xs">
                                          Created: {state.status.count}, Skipped: {state.status.skipped}
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                     <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Migration Failed</AlertTitle>
                                        <AlertDescription className="text-xs">{state.status.error}</AlertDescription>
                                     </Alert>
                                )}
                            </div>
                        </CardFooter>
                    )}
                 </Card>
              );
          })}
        </div>
    </div>
  );
}
