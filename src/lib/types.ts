
import type { User as FirebaseUser } from 'firebase/auth';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

// Retain Template type for existing public pages for now
export interface Template {
  id: string;
  title: string;
  title_lowercase?: string;
  description: string;
  longDescription?: string;
  category: Category;
  price: number;
  tags: string[];
  imageUrl: string;
  dataAiHint?: string;
  screenshots?: string[];
  previewUrl?: string;
  downloadZipUrl: string;
  githubUrl?: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

export interface JourneyStage {
  id: string; // e.g., 'discovery', 'service-landing-page'
  title: string; // e.g., 'Discovery', 'Service Landing Page' (this will be the label below the step number)
  details: string[]; // Predefined key elements for this stage
  placeholder?: string; // Placeholder for the notes textarea
}

export interface Service {
  id: string; // Firestore document ID
  title: string;
  title_lowercase?: string;
  shortDescription: string;
  longDescription: string; // Markdown
  category: ServiceCategory;
  pricingModel: "Fixed Price" | "Starting At" | "Hourly" | "Subscription" | "Custom Quote";
  priceMin?: number; // In IDR
  priceMax?: number; // In IDR
  currency: string; // e.g., "IDR"
  tags: string[];
  imageUrl: string; // Representative image for the service
  dataAiHint?: string;
  status: 'active' | 'inactive' | 'draft';
  keyFeatures?: string[]; // List of key features/benefits
  targetAudience?: string[]; // Who is this service for?
  estimatedDuration?: string; // e.g., "2-4 weeks", "Varies"
  portfolioLink?: string; // URL to relevant work/case studies
  customerJourneyStages?: JourneyStage[]; // Array of customer journey stages for this service
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}


export interface AuthUser extends FirebaseUser {
  role?: 'admin' | 'user';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'user';
  createdAt: Date;
  photoURL?: string | null;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface PurchasedTemplateItem {
  id: string;
  title: string;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  orderId: string;
  items: PurchasedTemplateItem[];
  totalAmount: number;
  currency: 'IDR';
  status: 'completed' | 'pending' | 'failed' | 'expired';
  paymentGateway: string;
  createdAt: string;
  updatedAt?: string;
  xenditInvoiceId?: string;
  xenditInvoiceUrl?: string;
  xenditExpiryDate?: string;
  xenditPaymentStatus?: string;
}

export type OrderInputData = Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: any;
  updatedAt?: any;
};

export interface FetchServicesParams { // Renamed from FetchTemplatesParams
  pageIndex?: number;
  pageSize?: number;
  sorting?: { id: string; desc: boolean }[];
  searchTerm?: string;
}

export interface FetchServicesResult { // Renamed from FetchTemplatesResult
  data: Service[];
  pageCount: number;
  totalItems: number;
}

// Standard Site Page (Markdown based)
export interface StandardSitePage {
  id: string;
  title: string;
  content: string; // Markdown content
  updatedAt?: string | null;
}

// Structured content for Public About Us Page
export interface PublicAboutPageServiceItem {
  id: string; // For React key e.g. service-web-dev
  icon: string; // Lucide icon name string e.g. "Code"
  name: string;
  description: string;
}

export interface PublicAboutPageSectionContent {
  title: string;
  text: string;
  imageUrl?: string | null;
  imageAiHint?: string;
}

export interface PublicAboutPageContent {
  id: 'public-about'; // Specific ID for this page type
  pageTitle: string; // For browser tab and H1
  
  heroSection: {
    tagline: string;
    subTagline?: string;
    imageUrl?: string | null;
    imageAiHint?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
  };

  historySection: PublicAboutPageSectionContent;

  founderSection: {
    name: string;
    title: string;
    bio: string;
    imageUrl?: string | null;
    imageAiHint?: string;
  };

  missionVisionSection?: {
    missionTitle?: string;
    missionText?: string;
    missionImageUrl?: string | null;
    missionImageAiHint?: string;
    visionTitle?: string;
    visionText?: string;
    visionImageUrl?: string | null;
    visionImageAiHint?: string;
  };

  servicesIntroSection?: { // Made optional
    title: string;
    introText: string;
  };
  
  servicesHighlights?: PublicAboutPageServiceItem[];

  teamSection?: { // Made optional
    title: string;
    introText?: string;
  };
  
  companyOverviewSection: PublicAboutPageSectionContent; 

  callToActionSection: {
    title: string;
    text: string;
    buttonText: string;
    buttonLink: string;
  };
  updatedAt?: string | null;
}

// Union type for SitePage
export type SitePage = StandardSitePage | PublicAboutPageContent;


export interface SiteSettings {
  id: 'main';
  siteTitle: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  themePrimaryColor: string;
  themeAccentColor: string;
  themeBackgroundColor: string;
  darkThemePrimaryColor: string;
  darkThemeAccentColor: string;
  darkThemeBackgroundColor: string;
  updatedAt?: string | null;
}

export interface FetchTemplatesParams {
  pageIndex?: number;
  pageSize?: number;
  sorting?: { id: string; desc: boolean }[];
  searchTerm?: string;
}

export interface FetchTemplatesResult {
  data: Template[];
  pageCount: number;
  totalItems: number;
}
