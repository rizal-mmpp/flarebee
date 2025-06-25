
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
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Service, FetchServicesParams, FetchServicesResult, JourneyStage, PricingDetails, ServicePackage, PackageFeature } from '@/lib/types'; 
import { SERVICE_CATEGORIES } from '@/lib/constants'; 

const SERVICES_COLLECTION = 'services'; 

const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  { 
    id: 'discovery', 
    title: 'Discovery', 
    details: "- Touchpoints: Homepage → “Explore Our Services”, Services List → “Business Profile Website”, Paid Ads, Social Media, WhatsApp Campaigns\n- Key Actions: Click service card → open dedicated service landing page", 
    placeholder: "Describe visual elements and user interactions for Discovery. What does the user see on the homepage? How is the service presented in lists/ads? What's the initial hook?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'service-landing-page', 
    title: 'Service Landing Page', 
    details: "- Content: Hero: “Professional Website for Your Business – Launch in Days”, Value props (e.g., Free subdomain, SEO ready, CMS), Demo links / client success stories\n- CTAs: “Start Now” (Primary), “Preview Demo”, “Chat First”", 
    placeholder: "Detail the layout of the service landing page. Visual hierarchy? CTA displays? Demo preview look? How are value props communicated visually?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'cart', 
    title: 'Cart', 
    details: "Halaman ini langsung ditampilkan di depan untuk memastikan keseriusan customer.\n\nNote:\n- Data ini disimpan di localStorage",
    placeholder: "Visualize the cart/selection page. It should confirm the user's choice (e.g., Business Website Builder, Annual Plan) and show a clear order summary. Include options to change billing duration and a prominent CTA to continue.",
    imageUrl: null,
    imageAiHint: "shopping cart summary",
  },
  { 
    id: 'sign-in-up', 
    title: 'Sign In / Sign Up', 
    details: "- Google OAuth & Email options.\n- Progress from onboarding is saved in session/local storage and applied post-login.", 
    placeholder: "Describe the sign-in/sign-up interface. How is the saved onboarding progress communicated or handled visually upon return?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'dashboard-start-project', 
    title: 'Dashboard: Start Project', 
    details: "- Now in authenticated project dashboard.\n- Auto-generated project draft based on onboarding.\n- Show project steps: ✅ Business Info, ✅ Domain, 🟨 Template Selection (edit or keep), 🟧 Package Plan, 🟩 Custom Feature (optional).", 
    placeholder: "Visualize the initial project dashboard. How is the draft project presented? How are the project steps shown? How can users edit pre-filled info?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'select-package-addons', 
    title: 'Select Package & Add-ons', 
    details: "- Show pricing tiers with visual comparison.\n- Add-ons (CMS, Blog, WhatsApp button, Form, SEO setup, etc.).\n- Upsell option for full custom dev.", 
    placeholder: "Design the package selection interface. How are tiers and add-ons visually distinct? How is the upsell presented without being intrusive?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'checkout', 
    title: 'Checkout', 
    details: "- Transparent breakdown: Subscription (monthly/annual), Add-on costs (if any).\n- Payment options: card, VA, QRIS (Xendit).\n- Post-payment CTA: “Go to Dashboard”.", 
    placeholder: "Visualize the checkout page. How is the cost breakdown presented clearly? How are payment options displayed? What's the success confirmation look like?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'project-status-tracker', 
    title: 'Project Status Tracker', 
    details: "- Post-checkout dashboard shows: Project timeline (Planning → Development → Review → Launch), Chat with Dev team, Upload brand assets, Edit business info, Domain integration status, 'Invite teammate' (if relevant).", 
    placeholder: "Design the project tracker. How is the timeline visualized? What does the chat interface look like? How are asset uploads and info editing handled?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'launch-delivery', 
    title: 'Launch & Delivery', 
    details: "- Final site preview, DNS guide or auto-config, “Go Live” button.\n- Confirmation Page: Success message, Analytics starter, CMS guide, Shareable link button.", 
    placeholder: "Visualize the final launch steps. What does the 'Go Live' confirmation look like? How are guides and success messages presented?",
    imageUrl: null,
    imageAiHint: null,
  },
  { 
    id: 'post-launch-retention', 
    title: 'Post-Launch & Retention', 
    details: "- Regular performance emails: “Your site had 134 views this week”.\n- Client dashboard includes: CMS editor, Traffic stats (Google Analytics embed), Support ticket/chat, Plan management & renewals, Easy upgrade CTA: “Need More Pages?”.", 
    placeholder: "Design the post-launch dashboard elements. How are stats presented? What does the CMS editor access look like? How are upgrade CTAs integrated smoothly?",
    imageUrl: null,
    imageAiHint: null,
  },
];


// Helper to convert Firestore doc to Service object
const fromFirestore = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Service => {
  const data = docSnapshot.data();
  const category = SERVICE_CATEGORIES.find(c => c.id === data.categoryId) || SERVICE_CATEGORIES[0]; 
  
  let customerJourneyStages: JourneyStage[] = DEFAULT_JOURNEY_STAGES; 
  if (data.customerJourneyStages && Array.isArray(data.customerJourneyStages) && data.customerJourneyStages.length > 0) {
    customerJourneyStages = data.customerJourneyStages.map((stage: any) => ({
      id: stage.id || `stage-${Math.random().toString(36).substring(2, 8)}`,
      title: stage.title || 'Untitled Stage',
      details: Array.isArray(stage.details) ? stage.details.join('\n- ') : (stage.details || ''),
      placeholder: stage.placeholder || '',
      imageUrl: stage.imageUrl || null,
      imageAiHint: stage.imageAiHint || null,
    }));
  } else {
    customerJourneyStages = DEFAULT_JOURNEY_STAGES.map(stage => ({...stage}));
  }

  // Safely build the pricing object, providing defaults for each model
  const pricingData: PricingDetails = {
    isFixedPriceActive: data.pricing?.isFixedPriceActive ?? false,
    fixedPriceDetails: data.pricing?.fixedPriceDetails ?? { price: 0, bgClassName: 'bg-background' },
    isSubscriptionActive: data.pricing?.isSubscriptionActive ?? false,
    subscriptionDetails: data.pricing?.subscriptionDetails ?? { packages: [], bgClassName: 'bg-card' },
    isCustomQuoteActive: data.pricing?.isCustomQuoteActive ?? false,
    customQuoteDetails: data.pricing?.customQuoteDetails ?? { description: '', bgClassName: 'bg-background' }
  };
  
  // Ensure subscription packages have all required fields, providing defaults where necessary
  if (pricingData.isSubscriptionActive && pricingData.subscriptionDetails) {
    pricingData.subscriptionDetails.packages = pricingData.subscriptionDetails.packages.map((pkg: any): ServicePackage => ({
      id: pkg.id || `pkg-${Math.random().toString(36).substring(2, 8)}`,
      name: pkg.name || 'Unnamed Package',
      description: pkg.description || '',
      priceMonthly: pkg.priceMonthly || 0,
      originalPriceMonthly: pkg.originalPriceMonthly,
      annualPriceCalcMethod: pkg.annualPriceCalcMethod || 'percentage',
      annualDiscountPercentage: pkg.annualDiscountPercentage || 0,
      discountedMonthlyPrice: pkg.discountedMonthlyPrice || 0,
      renewalInfo: pkg.renewalInfo || '',
      features: (pkg.features || []).map((feat: any): PackageFeature => ({
        id: feat.id || `feat-${Math.random().toString(36).substring(2, 8)}`,
        text: feat.text || '',
        isIncluded: feat.isIncluded !== undefined ? feat.isIncluded : true,
      })),
      isPopular: pkg.isPopular || false,
      cta: pkg.cta || 'Choose Plan',
    }));
  }


  return {
    id: docSnapshot.id,
    slug: data.slug || '',
    title: data.title,
    title_lowercase: data.title_lowercase || data.title?.toLowerCase() || '',
    shortDescription: data.shortDescription || '',
    longDescription: data.longDescription || '',
    category: category,
    pricing: pricingData,
    tags: data.tags || [],
    imageUrl: data.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: data.dataAiHint || '',
    status: data.status || 'draft',
    keyFeatures: data.keyFeatures || [],
    targetAudience: data.targetAudience || [],
    estimatedDuration: data.estimatedDuration || '',
    portfolioLink: data.portfolioLink || '',
    showFaqSection: data.showFaqSection || false,
    faq: data.faq || [],
    customerJourneyStages: customerJourneyStages,
    createdAt: (data.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate()?.toISOString(),
  };
};

export async function getAllServicesFromFirestore({
  pageIndex = 0,
  pageSize = 10,
}: FetchServicesParams = {}): Promise<FetchServicesResult> { 
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

export async function getServiceByIdFromFirestore(id: string): Promise<Service | null> { 
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

export async function getServiceBySlugFromFirestore(slug: string): Promise<Service | null> {
  try {
    const q = query(
      collection(db, SERVICES_COLLECTION),
      where('slug', '==', slug),
      firestoreLimit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return fromFirestore(querySnapshot.docs[0]);
    } else {
      console.log(`No such service document with slug: ${slug}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting service by slug ${slug} from Firestore: `, error);
    throw error;
  }
}
