
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { SitePage, SiteSettings, UserProfile, Service, Order } from '../types';

export interface MigrationStatus {
  collection: string;
  success: boolean;
  count: number;
  error?: string;
}

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

const collectionMappings: { [key: string]: string } = {
  users: 'User',
  services: 'Service',
  sitePages: 'Site Page',
  siteSettings: 'Site Settings',
  orders: 'Orders',
  userCarts: 'User Cart',
};

async function postToErpNext(doctype: string, data: any, sid: string) {
  if (!ERPNEXT_API_URL) {
    throw new Error('ERPNext API URL is not configured.');
  }

  const response = await fetch(`${ERPNEXT_API_URL}/api/resource/${doctype}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': `sid=${sid}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`ERPNext API Error for ${doctype}:`, errorData);
    const errorMessage = errorData?._server_messages || errorData?.exception || errorData?.message || `HTTP error! status: ${response.status}`;
    // Handle the case where _server_messages is an array of stringified JSON
    if (Array.isArray(errorMessage)) {
        try {
            const parsedMessage = JSON.parse(errorMessage[0]);
            throw new Error(parsedMessage.message || "Unknown ERPNext Error");
        } catch (e) {
             throw new Error(errorMessage.join(', ') || `HTTP error! status: ${response.status}`);
        }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Data transformation functions
function transformServiceData(service: Service) {
    return {
        module: "ERPNext Integrations",
        service_name: service.title,
        slug: service.slug,
        short_description: service.shortDescription,
        long_description: service.longDescription,
        category: service.category?.name || '',
        status: service.status,
        tags: service.tags?.join(',') || '',
        image_url: service.imageUrl,
        price: service.pricing?.fixedPriceDetails?.price ?? 0,
    };
}

function transformSitePageData(page: SitePage) {
    let content = '';
    if ('content' in page) {
        content = page.content;
    } else if (page.id === 'public-about') {
        content = JSON.stringify(page, null, 2);
    }
    
    return {
        module: "ERPNext Integrations",
        page_id: page.id,
        title: 'title' in page ? page.title : page.id,
        content: content,
    };
}

function transformOrderData(order: Order) {
    return {
        module: "ERPNext Integrations",
        order_id: order.orderId,
        customer_email: order.userEmail,
        total_amount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        payment_gateway: order.paymentGateway,
        items_json: JSON.stringify(order.items), 
    };
}


export async function runMigrationAction(
  sid: string
): Promise<{ success: boolean; message: string; statuses: MigrationStatus[] }> {
  if (!sid) {
    return {
      success: false,
      message: 'ERPNext session not found. Please log in to ERPNext first.',
      statuses: [],
    };
  }
  const statuses: MigrationStatus[] = [];

  const collectionsToMigrate = ['services', 'sitePages', 'orders'];

  for (const collectionName of collectionsToMigrate) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const totalDocs = querySnapshot.size;
      let migratedCount = 0;

      if (totalDocs === 0) {
        statuses.push({
          collection: collectionName,
          success: true,
          count: 0,
          error: 'No documents to migrate.',
        });
        continue;
      }

      for (const doc of querySnapshot.docs) {
        let dataToPost;
        const docData = { id: doc.id, ...doc.data() };
        const erpDoctype = collectionMappings[collectionName];

        switch (collectionName) {
          case 'services':
            dataToPost = transformServiceData(docData as unknown as Service);
            break;
          case 'sitePages':
            dataToPost = transformSitePageData(docData as unknown as SitePage);
            break;
          case 'orders':
            dataToPost = transformOrderData(docData as unknown as Order);
            break;
          default:
            dataToPost = { ...docData };
            break;
        }

        await postToErpNext(erpDoctype, dataToPost, sid);
        migratedCount++;
      }
      statuses.push({
        collection: collectionName,
        success: true,
        count: migratedCount,
      });
    } catch (error: any) {
      console.error(`Migration failed for collection: ${collectionName}`, error);
      statuses.push({
        collection: collectionName,
        success: false,
        count: 0,
        error: error.message,
      });
      return {
        success: false,
        message: `Migration failed on collection '${collectionName}'. Please check logs.`,
        statuses: statuses,
      };
    }
  }

  return {
    success: true,
    message: 'All selected collections have been processed.',
    statuses: statuses,
  };
}
