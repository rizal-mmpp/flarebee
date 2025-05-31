// This file's content has been replaced to resolve a potential layout conflict.
// The admin dashboard layout functionality has been moved to /src/app/admin/layout.tsx.
// This file should ideally be deleted.

import type { ReactNode } from 'react';

export default function InactiveAdminConflictLayout({ children }: { children: ReactNode }) {
  // This layout does nothing to avoid interfering with other routes
  // if the (admin) route group directory still exists.
  return <>{children}</>;
}

export const metadata = {
  title: 'Inactive Admin Section (Conflict Resolution)',
  description: 'This layout is intentionally minimal to resolve routing conflicts.',
};
