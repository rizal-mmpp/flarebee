
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { cookies } from 'next/headers';
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
    const errorMessage = errorData?.exception || errorData?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// Data transformation functions
function transformServiceData(service: Service) {
    return {
        // Assuming ERPNext doctype 'Service' has these fields
        service_name: service.title,
        slug: service.slug,
        short_description: service.shortDescription,
        long_description: service.longDescription,
        category: service.category.name,
        status: service.status,
        tags: service.tags.join(','),
        image_url: service.imageUrl,
        // Pricing would be complex and likely needs to be a child table in ERPNext
        // This is a simplified example.
        price: service.pricing?.fixedPriceDetails?.price ?? 0,
    };
}

function transformSitePageData(page: SitePage) {
    let content = '';
    // Check if it's a standard page with a 'content' property
    if ('content' in page) {
        content = page.content;
    } else if (page.id === 'public-about') {
        // For structured pages, we serialize the whole object to a field
        content = JSON.stringify(page, null, 2);
    }
    
    return {
        page_id: page.id,
        title: 'title' in page ? page.title : page.id,
        content: content,
    };
}

function transformOrderData(order: Order) {
    return {
        order_id: order.orderId,
        customer_email: order.userEmail,
        total_amount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        payment_gateway: order.paymentGateway,
        // Items would be a child table in ERPNext
        items_json: JSON.stringify(order.items), 
    };
}


export async function runMigrationAction(
  onProgress: (status: MigrationStatus) => void
): Promise<{ success: boolean; message: string }> {
    const cookieStore = cookies();
    const sid = cookieStore.get('sid')?.value;

    if (!sid) {
        return { success: false, message: 'ERPNext session not found. Please log in to ERPNext first.' };
    }

    // 'users' collection removed from migration
    const collectionsToMigrate = ['services', 'sitePages', 'orders']; 

    for (const collectionName of collectionsToMigrate) {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const totalDocs = querySnapshot.size;
            let migratedCount = 0;
            
            if (totalDocs === 0) {
                 onProgress({ collection: collectionName, success: true, count: 0, error: 'No documents to migrate.' });
                 continue;
            }

            for (const doc of querySnapshot.docs) {
                let dataToPost;
                const docData = { id: doc.id, ...doc.data() };
                const erpDoctype = collectionMappings[collectionName];
                
                // Choose the right transformation function
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
                    // For other collections, you might need a generic transformation or specific ones
                    default:
                        dataToPost = docData;
                        break;
                }

                await postToErpNext(erpDoctype, dataToPost, sid);
                migratedCount++;
            }
            onProgress({ collection: collectionName, success: true, count: migratedCount });
        } catch (error: any) {
            console.error(`Migration failed for collection: ${collectionName}`, error);
            onProgress({ collection: collectionName, success: false, count: 0, error: error.message });
            return { success: false, message: `Migration failed on collection '${collectionName}'. Please check logs.` };
        }
    }

    return { success: true, message: 'All selected collections have been processed.' };
}
