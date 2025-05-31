
import type { User as FirebaseUser } from 'firebase/auth';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: Category;
  price: number;
  tags: string[];
  imageUrl: string;
  dataAiHint?: string;
  screenshots?: string[];
  previewUrl?: string;
  downloadUrl?: string; // This would be provided after purchase
  techStack?: string[];
  files?: {
    zipUrl?: string;
    readmeUrl?: string;
  };
  createdAt: string; // ISO date string
  author?: string; // Optional author name
}

// Firebase related types
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
