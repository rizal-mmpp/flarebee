'use client';

import Link from 'next/link';
import { Hexagon, MapPin, Phone, Mail } from 'lucide-react';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import NextImage from 'next/image';
import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/types';

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getSiteSettings();
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Footer: Failed to fetch site settings, using defaults:", error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <footer className="border-t border-border/40 bg-background text-muted-foreground">
        <div className="container mx-auto px-4 py-10 md:px-6">
          <div className="h-8 w-1/2 animate-pulse rounded-md bg-muted" />
        </div>
      </footer>
    );
  }

  const siteName = settings?.siteTitle || DEFAULT_SETTINGS.siteTitle;
  const address = settings?.contactAddress || DEFAULT_SETTINGS.contactAddress || "Address not set";
  const phone = settings?.contactPhone || DEFAULT_SETTINGS.contactPhone || "Phone not set";
  const email = settings?.contactEmail || DEFAULT_SETTINGS.contactEmail || "Email not set";
  const logoUrl = settings?.logoUrl;

  return (
    <footer className="border-t border-border/40 bg-background text-muted-foreground">
      <div className="container mx-auto px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-foreground">
               {logoUrl ? (
                <NextImage src={logoUrl} alt={`${siteName} Logo`} width={28} height={28} className="h-7 w-7 object-contain" />
              ) : (
                <Hexagon className="h-7 w-7 text-primary" />
              )}
              <span className="text-lg font-semibold">{siteName}</span>
            </Link>
            <p className="text-sm">
              Empowering your digital presence with innovative solutions.
            </p>
            <p className="text-xs">
              &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
          </div>

          <div className="md:col-start-2 lg:col-start-3">
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-start-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
