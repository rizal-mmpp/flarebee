
import Link from 'next/link';
import { Hexagon } from 'lucide-react';
import NextImage from 'next/image';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export default async function AuthLayout({ // Changed to async function
  children,
}: {
  children: React.ReactNode;
}) {
  let settings;
  try {
    settings = await getSiteSettings();
  } catch (error) {
    console.error("AuthLayout: Failed to fetch site settings, using defaults:", error);
    settings = DEFAULT_SETTINGS;
  }

  const siteTitle = settings.siteTitle || DEFAULT_SETTINGS.siteTitle;
  const logoUrl = settings.logoUrl;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-50">
        <Link href="/" className="flex items-center gap-2 group backdrop-blur-sm bg-background/10 rounded-full p-2 transition-colors hover:bg-background/20">
          {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={32} height={32} className="h-8 w-8 object-contain" />
          ) : (
            <Hexagon className="h-8 w-8 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          )}
          <span className="text-lg font-bold text-foreground pr-2">{siteTitle}</span>
        </Link>
      </div>
      <div className="w-full flex-grow">
        {children}
      </div>
      <p className="fixed bottom-6 left-0 right-0 text-center text-sm text-muted-foreground backdrop-blur-sm bg-background/10 py-2">
        &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
      </p>
    </div>
  );
}
