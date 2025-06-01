
import type { User as FirebaseUser } from 'firebase/auth';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Template {
  id: string; // Firestore document ID
  title: string;
  description: string;
  longDescription?: string;
  category: Category; 
  price: number;
  tags: string[];
  imageUrl: string; // Main preview image
  dataAiHint?: string;
  screenshots?: string[]; // URLs of additional screenshots
  previewUrl?: string; // Link to live preview
  downloadUrl?: string; 
  techStack?: string[];
  files?: { 
    zipUrl?: string;
    readmeUrl?: string;
  };
  createdAt: string; // ISO date string (from Firestore Timestamp)
  updatedAt?: string; // ISO date string (from Firestore Timestamp)
  author?: string; // Optional author name / UID
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
  createdAt: Date; // Stored as Firestore Timestamp, converted to Date on client
  photoURL?: string | null;
}

export interface CartItem {
  id: string; // template.id
  title: string;
  price: number;
  imageUrl: string;
  quantity: number; // Will typically be 1 for templates
}
