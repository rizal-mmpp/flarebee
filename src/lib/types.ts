import type { User as FirebaseUser } from 'firebase/auth';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

// Retain Template type for existing public pages until they are refactored
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
  id: string; 
  title: string; 
  details: string; 
  placeholder?: string; 
  imageUrl?: string | null; 
  imageAiHint?: string | null;
}

export interface Service {
  id: string; 
  title: string;
  title_lowercase?: string;
  shortDescription: string;
  longDescription: string; 
  category: ServiceCategory;
  pricingModel: "Fixed Price" | "Starting At" | "Hourly" | "Subscription" | "Custom Quote";
  priceMin?: number; 
  priceMax?: number; 
  currency: string; 
  tags: string[];
  imageUrl: string; 
  dataAiHint?: string;
  status: 'active' | 'inactive' | 'draft';
  keyFeatures?: string[]; 
  targetAudience?: string[]; 
  estimatedDuration?: string; 
  portfolioLink?: string; 
  customerJourneyStages?: JourneyStage[]; 
  createdAt: string; 
  updatedAt?: string; 
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

export interface FetchServicesParams { 
  pageIndex?: number;
  pageSize?: number;
  sorting?: { id: string; desc: boolean }[];
  searchTerm?: string;
}

export interface FetchServicesResult { 
  data: Service[];
  pageCount: number;
  totalItems: number;
}

// Standard Site Page (Markdown based)
export interface StandardSitePage {
  id: string;
  title: string;
  content: string; 
  updatedAt?: string | null;
}

// Structured content for Public About Us Page
export interface PublicAboutPageServiceItem {
  id: string; 
  icon: string; 
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
  id: 'public-about'; 
  pageTitle: string; 
  
  heroSection: {
    tagline: string;
    subTagline?: string;
    imageUrl?: string | null;
    imageAiHint?: string;
    imageFile?: File | null; // For admin form
    ctaButtonText?: string;
    ctaButtonLink?: string;
  };

  showHistorySection?: boolean;
  historySection: PublicAboutPageSectionContent & { imageFile?: File | null; };

  showFounderSection?: boolean;
  founderSection: {
    name: string;
    title: string;
    bio: string;
    imageUrl?: string | null;
    imageAiHint?: string;
    imageFile?: File | null; // For admin form
  };

  showMissionVisionSection?: boolean;
  missionVisionSection?: {
    missionTitle?: string;
    missionText?: string;
    visionTitle?: string;
    visionText?: string;
  };

  showServicesIntroSection?: boolean;
  servicesIntroSection?: { 
    title: string;
    introText: string;
  };
  
  servicesHighlights?: PublicAboutPageServiceItem[];

  showCompanyOverviewSection?: boolean;
  companyOverviewSection: PublicAboutPageSectionContent & { imageFile?: File | null; };

  showCallToActionSection?: boolean;
  callToActionSection: {
    title: string;
    text: string;
    buttonText: string;
    buttonLink: string;
  };
  updatedAt?: string | null;
}

export interface ContactPageContent {
  id: 'contact-us';
  imageUrl?: string | null;
  updatedAt?: string | null;
}

// Union type for SitePage
export type SitePage = StandardSitePage | PublicAboutPageContent | ContactPageContent;

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
  contactPageImageUrl?: string | null;
  contactAddress?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
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

export interface ContactFormValues {
  name: string;
  businessName?: string;
  email: string;
  phone?: string;
  message: string;
}
