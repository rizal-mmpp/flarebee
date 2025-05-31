
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
  category: Category; // Consider storing categoryId and fetching/joining, or denormalize. For simplicity, denormalizing.
  price: number;
  tags: string[];
  imageUrl: string; // Main preview image
  dataAiHint?: string;
  screenshots?: string[]; // URLs of additional screenshots
  previewUrl?: string; // Link to live preview
  downloadUrl?: string; // This would be provided after purchase - managed elsewhere
  techStack?: string[];
  files?: { // Placeholder for actual template files, e.g., stored in Firebase Storage
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
