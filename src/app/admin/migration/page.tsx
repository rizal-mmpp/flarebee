
'use client';

import React, { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, DatabaseZap, CheckCircle, AlertTriangle, ListChecks, ServerCrash, SkipForward, Info, MoreHorizontal } from 'lucide-react';
import { runSingleMigrationAction } from '@/lib/actions/migration.actions';
import type { MigrationStatus } from '@/lib/actions/migration.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getServicesFromErpNext } from '@/lib/actions/erpnext/item.actions';
import { DataTable } from '@/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const MIGRATABLE_COLLECTIONS = ['services', 'subscriptionPlans', 'sitePages', 'siteSettings', 'userCarts'];

const COLLECTION_DESCRIPTIONS: { [key: string]: string } = {
  services: 'Migrates services from Firebase to Items in ERPNext.',
  subscriptionPlans: 'Seeds default subscription plans (Free, Personal, Pro) into ERPNext.',
  sitePages: 'Migrates static pages (About Us, etc.) from Firebase to Site Pages in ERPNext.',
  siteSettings: 'Migrates general site settings from Firebase to ERPNext.',
  userCarts: 'Migrates saved user carts from Firebase to ERPNext.'
};

interface MigrationTask {
    id: string; // collectionName
    name: string;
}

const migrationTasks: MigrationTask[] = MIGRATABLE_COLLECTIONS.map(name => ({
    id: name,
    name: name.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase()),
}));


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
  
  const StatusBadge = ({ state }: { state: { running: boolean; status: MigrationStatus | null } }) => {
    if (state.running) {
        return <Badge variant="outline" className="text-blue-600 border-blue-500/50 bg-blue-500/10">Running...</Badge>;
    }
    if (!state.status) {
        return <Badge variant="secondary">Not Run</Badge>;
    }
    if (state.status.success) {
        const message = `Created: ${state.status.count}, Skipped: ${state.status.skipped}`;
        return <Badge variant="outline" className="text-green-700 border-green-500/50 bg-green-500/10" title={message}>Success</Badge>;
    }
    return <Badge variant="destructive" title={state.status.error}>Failed</Badge>;
  };
  
  const columns = useMemo<ColumnDef<MigrationTask>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Collection / Task',
      cell: ({ row }) => (
        <div className="space-y-1">
            <p className="font-medium text-foreground">{row.original.name}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const state = migrationStates[row.original.id];
        return <StatusBadge state={state} />;
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        const task = row.original;
        const state = migrationStates[task.id];
        const isSubscriptionPlan = task.id === 'subscriptionPlans';
        const isSubscriptionPlanDisabled = isSubscriptionPlan && (!hasServices || isCheckingServices);
        const isDisabled = state.running || isSubscriptionPlanDisabled;

        return (
          <div className="text-right">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* Wrapper div for TooltipTrigger to handle disabled button */}
                        <div className={cn(isDisabled && "cursor-not-allowed")}>
                           <Button
                              onClick={() => handleRunMigration(task.id)}
                              disabled={isDisabled}
                              size="sm"
                              className={cn(isDisabled && "pointer-events-none")} // Important for disabled state within tooltip
                            >
                              {state.running || (isCheckingServices && isSubscriptionPlan) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <DatabaseZap className="mr-2 h-4 w-4" />
                              )}
                              Run
                            </Button>
                        </div>
                    </TooltipTrigger>
                    {isSubscriptionPlanDisabled && (
                         <TooltipContent>
                            <p>Migrate "Services" first to enable this action.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    }
  ], [migrationStates, isCheckingServices, hasServices]);

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
          
           <DataTable
            columns={columns}
            data={migrationTasks}
            pageCount={1}
            totalItems={migrationTasks.length}
            manualPagination={false}
            manualSorting={false}
            manualFiltering={true}
            isLoading={isCheckingServices}
            // Hide toolbar elements not needed for this table
            searchColumnId=""
            onPaginationChange={() => {}}
            onSortingChange={() => {}}
            onColumnFiltersChange={() => {}}
          />

        </CardContent>
      </Card>
    </div>
  );
}
