
import type { Category } from './types';

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

// MOCK_TEMPLATES and related functions are removed as data will now come from Firestore.
// Ensure pages using these are updated to fetch data from Firestore.
// e.g. getTemplateByIdFromFirestore, getAllTemplatesFromFirestore

