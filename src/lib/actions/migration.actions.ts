
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

// --- Doctype Definitions ---
const doctypeSchemas: { [key: string]: any } = {
  [collectionMappings.services]: {
    doctype: 'Item',
    fields: [
      // Adding custom fields to the standard Item doctype
      { fieldname: 'service_url', fieldtype: 'Data', label: 'Service Management URL', insert_after: 'description' },
      { fieldname: 'website_description', fieldtype: 'Text Editor', label: 'Website Description', insert_after: 'service_url' },
      { fieldname: 'tags', fieldtype: 'Data', label: 'Tags', insert_after: 'website_description' },
    ],
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
  [collectionMappings.siteSettings]: {
    doctype: 'DocType',
    name: collectionMappings.siteSettings,
    module: MODULE_NAME,
    custom: 1,
    issingle: 1, // Correct for Site Settings
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

async function checkAndCreateOrUpdateDocType(doctypeName: string, sid: string) {
    if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
    
    const checkResponse = await fetch(`${ERPNEXT_API_URL}/api/resource/DocType/${doctypeName}`, {
        headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` }
    });

    const schema = doctypeSchemas[doctypeName];
    if (!schema) {
      throw new Error(`No schema definition found for doctype '${doctypeName}'.`);
    }

    if (checkResponse.ok) {
        // DocType exists, check if custom fields need to be added.
        const existingDocType = await checkResponse.json();
        const existingFields = new Set(existingDocType.data.fields.map((f: any) => f.fieldname));
        const missingFields = schema.fields.filter((f: any) => !existingFields.has(f.fieldname));
        
        if (missingFields.length > 0) {
            console.log(`Doctype '${doctypeName}' exists, but is missing fields. Attempting to add: ${missingFields.map(f => f.fieldname).join(', ')}`);
            for (const field of missingFields) {
                await addCustomFieldToDocType(doctypeName, field, sid);
            }
        } else {
            console.log(`Doctype '${doctypeName}' already exists and is up-to-date.`);
        }
    } else if (checkResponse.status === 404) {
        // Doctype does not exist, create it from scratch.
        console.log(`Doctype '${doctypeName}' not found. Attempting to create it...`);
        await postToDoctype(schema, sid);
        console.log(`Doctype '${doctypeName}' created successfully.`);
    } else {
        const errorData = await checkResponse.json();
        throw new Error(`Failed to check for doctype '${doctypeName}': ${errorData.exception || checkResponse.statusText}`);
    }
}

async function addCustomFieldToDocType(doctype: string, fieldData: any, sid: string) {
    const payload = {
        doctype: doctype,
        ...fieldData
    };
    
    const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Custom Field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add custom field '${fieldData.fieldname}' to '${doctype}': ${errorData._server_messages || errorData.exception}`);
    }
    console.log(`Successfully added custom field '${fieldData.fieldname}' to '${doctype}'.`);
}


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

      // Step 1: Ensure Doctype exists and has the correct fields
      await checkAndCreateOrUpdateDocType(erpDoctype, sid);

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
