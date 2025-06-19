
import {
  collection,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  getCountFromServer,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  documentId, 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Service, FetchServicesParams, FetchServicesResult, ServiceCategory, JourneyStage } from '@/lib/types'; // Updated types
import { SERVICE_CATEGORIES } from '@/lib/constants'; // Updated constants

const SERVICES_COLLECTION = 'services'; // Renamed collection

const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  { id: 'discovery', title: 'Discovery', details: ["Touchpoints: Homepage → “Explore Our Services”, Services List → “Business Profile Website”, Paid Ads, Social Media, WhatsApp Campaigns", "Key Actions: Click service card → open dedicated service landing page"], placeholder: "Describe visual elements and user interactions for Discovery. What does the user see on the homepage? How is the service presented in lists/ads? What's the initial hook?" },
  { id: 'service-landing-page', title: 'Service Landing Page', details: ["Content: Hero: “Professional Website for Your Business – Launch in Days”, Value props (e.g., Free subdomain, SEO ready, CMS), Demo links / client success stories", "CTAs: “Start Now” (Primary), “Preview Demo”, “Chat First”"], placeholder: "Detail the layout of the service landing page. Visual hierarchy? CTA displays? Demo preview look? How are value props communicated visually?" },
  { id: 'smart-onboarding', title: 'Smart Onboarding', details: ["Inline, 3-step lightweight wizard: Business Name & Type, Domain options ('I have one', 'Search domain', 'Skip for now' → subdomain), Select preferred style/template (quick preview).", "All fields optional. 'Continue' active if at least 1 field filled."], placeholder: "Design the wizard steps. How are domain options presented? How does the style/template quick preview work visually? What's the feel of this onboarding?" },
  { id: 'sign-in-up', title: 'Sign In / Sign Up', details: ["Google OAuth & Email options.", "Progress from onboarding is saved in session/local storage and applied post-login."], placeholder: "Describe the sign-in/sign-up interface. How is the saved onboarding progress communicated or handled visually upon return?" },
  { id: 'dashboard-start-project', title: 'Dashboard: Start Project', details: ["Now in authenticated project dashboard.", "Auto-generated project draft based on onboarding.", "Show project steps: ✅ Business Info, ✅ Domain, 🟨 Template Selection (edit or keep), 🟧 Package Plan, 🟩 Custom Feature (optional)."], placeholder: "Visualize the initial project dashboard. How is the draft project presented? How are the project steps shown? How can users edit pre-filled info?" },
  { id: 'select-package-addons', title: 'Select Package & Add-ons', details: ["Show pricing tiers with visual comparison.", "Add-ons (CMS, Blog, WhatsApp button, Form, SEO setup, etc.).", "Upsell option for full custom dev."], placeholder: "Design the package selection interface. How are tiers and add-ons visually distinct? How is the upsell presented without being intrusive?" },
  { id: 'checkout', title: 'Checkout', details: ["Transparent breakdown: Subscription (monthly/annual), Add-on costs (if any).", "Payment options: card, VA, QRIS (Xendit).", "Post-payment CTA: “Go to Dashboard”."], placeholder: "Visualize the checkout page. How is the cost breakdown presented clearly? How are payment options displayed? What's the success confirmation look like?" },
  { id: 'project-status-tracker', title: 'Project Status Tracker', details: ["Post-checkout dashboard shows: Project timeline (Planning → Development → Review → Launch), Chat with Dev team, Upload brand assets, Edit business info, Domain integration status, 'Invite teammate' (if relevant)."], placeholder: "Design the project tracker. How is the timeline visualized? What does the chat interface look like? How are asset uploads and info editing handled?" },
  { id: 'launch-delivery', title: 'Launch & Delivery', details: ["Final site preview, DNS guide or auto-config, “Go Live” button.", "Confirmation Page: Success message, Analytics starter, CMS guide, Shareable link button."], placeholder: "Visualize the final launch steps. What does the 'Go Live' confirmation look like? How are guides and success messages presented?" },
  { id: 'post-launch-retention', title: 'Post-Launch & Retention', details: ["Regular performance emails: “Your site had 134 views this week”.", "Client dashboard includes: CMS editor, Traffic stats (Google Analytics embed), Support ticket/chat, Plan management & renewals, Easy upgrade CTA: “Need More Pages?”."], placeholder: "Design the post-launch dashboard elements. How are stats presented? What does the CMS editor access look like? How are upgrade CTAs integrated smoothly?" },
];


// Helper to convert Firestore doc to Service object
const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Service => {
  const data = docSnapshot.data();
  const category = SERVICE_CATEGORIES.find(c => c.id === data.categoryId) || SERVICE_CATEGORIES[0]; // Use SERVICE_CATEGORIES
  
  const customerJourneyStages = data.customerJourneyStages && Array.isArray(data.customerJourneyStages)
    ? data.customerJourneyStages
    : DEFAULT_JOURNEY_STAGES;

  return {
    id: docSnapshot.id,
    title: data.title,
    title_lowercase: data.title_lowercase || data.title?.toLowerCase() || '',
    shortDescription: data.shortDescription || '',
    longDescription: data.longDescription || '',
    category: category,
    pricingModel: data.pricingModel || 'Custom Quote',
    priceMin: data.priceMin, // May be undefined
    priceMax: data.priceMax, // May be undefined
    currency: data.currency || 'IDR',
    tags: data.tags || [],
    imageUrl: data.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: data.dataAiHint || '',
    status: data.status || 'draft',
    keyFeatures: data.keyFeatures || [],
    targetAudience: data.targetAudience || [],
    estimatedDuration: data.estimatedDuration || '',
    portfolioLink: data.portfolioLink || '',
    customerJourneyStages: customerJourneyStages, // Assign fetched or default stages
    createdAt: (data.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
  };
};

export async function getAllServicesFromFirestore({
  pageIndex = 0,
  pageSize = 10,
}: FetchServicesParams = {}): Promise<FetchServicesResult> { // Updated types
  try {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const dataQueryConstraints: QueryConstraint[] = [];
    
    dataQueryConstraints.push(orderBy('createdAt', 'desc'));
    dataQueryConstraints.push(orderBy(documentId(), 'asc'));

    const countQuery = query(servicesCollection);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalItems = countSnapshot.data().count;

    if (totalItems === 0) {
      return { data: [], pageCount: 0, totalItems: 0 };
    }

    const pageCount = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    if (pageSize > 0 && pageIndex > 0) {
      const docsToSkip = pageIndex * pageSize;
      const cursorDeterminingQueryConstraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        orderBy(documentId(), 'asc'),
        firestoreLimit(docsToSkip)
      ];
      
      const cursorSnapshot = await getDocs(query(servicesCollection, ...cursorDeterminingQueryConstraints));

      if (cursorSnapshot.docs.length === docsToSkip && cursorSnapshot.docs.length > 0) {
        const lastVisibleDoc = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
        dataQueryConstraints.push(firestoreStartAfter(lastVisibleDoc));
      } else if (cursorSnapshot.docs.length < docsToSkip) {
        return { data: [], pageCount, totalItems };
      }
    }

    const existingLimitIndex = dataQueryConstraints.findIndex(c => c.type === 'limit');
    if (existingLimitIndex !== -1) {
        dataQueryConstraints.splice(existingLimitIndex, 1);
    }
    if (pageSize > 0) {
        dataQueryConstraints.push(firestoreLimit(pageSize));
    }
    
    const finalDataQuery = query(servicesCollection, ...dataQueryConstraints);
    const dataSnapshot = await getDocs(finalDataQuery);
    const data = dataSnapshot.docs.map(doc => fromFirestore(doc));
    
    return { data, pageCount, totalItems };

  } catch (error: any) {
    console.error("Error getting all services from Firestore: ", error);
    if (error.code === 'failed-precondition') {
      console.error("Firestore 'failed-precondition'. Index missing? Expected: (createdAt DESC, __name__ ASC).");
      throw new Error(`Firestore query requires an index. Original error: ${error.message}`);
    }
    throw error;
  }
}

export async function getServiceByIdFromFirestore(id: string): Promise<Service | null> { // Updated type
  try {
    const docRef = doc(db, SERVICES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return fromFirestore(docSnap);
    } else {
      console.log("No such service document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting service by ID from Firestore: ", error);
    throw error;
  }
}

