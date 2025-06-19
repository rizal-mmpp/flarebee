
import Link from 'next/link';
import { Hexagon, MapPin, Phone, Mail } from 'lucide-react'; // Added icons

export function Footer() {
  const siteName = "Ragam Inovasi Optima"; // Or fetch from settings if available
  const address = "Dusun Bonto Bunga, Kec. Moncongloe, Kab. Maros, Sul-Sel Indonesia";
  const phone = "+62 822 3399 9510";
  const email = "r124ltech@gmail.com";

  return (
    <footer className="border-t border-border/40 bg-background text-muted-foreground">
      <div className="container mx-auto px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Copyright */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <Hexagon className="h-7 w-7 text-primary" />
              <span className="text-lg font-semibold">{siteName}</span>
            </Link>
            <p className="text-sm">
              Empowering your digital presence with innovative solutions.
            </p>
            <p className="text-xs">
              &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
          </div>

          {/* Column 2: Legal Links */}
          <div className="md:col-start-2 lg:col-start-3"> {/* Adjusted for potential 4th col */}
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

          {/* Column 3: Contact Info */}
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
