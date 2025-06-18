
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Explicitly check for essential Firebase config variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  console.error(
    "CRITICAL FIREBASE CONFIGURATION ERROR:\n" +
    "One or more NEXT_PUBLIC_FIREBASE_* environment variables are missing.\n" +
    "Please ensure all of the following are set in your .env file (for local development) or in your hosting provider's environment settings:\n" +
    "- NEXT_PUBLIC_FIREBASE_API_KEY\n" +
    "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
    "- NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
    "- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n" +
    "- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n" +
    "- NEXT_PUBLIC_FIREBASE_APP_ID\n" +
    "Potentially missing: " +
    (!apiKey ? "API_KEY " : "") +
    (!authDomain ? "AUTH_DOMAIN " : "") +
    (!projectId ? "PROJECT_ID " : "") +
    (!storageBucket ? "STORAGE_BUCKET " : "") +
    (!messagingSenderId ? "MESSAGING_SENDER_ID " : "") +
    (!appId ? "APP_ID " : "")
  );
  // Optionally, you could throw an error here to halt execution if preferred,
  // but Firebase itself will likely throw if critical config is missing.
  // This console error aims to make it more obvious during development.
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
