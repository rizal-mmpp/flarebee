
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-card p-4">
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <Link href="/" className="flex items-center gap-2 group">
          {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={32} height={32} className="h-8 w-8 object-contain" />
          ) : (
            <Hexagon className="h-8 w-8 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          )}
          <span className="text-lg font-bold text-foreground">{siteTitle}</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
      </p>
    </div>
  );
}
