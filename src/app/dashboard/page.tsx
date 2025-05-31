
'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Briefcase, Settings, UserCircle } from 'lucide-react';

export default function UserDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome back, {user?.displayName || 'User'}! This is your dashboard.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Purchased Templates
              </CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-xs text-muted-foreground pt-1">
                (Placeholder for your templates)
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Account Settings
              </CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground pt-1">
                    Manage your profile and preferences. (Placeholder)
                </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                User Profile
              </CardTitle>
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground pt-1">
                    View and update your public information. (Placeholder)
                </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Activity (Placeholder)</h2>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Activity Feed</CardTitle>
                <CardDescription>This is where your recent activities would show up.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                    <li>Downloaded "Nexus Dashboard Pro" - 2 days ago.</li>
                    <li>Updated profile picture - 1 week ago.</li>
                    <li>Joined Flarebee - 1 month ago.</li>
                </ul>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
