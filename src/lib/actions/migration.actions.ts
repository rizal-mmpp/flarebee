
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { SitePage, Service, Order } from '../types';

export interface MigrationStatus {
  collection: string;
  success: boolean;
  count: number;
  error?: string;
}

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;
const MODULE_NAME = 'ERPNext Integrations';

const collectionMappings: { [key: string]: string } = {
  services: `Service`,
  sitePages: `Site Page`,
  orders: `Orders`,
};

// --- Doctype Definitions ---
const doctypeSchemas: { [key: string]: any } = {
  [collectionMappings.services]: {
    doctype: 'DocType',
    name: collectionMappings.services,
    module: MODULE_NAME,
    custom: 1,
    fields: [
      { fieldname: 'service_name', fieldtype: 'Data', label: 'Service Name' },
      { fieldname: 'slug', fieldtype: 'Data', label: 'Slug', unique: 1 },
      { fieldname: 'short_description', fieldtype: 'Small Text', label: 'Short Description' },
      { fieldname: 'long_description', fieldtype: 'Text Editor', label: 'Long Description' },
      { fieldname: 'category', fieldtype: 'Data', label: 'Category' },
      { fieldname: 'status', fieldtype: 'Select', label: 'Status', options: 'active\ninactive\ndraft' },
      { fieldname: 'tags', fieldtype: 'Data', label: 'Tags' },
      { fieldname: 'image_url', fieldtype: 'Data', label: 'Image URL' },
      { fieldname: 'price', fieldtype: 'Currency', label: 'Price' },
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
    issingle: 0,
    istable: 0,
    title_field: 'service_name',
  },
  [collectionMappings.sitePages]: {
    doctype: 'DocType',
    name: collectionMappings.sitePages,
    module: MODULE_NAME,
    custom: 1,
    fields: [
      { fieldname: 'page_id', fieldtype: 'Data', label: 'Page ID', unique: 1 },
      { fieldname: 'title', fieldtype: 'Data', label: 'Title' },
      { fieldname: 'content', fieldtype: 'Text Editor', label: 'Content' },
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
    issingle: 0,
    istable: 0,
    title_field: 'title',
  },
  [collectionMappings.orders]: {
    doctype: 'DocType',
    name: collectionMappings.orders,
    module: MODULE_NAME,
    custom: 1,
    fields: [
      { fieldname: 'order_id', fieldtype: 'Data', label: 'Order ID', unique: 1 },
      { fieldname: 'customer_email', fieldtype: 'Data', label: 'Customer Email' },
      { fieldname: 'total_amount', fieldtype: 'Currency', label: 'Total Amount' },
      { fieldname: 'currency', fieldtype: 'Data', label: 'Currency' },
      { fieldname: 'status', fieldtype: 'Data', label: 'Status' },
      { fieldname: 'payment_gateway', fieldtype: 'Data', label: 'Payment Gateway' },
      { fieldname: 'items_json', fieldtype: 'Code', label: 'Items JSON' },
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
    issingle: 0,
    istable: 0,
    title_field: 'order_id',
  },
};


async function postToDoctype(data: any, sid: string) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
  
  const response = await fetch(`${ERPNEXT_API_URL}/api/resource/DocType`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`ERPNext DocType Creation Error:`, errorData);
    throw new Error(errorData._server_messages || `Failed to create DocType: ${response.statusText}`);
  }
  return response.json();
}

async function checkAndCreateDoctype(doctypeName: string, sid: string) {
    if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
    
    // 1. Check if DocType exists
    const checkResponse = await fetch(`${ERPNEXT_API_URL}/api/resource/DocType/${doctypeName}`, {
        headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` }
    });

    if (checkResponse.ok) {
        console.log(`Doctype '${doctypeName}' already exists. Skipping creation.`);
        return; // Doctype exists, do nothing
    }

    if (checkResponse.status === 404) {
        // 2. Doctype does not exist, so create it
        console.log(`Doctype '${doctypeName}' not found. Attempting to create it...`);
        const schema = doctypeSchemas[doctypeName];
        if (!schema) {
            throw new Error(`No schema defined for doctype '${doctypeName}'.`);
        }
        await postToDoctype(schema, sid);
        console.log(`Doctype '${doctypeName}' created successfully.`);
    } else {
        // Handle other errors (like permission denied)
        const errorData = await checkResponse.json();
        throw new Error(`Failed to check for doctype '${doctypeName}': ${errorData.exception || checkResponse.statusText}`);
    }
}


async function postToErpNext(doctype: string, data: any, sid: string) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');

  const response = await fetch(`${ERPNEXT_API_URL}/api/resource/${doctype}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`ERPNext API Error for ${doctype}:`, errorData);
    const errorMessage = errorData?._server_messages || errorData?.exception || errorData?.message || `HTTP error! status: ${response.status}`;
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
    service_name: service.title,
    slug: service.slug,
    short_description: service.shortDescription,
    long_description: service.longDescription,
    category: service.category?.name || '', // Defensive check here
    status: service.status,
    tags: service.tags.join(','),
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
      const erpDoctype = collectionMappings[collectionName];
      if (!erpDoctype) {
        throw new Error(`No ERPNext doctype mapping found for collection '${collectionName}'.`);
      }

      // Step 1: Ensure Doctype exists in ERPNext
      await checkAndCreateDoctype(erpDoctype, sid);

      // Step 2: Migrate data from Firestore
      const querySnapshot = await getDocs(collection(db, collectionName));
      const totalDocs = querySnapshot.size;
      let migratedCount = 0;

      if (totalDocs === 0) {
        statuses.push({ collection: collectionName, success: true, count: 0, error: 'No documents to migrate.' });
        continue;
      }

      for (const doc of querySnapshot.docs) {
        let dataToPost;
        const docData = { id: doc.id, ...doc.data() };
        
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
      statuses.push({ collection: collectionName, success: true, count: migratedCount });
    } catch (error: any) {
      console.error(`Migration failed for collection: ${collectionName}`, error);
      statuses.push({ collection: collectionName, success: false, count: 0, error: error.message });
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
