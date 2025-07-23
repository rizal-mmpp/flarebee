
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { SitePage, Service, Order, SiteSettings } from '../types';

export interface MigrationStatus {
  collection: string;
  success: boolean;
  count: number;
  skipped: number;
  error?: string;
}

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;
const MODULE_NAME = 'Website'; // Using a standard module

const collectionMappings: { [key: string]: string } = {
  services: `Item`,
  sitePages: `Site Page`,
  orders: `Sales Invoice`, // Corrected to Sales Invoice
  siteSettings: 'Site Settings', // This will be a custom DocType
  userCarts: 'User Cart', // This will be a custom DocType
};

const uniqueFieldMappings: { [key: string]: string } = {
    services: 'item_code',
    sitePages: 'page_id',
    orders: 'name', // 'name' is the unique ID for Sales Invoice
    userCarts: 'user_id',
};

// --- Doctype Definitions for CREATION ---
const doctypeSchemas: { [key: string]: any } = {
  [collectionMappings.sitePages]: {
    doctype: 'DocType',
    name: collectionMappings.sitePages,
    module: MODULE_NAME,
    custom: 1,
    fields: [
      { fieldname: 'page_id', fieldtype: 'Data', label: 'Page ID', unique: 1 },
      { fieldname: 'title', fieldtype: 'Data', label: 'Title'},
      { fieldname: 'content', fieldtype: 'Text Editor', label: 'Content' },
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
    issingle: 0,
    istable: 0,
    title_field: 'title',
  },
  [collectionMappings.siteSettings]: {
    doctype: 'DocType',
    name: collectionMappings.siteSettings,
    module: MODULE_NAME,
    custom: 1,
    issingle: 1,
    fields: [
      { fieldname: 'site_title', fieldtype: 'Data', label: 'Site Title' },
      { fieldname: 'logo_url', fieldtype: 'Data', label: 'Logo URL' },
      { fieldname: 'contact_address', fieldtype: 'Small Text', label: 'Contact Address' },
      { fieldname: 'contact_phone', fieldtype: 'Data', label: 'Contact Phone' },
      { fieldname: 'contact_email', fieldtype: 'Data', label: 'Contact Email' },
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
  },
  [collectionMappings.userCarts]: {
    doctype: 'DocType',
    name: collectionMappings.userCarts,
    module: 'Accounts',
    custom: 1,
    fields: [
      { fieldname: 'user_id', fieldtype: 'Data', label: 'User ID', unique: 1 },
      { fieldname: 'items_json', fieldtype: 'Code', label: 'Items JSON' },
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
    issingle: 0,
    istable: 0,
    title_field: 'user_id',
  },
};

const customFieldsForStandardDoctypes: { [key: string]: any[] } = {
  'Item': [
    { fieldname: 'service_url', fieldtype: 'Data', label: 'Service Management URL', insert_after: 'description' },
    { fieldname: 'website_description', fieldtype: 'Text Editor', label: 'Website Description', insert_after: 'service_url' },
    { fieldname: 'tags', fieldtype: 'Data', label: 'Tags', insert_after: 'website_description' },
  ],
};


async function postToErpNext(doctype: string, data: any, sid: string, isSingle: boolean = false) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
  
  const endpoint = isSingle ? `${ERPNEXT_API_URL}/api/resource/${doctype}` : `${ERPNEXT_API_URL}/api/resource/${doctype}`;
  const method = isSingle ? 'PUT' : 'POST';

  const response = await fetch(endpoint, {
    method: method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ERPNext API Error for ${doctype}:`, errorText);
    try {
        const errorData = JSON.parse(errorText);
        const errorMessage = errorData?._server_messages || errorData?.exception || errorData?.message || `HTTP error! status: ${response.status}`;
        if (Array.isArray(errorMessage)) {
            const parsedMessage = JSON.parse(errorMessage[0]);
            throw new Error(parsedMessage.message || "Unknown ERPNext Error");
        }
        throw new Error(errorMessage);
    } catch(e) {
        const snippet = errorText.substring(0, 200).replace(/\n/g, '');
        if (errorText.toLowerCase().includes('<!doctype html')) {
             throw new Error(`Server returned HTML instead of JSON. Snippet: "${snippet}..."`);
        }
        throw new Error(`Failed with status ${response.status} and non-JSON response: ${snippet}`);
    }
  }
  return response.json();
}

async function ensureCustomFieldsExist(doctype: string, sid: string) {
    const fields = customFieldsForStandardDoctypes[doctype];
    if (!fields) return;

    for (const field of fields) {
        // Correct payload for creating a "Custom Field" document
        const payload = {
            doctype: "Custom Field", // The doctype we are creating is "Custom Field"
            dt: doctype, // The DocType we are modifying
            ...field // The actual field properties
        };
        
        try {
            await postToErpNext('Custom Field', payload, sid);
            console.log(`Successfully added or verified custom field '${field.fieldname}' to '${doctype}'.`);
        } catch (error: any) {
            if (error.message && error.message.includes('already exists')) {
                console.log(`Custom field '${field.fieldname}' already exists in '${doctype}'. Skipping.`);
            } else {
                throw new Error(`Failed to add custom field '${field.fieldname}' to '${doctype}': ${error.message}`);
            }
        }
    }
}

async function ensureDocTypeExists(doctypeName: string, sid: string) {
    const schema = doctypeSchemas[doctypeName];
    if (!schema) return; // Not a custom doctype we manage

    const checkUrl = `${ERPNEXT_API_URL}/api/resource/DocType/${doctypeName}`;
    const checkResponse = await fetch(checkUrl, { headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` } });
    
    if (checkResponse.status === 404) {
        console.log(`DocType '${doctypeName}' not found. Creating...`);
        await postToErpNext('DocType', schema, sid);
        console.log(`DocType '${doctypeName}' created successfully.`);
    } else if (checkResponse.ok) {
        console.log(`DocType '${doctypeName}' already exists.`);
    } else {
        const errorData = await checkResponse.json();
        throw new Error(`Failed to check DocType '${doctypeName}': ${errorData.exception || 'Unknown error'}`);
    }
}

// Data transformation functions
function transformServiceData(service: Service) {
  return {
    item_code: service.slug,
    item_name: service.title,
    item_group: service.category?.name || 'All Item Groups',
    description: service.shortDescription,
    website_description: service.longDescription,
    disabled: service.status === 'inactive' ? 1 : 0,
    image: service.imageUrl,
    service_url: service.serviceUrl,
    tags: service.tags.join(','),
    is_stock_item: 0,
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
  // This transformation is complex and better handled by a dedicated function
  // that creates a Sales Invoice from our order data.
  // For migration, we're skipping orders as they are transactional.
  return null;
}

function transformSiteSettingsData(settings: SiteSettings) {
    return {
        doctype: 'Site Settings',
        site_title: settings.siteTitle,
        logo_url: settings.logoUrl,
        contact_address: settings.contactAddress,
        contact_phone: settings.contactPhone,
        contact_email: settings.contactEmail,
    };
}

function transformUserCartData(cart: any) {
    return {
        user_id: cart.id, // The document ID in Firestore is the user ID
        items_json: JSON.stringify(cart.items),
    };
}

// Function to check if a document exists in ERPNext
async function doesErpNextDocExist(doctype: string, fieldName: string, fieldValue: any, sid: string): Promise<boolean> {
    if (!fieldName) return false;
    const filters = JSON.stringify([[fieldName, '=', fieldValue]]);
    const fields = JSON.stringify(['name']);
    const checkUrl = `${ERPNEXT_API_URL}/api/resource/${doctype}?filters=${filters}&fields=${fields}&limit=1`;

    const response = await fetch(checkUrl, {
        headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` }
    });

    if (!response.ok) {
        console.error(`Error checking for existing doc in ${doctype}: ${response.statusText}`);
        return false;
    }

    const data = await response.json();
    return data.data && data.data.length > 0;
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
  const collectionsToMigrate = ['services', 'sitePages', 'siteSettings', 'userCarts']; // Skipping orders

  for (const collectionName of collectionsToMigrate) {
    let migratedCount = 0;
    let skippedCount = 0;
    try {
      const erpDoctype = collectionMappings[collectionName];
      if (!erpDoctype) {
        throw new Error(`No ERPNext doctype mapping found for collection '${collectionName}'.`);
      }

      // Step 1: Ensure DocType and its fields exist
      if (doctypeSchemas[erpDoctype]) {
          await ensureDocTypeExists(erpDoctype, sid);
      }
      if (customFieldsForStandardDoctypes[erpDoctype]) {
          await ensureCustomFieldsExist(erpDoctype, sid);
      }

      if(collectionName === 'orders') {
          statuses.push({ collection: collectionName, success: true, count: 0, skipped: 0, error: 'Transactional data (Orders) are not migrated by this script.' });
          continue;
      }

      const isSingleDoctype = doctypeSchemas[erpDoctype]?.issingle === 1;

      // Step 2: Migrate data from Firestore
      const querySnapshot = await getDocs(collection(db, collectionName));
      const totalDocs = querySnapshot.size;

      if (totalDocs === 0) {
        statuses.push({ collection: collectionName, success: true, count: 0, skipped: 0, error: 'No documents to migrate.' });
        continue;
      }

      for (const doc of querySnapshot.docs) {
        const docData = { id: doc.id, ...doc.data() };
        let dataToPost;
        
        switch (collectionName) {
          case 'services': dataToPost = transformServiceData(docData as unknown as Service); break;
          case 'sitePages': dataToPost = transformSitePageData(docData as unknown as SitePage); break;
          case 'siteSettings': dataToPost = transformSiteSettingsData(docData as unknown as SiteSettings); break;
          case 'userCarts': dataToPost = transformUserCartData(docData); break;
          default: dataToPost = { ...docData }; break;
        }

        if (isSingleDoctype) {
            await postToErpNext(erpDoctype, dataToPost, sid, true);
            migratedCount++;
        } else {
            const uniqueField = uniqueFieldMappings[collectionName];
            // @ts-ignore
            const uniqueValue = dataToPost[uniqueField];

            if (!uniqueField || uniqueValue === undefined) {
                 console.warn(`Skipping existence check for ${collectionName} doc ${doc.id} due to missing unique identifier.`);
                 await postToErpNext(erpDoctype, dataToPost, sid, false);
                 migratedCount++;
                 continue;
            }

            const docExists = await doesErpNextDocExist(erpDoctype, uniqueField, uniqueValue, sid);
            if (docExists) {
                console.log(`Document with ${uniqueField}=${uniqueValue} already exists in ${erpDoctype}. Skipping.`);
                skippedCount++;
            } else {
                await postToErpNext(erpDoctype, dataToPost, sid, false);
                migratedCount++;
            }
        }
      }
      statuses.push({ collection: collectionName, success: true, count: migratedCount, skipped: skippedCount });
    } catch (error: any) {
      console.error(`Migration failed for collection: ${collectionName}`, error);
      statuses.push({ collection: collectionName, success: false, count: migratedCount, skipped: skippedCount, error: error.message });
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
