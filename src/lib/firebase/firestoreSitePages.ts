
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { SitePage, StandardSitePage, PublicAboutPageContent, PublicAboutPageServiceItem } from '@/lib/types';

const SITE_PAGES_COLLECTION = 'sitePages';

const DEFAULT_PUBLIC_ABOUT_CONTENT: PublicAboutPageContent = {
  id: 'public-about',
  pageTitle: 'About Ragam Inovasi Optima',
  heroSection: {
    tagline: 'Turning Technology Into Your Superpower.',
    subTagline: 'We craft innovative digital solutions to elevate your business and ideas.',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageAiHint: 'modern technology abstract',
    ctaButtonText: 'Explore Our Services',
    ctaButtonLink: '/',
  },
  showHistorySection: true,
  historySection: {
    title: 'Our Journey & Commitment',
    text: 'Ragam Inovasi Optima was founded with a vision to make cutting-edge technology accessible and impactful. Officially registered with Ditjen AHU (Direktorat Jenderal Administrasi Hukum Umum) in 2025, we are committed to transparency, innovation, and delivering excellence in every project. Our journey is one of continuous learning and adaptation, ensuring we bring the best solutions to our clients.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'timeline graph growth',
  },
  showFounderSection: true,
  founderSection: {
    name: 'Rizal Iswandy',
    title: 'Founder & Lead Innovator',
    bio: 'Rizal is a passionate technologist and problem-solver with a drive to empower businesses through smart digital solutions. With a background in full-stack development and AI, he leads Ragam Inovasi Optima with a focus on client success and sustainable innovation.',
    imageUrl: 'https://placehold.co/400x400.png',
    imageAiHint: 'professional portrait man',
  },
  showMissionVisionSection: true,
  missionVisionSection: {
    missionTitle: 'Our Mission',
    missionText: 'To provide innovative, high-quality digital services and solutions that drive growth, efficiency, and competitive advantage for our clients.',
    visionTitle: 'Our Vision',
    visionText: 'To be a leading digital transformation partner, recognized for our expertise, creativity, and commitment to client success in an ever-evolving technological landscape.',
  },
  showServicesIntroSection: true,
  servicesIntroSection: {
    title: 'What We Do Best',
    introText: 'We offer a range of services designed to meet your unique digital needs, from building powerful web applications to implementing intelligent automation.',
  },
  servicesHighlights: [
    { id: 'web', icon: 'Globe', name: 'Website Development', description: 'Crafting beautiful, responsive, and high-performing websites tailored to your brand.' },
    { id: 'automation', icon: 'Zap', name: 'AI & Automation', description: 'Leveraging AI to streamline processes, enhance customer experiences, and unlock new efficiencies.' },
    { id: 'custom', icon: 'Layers', name: 'Custom Software Solutions', description: 'Building bespoke software applications to solve unique business challenges.' },
  ],
  showCompanyOverviewSection: true,
  companyOverviewSection: {
    title: 'Why Choose Ragam Inovasi Optima?',
    text: "At Ragam Inovasi Optima, we believe in partnership. We work closely with you to understand your goals and challenges, ensuring the solutions we deliver are not just technologically sound but also strategically aligned with your business objectives. Our commitment to quality, innovation, and customer satisfaction sets us apart. We are more than just a service provider; we are your dedicated partner in digital excellence.",
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'business handshake team',
  },
  showCallToActionSection: true,
  callToActionSection: {
    title: "Ready to Elevate Your Digital Presence?",
    text: "Let's discuss how Ragam Inovasi Optima can help you achieve your business goals with innovative technology solutions.",
    buttonText: "Get In Touch",
    buttonLink: "/contact", 
  },
  updatedAt: new Date().toISOString(),
};


export async function getSitePageContent(pageId: string): Promise<SitePage | null> {
  try {
    const pageRef = doc(db, SITE_PAGES_COLLECTION, pageId);
    const pageSnap = await getDoc(pageRef);

    if (pageSnap.exists()) {
      const data = pageSnap.data();
      const updatedAt = (data.updatedAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString();

      if (pageId === 'public-about') {
        const contentFromDb = data as Partial<PublicAboutPageContent>;
        
        const mergedContent: PublicAboutPageContent = {
          id: 'public-about',
          pageTitle: contentFromDb.pageTitle ?? DEFAULT_PUBLIC_ABOUT_CONTENT.pageTitle,
          heroSection: { 
            ...DEFAULT_PUBLIC_ABOUT_CONTENT.heroSection, 
            ...(contentFromDb.heroSection || {}) 
          },
          showHistorySection: contentFromDb.showHistorySection !== undefined ? contentFromDb.showHistorySection : DEFAULT_PUBLIC_ABOUT_CONTENT.showHistorySection,
          historySection: { 
            ...DEFAULT_PUBLIC_ABOUT_CONTENT.historySection, 
            ...(contentFromDb.historySection || {}) 
          },
          showFounderSection: contentFromDb.showFounderSection !== undefined ? contentFromDb.showFounderSection : DEFAULT_PUBLIC_ABOUT_CONTENT.showFounderSection,
          founderSection: { 
            ...DEFAULT_PUBLIC_ABOUT_CONTENT.founderSection, 
            ...(contentFromDb.founderSection || {}) 
          },
          showMissionVisionSection: contentFromDb.showMissionVisionSection !== undefined ? contentFromDb.showMissionVisionSection : DEFAULT_PUBLIC_ABOUT_CONTENT.showMissionVisionSection,
          missionVisionSection: contentFromDb.missionVisionSection 
            ? { 
                ...DEFAULT_PUBLIC_ABOUT_CONTENT.missionVisionSection,
                ...(contentFromDb.missionVisionSection || {})
              } 
            : DEFAULT_PUBLIC_ABOUT_CONTENT.missionVisionSection,
          showServicesIntroSection: contentFromDb.showServicesIntroSection !== undefined ? contentFromDb.showServicesIntroSection : DEFAULT_PUBLIC_ABOUT_CONTENT.showServicesIntroSection,
          servicesIntroSection: contentFromDb.servicesIntroSection
            ? {
                ...DEFAULT_PUBLIC_ABOUT_CONTENT.servicesIntroSection,
                ...(contentFromDb.servicesIntroSection || {})
              }
            : DEFAULT_PUBLIC_ABOUT_CONTENT.servicesIntroSection,
          servicesHighlights: contentFromDb.servicesHighlights && contentFromDb.servicesHighlights.length > 0 
            ? contentFromDb.servicesHighlights 
            : DEFAULT_PUBLIC_ABOUT_CONTENT.servicesHighlights,
          showCompanyOverviewSection: contentFromDb.showCompanyOverviewSection !== undefined ? contentFromDb.showCompanyOverviewSection : DEFAULT_PUBLIC_ABOUT_CONTENT.showCompanyOverviewSection,
          companyOverviewSection: { 
            ...DEFAULT_PUBLIC_ABOUT_CONTENT.companyOverviewSection, 
            ...(contentFromDb.companyOverviewSection || {}) 
          },
          showCallToActionSection: contentFromDb.showCallToActionSection !== undefined ? contentFromDb.showCallToActionSection : DEFAULT_PUBLIC_ABOUT_CONTENT.showCallToActionSection,
          callToActionSection: { 
            ...DEFAULT_PUBLIC_ABOUT_CONTENT.callToActionSection, 
            ...(contentFromDb.callToActionSection || {}) 
          },
          updatedAt: updatedAt,
        };
        return mergedContent;
      } else {
        // Standard markdown page
        return {
          id: pageSnap.id,
          title: data.title || '',
          content: data.content || '',
          updatedAt: updatedAt,
        } as StandardSitePage;
      }
    }

    // If page doesn't exist, return default structure based on pageId
    if (pageId === 'public-about') {
      return { ...DEFAULT_PUBLIC_ABOUT_CONTENT, updatedAt: new Date().toISOString() };
    } else {
      // Default for new standard markdown pages
      return { id: pageId, title: 'New Page', content: `# ${pageId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\nEnter content here.`, updatedAt: new Date().toISOString() };
    }

  } catch (error) {
    console.error(`Error getting site page content for ${pageId}:`, error);
    if (pageId === 'public-about') {
      return { ...DEFAULT_PUBLIC_ABOUT_CONTENT, updatedAt: new Date().toISOString(), pageTitle: 'Error Loading About Page' };
    }
    return { id: pageId, title: 'Error Loading Page', content: 'Could not load content.', updatedAt: new Date().toISOString() };
  }
}

// Overloaded function signature for saving
export async function saveSitePageContent(pageId: 'public-about', data: PublicAboutPageContent): Promise<void>;
export async function saveSitePageContent(pageId: string, title: string, content: string): Promise<void>; // Existing signature for markdown pages

export async function saveSitePageContent(
  pageId: string,
  titleOrData: string | PublicAboutPageContent,
  content?: string
): Promise<void> {
  try {
    const pageRef = doc(db, SITE_PAGES_COLLECTION, pageId);
    let dataToSave: any;

    if (pageId === 'public-about' && typeof titleOrData === 'object') {
      const { id, ...saveableData } = titleOrData as PublicAboutPageContent;
      dataToSave = {
        ...saveableData, 
        updatedAt: serverTimestamp(),
      };
    } else if (typeof titleOrData === 'string' && typeof content === 'string') {
      dataToSave = {
        title: titleOrData,
        content: content,
        updatedAt: serverTimestamp(),
      };
    } else {
      throw new Error('Invalid arguments for saveSitePageContent');
    }

    await setDoc(pageRef, dataToSave, { merge: true });
  } catch (error) {
    console.error(`Error saving site page content for ${pageId}:`, error);
    throw error; 
  }
}
