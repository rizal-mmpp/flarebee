
import type { Category, SiteSettings } from './types';

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

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 'main',
  siteTitle: 'Ragam Inovasi Optima',
  logoUrl: null,
  faviconUrl: null,
  themePrimaryColor: '50 90% 55%', // Light Yellow
  themeAccentColor: '30 84% 51%',  // Light Orange
  themeBackgroundColor: '228 100% 98%', // Light Blue
  darkThemePrimaryColor: '50 90% 60%', // Dark Yellow (brighter for dark bg)
  darkThemeAccentColor: '30 84% 55%', // Dark Orange (brighter for dark bg)
  darkThemeBackgroundColor: '210 70% 18%', // Dark Blue
  updatedAt: null,
};

// MOCK_TEMPLATES and related functions are removed as data will now come from Firestore.
// Ensure pages using these are updated to fetch data from Firestore.
// e.g. getTemplateByIdFromFirestore, getAllTemplatesFromFirestore

