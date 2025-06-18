
import type {Metadata, ResolvingMetadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/lib/firebase/AuthContext';
import { CartProvider } from '@/context/CartContext'; 
import { Happy_Monkey } from 'next/font/google';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants'; // Updated import

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

// export const metadata: Metadata = {
//   title: 'Ragam Inovasi Optima', // Default title
//   description: 'High-quality templates for your next project.',
// };

export async function generateMetadata(
  parent?: ResolvingMetadata
): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const siteTitle = settings.siteTitle || DEFAULT_SETTINGS.siteTitle;
    // const faviconUrl = settings.faviconUrl || '/favicon.ico'; // Basic favicon handling

    return {
      title: {
        default: siteTitle,
        template: `%s | ${siteTitle}`,
      },
      description: 'High-quality services and templates for your next project. Turn tech into your superpower.',
      // icons: {
      //   icon: faviconUrl, // For dynamic favicon, needs careful setup
      // }
    };
  } catch (error) {
    console.error("Error fetching settings for metadata, using defaults:", error);
    return {
      title: {
        default: DEFAULT_SETTINGS.siteTitle,
        template: `%s | ${DEFAULT_SETTINGS.siteTitle}`,
      },
      description: 'High-quality services and templates for your next project. Turn tech into your superpower.',
      // icons: {
      //   icon: '/favicon.ico',
      // }
    };
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${happyMonkey.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <CartProvider> 
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
