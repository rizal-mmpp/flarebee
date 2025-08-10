
import type {Metadata, ResolvingMetadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CombinedAuthProvider } from '@/lib/context/CombinedAuthContext';
import { CartProvider } from '@/context/CartContext'; 
import { Happy_Monkey } from 'next/font/google';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';

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
  weight: '400', 
  subsets: ['latin'],
});

export async function generateMetadata(
  parent?: ResolvingMetadata
): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const siteTitle = settings.siteTitle || DEFAULT_SETTINGS.siteTitle;
    // Use favicon if available, fallback to logo, then default favicon
    const faviconUrl = settings.faviconUrl || settings.logoUrl || DEFAULT_SETTINGS.faviconUrl;
    
    // Configure multiple icon types for better device compatibility

    return {
      title: {
        default: siteTitle,
        template: `%s | ${siteTitle}`,
      },
      description: 'High-quality services and templates for your next project. Turn tech into your superpower.',
      icons: {
        icon: faviconUrl || DEFAULT_SETTINGS.faviconUrl || "",
        apple: faviconUrl || DEFAULT_SETTINGS.faviconUrl || ""
      },
      verification: {
        other: {
          'facebook-domain-verification': 'ogqwm3nmnd6dvy0oheor2u0cw8accu',
        },
      },
    };
  } catch (error) {
    console.error("Error fetching settings for metadata, using defaults:", error);
    return {
      title: {
        default: DEFAULT_SETTINGS.siteTitle,
        template: `%s | ${DEFAULT_SETTINGS.siteTitle}`,
      },
      description: 'High-quality services and templates for your next project. Turn tech into your superpower.',
      icons: {
        icon: DEFAULT_SETTINGS.faviconUrl || "",
        apple: DEFAULT_SETTINGS.faviconUrl || ""
      },
       verification: {
        other: {
          'facebook-domain-verification': 'ogqwm3nmnd6dvy0oheor2u0cw8accu',
        },
      },
    };
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} ${happyMonkey.variable} antialiased bg-background text-foreground`}>
        <CombinedAuthProvider>
          <CartProvider> 
            {children}
            <Toaster />
          </CartProvider>
        </CombinedAuthProvider>
      </body>
    </html>
  );
}
