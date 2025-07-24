
import type { Category, ServiceCategory, SiteSettings, SubscriptionPlan } from './types';

// Retain for public pages until they are refactored
export const CATEGORIES: Category[] = [
  { id: '1', name: 'Dashboards', slug: 'dashboards' },
  { id: '2', name: 'E-commerce', slug: 'ecommerce' },
  { id: '3', name: 'POS', slug: 'pos' },
  { id: '4', name: 'Portfolio', slug: 'portfolio' },
  { id: '5', name: 'Landing Pages', slug: 'landing-pages' },
  { id: '6', name: 'SaaS', slug: 'saas' },
  { id: '7', name: 'Utility', slug: 'utility' },
  { id: '8', name: 'AI Powered', slug: 'ai-powered' },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'webdev', name: 'Website Development', slug: 'website-development' },
  { id: 'ai-automation', name: 'AI & Automation', slug: 'ai-automation' },
  { id: 'consulting', name: 'Consulting Services', slug: 'consulting-services' },
  { id: 'custom-software', name: 'Custom Software', slug: 'custom-software' },
  { id: 'other', name: 'Other Services', slug: 'other-services' },
];

export const SERVICE_STATUSES = [
  "active",
  "inactive",
  "draft",
] as const;


export const DEFAULT_SETTINGS: SiteSettings = {
  id: 'main',
  siteTitle: 'Ragam Inovasi Optima',
  logoUrl: '/img/logo.png',
  faviconUrl: '/img/favicon.ico',
  themePrimaryColor: '50 90% 55%', 
  themeAccentColor: '30 84% 51%',  
  themeBackgroundColor: '228 100% 98%', 
  darkThemePrimaryColor: '50 90% 60%', 
  darkThemeAccentColor: '30 84% 55%', 
  darkThemeBackgroundColor: '210 70% 18%',
  contactPageImageUrl: null,
  contactAddress: "Dusun Bonto Bunga, Kec. Moncongloe, Kab. Maros, Sul-Sel Indonesia",
  contactPhone: "+62 822 3399 9510",
  contactEmail: "r124ltech@gmail.com",
  updatedAt: null,
};

// Default Subscription Plans to be seeded into ERPNext
export const DEFAULT_SUBSCRIPTION_PLANS: Omit<SubscriptionPlan, 'name'>[] = [
  {
    plan_name: 'Free',
    item: 'web-builder', // Assuming this is an Item name in ERPNext
    cost: 0,
    currency: 'IDR',
    billing_interval: 'Month',
    billing_interval_count: 1,
  },
  {
    plan_name: 'Personal',
    item: 'web-builder',
    cost: 150000,
    currency: 'IDR',
    billing_interval: 'Month',
    billing_interval_count: 1,
  },
  {
    plan_name: 'Pro',
    item: 'web-builder',
    cost: 400000,
    currency: 'IDR',
    billing_interval: 'Month',
    billing_interval_count: 1,
  },
];
