
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
