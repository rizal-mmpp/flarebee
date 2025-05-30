
import { Navbar } from '@/components/layout/Navbar'; // Can be a different admin-specific navbar
import { Footer } from '@/components/layout/Footer';   // Or an admin-specific footer/none

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Consider an Admin-specific Navbar or Sidebar here if needed */}
      <Navbar /> 
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
