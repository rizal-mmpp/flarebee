
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, DatabaseZap, CheckCircle, AlertTriangle, ListChecks, ServerCrash, SkipForward } from 'lucide-react';
import { runSingleMigrationAction } from '@/lib/actions/migration.actions';
import type { MigrationStatus } from '@/lib/actions/migration.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { useToast } from '@/hooks/use-toast';

const MIGRATABLE_COLLECTIONS = ['subscriptionPlans', 'services', 'sitePages', 'siteSettings', 'userCarts'];
const COLLECTION_DESCRIPTIONS: { [key: string]: string } = {
  subscriptionPlans: 'Seeds default subscription plans (Free, Personal, Pro) into ERPNext.',
  services: 'Migrates services from Firebase to Items in ERPNext.',
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
       } else {
         toast({ title: "Migration Failed", description: `Error on "${collectionName}": ${status.error}`, variant: "destructive" });
       }
    });
  };

  const getStatusIcon = (status: 'success' | 'failure' | 'pending' | 'idle') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'pending': return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      default: return <DatabaseZap className="h-5 w-5 text-muted-foreground" />;
    }
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
              return (
                 <Card key={name}>
                    <CardHeader>
                        <CardTitle className="capitalize">{name.replace(/([A-Z])/g, ' $1')}</CardTitle>
                        <CardDescription>{COLLECTION_DESCRIPTIONS[name]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => handleRunMigration(name)} disabled={state.running} className="w-full">
                            {state.running ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <DatabaseZap className="mr-2 h-4 w-4" />
                            )}
                            Migrate {name.replace(/([A-Z])/g, ' $1')}
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
