
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/lib/firebase/AuthContext';
import { CartProvider } from '@/context/CartContext'; // Import CartProvider
import { Happy_Monkey } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const happyMonkey = Happy_Monkey({
  variable: '--font-happy-monkey',
  weight: '400', // Happy Monkey only has a regular 400 weight
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ragam Inovasi Optima',
  description: 'High-quality templates for your next project.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${happyMonkey.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <CartProvider> {/* Wrap with CartProvider */}
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

