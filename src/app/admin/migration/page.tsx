
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, DatabaseZap, CheckCircle, AlertTriangle, ListChecks, ServerCrash } from 'lucide-react';
import { runMigrationAction } from '@/lib/actions/migration.actions';
import type { MigrationStatus } from '@/lib/actions/migration.actions';

const collectionNames = ['users', 'services', 'sitePages', 'siteSettings', 'orders', 'userCarts'];

export default function MigrationPage() {
  const [isMigrating, startMigration] = useTransition();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  const [overallResult, setOverallResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRunMigration = () => {
    setMigrationStatus([]);
    setOverallResult(null);
    startMigration(async () => {
      const result = await runMigrationAction((status) => {
        setMigrationStatus(prev => [...prev, status]);
      });
      setOverallResult(result);
    });
  };

  const getStatusIcon = (status: 'success' | 'failure' | 'pending') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'pending': return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
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
            Migrate data from Firebase collections to corresponding Doctypes in ERPNext.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: Irreversible Action</AlertTitle>
            <AlertDescription>
              This process will attempt to create new records in ERPNext based on data in Firebase. It is designed to be run once. Running it multiple times may create duplicate entries. Please ensure you have backups and that your ERPNext Doctypes are prepared before proceeding.
            </AlertDescription>
          </Alert>

          <Button onClick={handleRunMigration} disabled={isMigrating} size="lg">
            {isMigrating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <DatabaseZap className="mr-2 h-5 w-5" />
            )}
            Start Data Migration
          </Button>
        </CardContent>
      </Card>

      {(isMigrating || migrationStatus.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary"/>Migration Progress</CardTitle>
            <CardDescription>Live status of the data migration process.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              {collectionNames.map(name => {
                const status = migrationStatus.find(s => s.collection === name);
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center">
                      {getStatusIcon(status ? (status.success ? 'success' : 'failure') : 'pending')}
                      <span className="ml-3 capitalize">{name}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {status ? (
                        status.success ? `Migrated ${status.count} records.` : `Failed: ${status.error}`
                      ) : (
                        `Pending...`
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {overallResult && (
              <Alert className={`mt-6 ${overallResult.success ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}`}>
                {overallResult.success ? <CheckCircle className={`h-4 w-4 ${overallResult.success ? 'text-green-600' : 'text-destructive'}`} /> : <ServerCrash className={`h-4 w-4 ${overallResult.success ? 'text-green-600' : 'text-destructive'}`} />}
                <AlertTitle className={`${overallResult.success ? 'text-green-700' : 'text-destructive'}`}>{overallResult.success ? 'Migration Complete' : 'Migration Failed'}</AlertTitle>
                <AlertDescription className={`${overallResult.success ? 'text-green-600/90' : 'text-destructive/90'}`}>
                  {overallResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
