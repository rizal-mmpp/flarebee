
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { SitePage, Service, Order, SiteSettings, SubscriptionPlan } from '../types';
import { DEFAULT_SUBSCRIPTION_PLANS } from '../constants';

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
  orders: `Sales Invoice`,
  siteSettings: 'Site Settings',
  userCarts: 'User Cart',
  subscriptionPlans: 'Subscription Plan',
};

const uniqueFieldMappings: { [key: string]: string } = {
    services: 'item_code',
    sitePages: 'page_id',
    orders: 'name',
    userCarts: 'user_id',
    subscriptionPlans: 'plan_name',
};

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
        const payload = {
            doctype: "Custom Field",
            dt: doctype,
            ...field
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
    if (!schema) return;

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
        user_id: cart.id,
        items_json: JSON.stringify(cart.items),
    };
}

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


export async function runSingleMigrationAction(
  collectionName: string,
  sid: string
): Promise<MigrationStatus> {
  if (!sid) {
    return { collection: collectionName, success: false, count: 0, skipped: 0, error: 'ERPNext session not found.' };
  }

  let migratedCount = 0;
  let skippedCount = 0;
  
  try {
    const erpDoctype = collectionMappings[collectionName];
    if (!erpDoctype) {
      throw new Error(`No ERPNext doctype mapping found for collection '${collectionName}'.`);
    }

    if (doctypeSchemas[erpDoctype]) {
      await ensureDocTypeExists(erpDoctype, sid);
    }
    if (customFieldsForStandardDoctypes[erpDoctype]) {
      await ensureCustomFieldsExist(erpDoctype, sid);
    }

    // Special handling for seeding default subscription plans
    if (collectionName === 'subscriptionPlans') {
      const uniqueField = uniqueFieldMappings[collectionName];
      for (const planData of DEFAULT_SUBSCRIPTION_PLANS) {
        const docExists = await doesErpNextDocExist(erpDoctype, uniqueField, planData.plan_name, sid);
        if (docExists) {
          skippedCount++;
        } else {
          await postToErpNext(erpDoctype, planData, sid, false);
          migratedCount++;
        }
      }
       return { collection: collectionName, success: true, count: migratedCount, skipped: skippedCount };
    }


    const isSingleDoctype = doctypeSchemas[erpDoctype]?.issingle === 1;
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    if (querySnapshot.empty) {
      return { collection: collectionName, success: true, count: 0, skipped: 0, error: 'No documents to migrate.' };
    }

    for (const doc of querySnapshot.docs) {
      const docData = { id: doc.id, ...doc.data() };
      let dataToPost;

      switch (collectionName) {
        case 'services': dataToPost = transformServiceData(docData as unknown as Service); break;
        case 'sitePages': dataToPost = transformSitePageData(docData as unknown as SitePage); break;
        case 'siteSettings': dataToPost = transformSiteSettingsData(docData as unknown as SiteSettings); break;
        case 'userCarts': dataToPost = transformUserCartData(docData); break;
        default: continue; 
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
        } else {
          const docExists = await doesErpNextDocExist(erpDoctype, uniqueField, uniqueValue, sid);
          if (docExists) {
            skippedCount++;
          } else {
            await postToErpNext(erpDoctype, dataToPost, sid, false);
            migratedCount++;
          }
        }
      }
    }
    return { collection: collectionName, success: true, count: migratedCount, skipped: skippedCount };
  } catch (error: any) {
    console.error(`Migration failed for collection: ${collectionName}`, error);
    return { collection: collectionName, success: false, count: migratedCount, skipped: skippedCount, error: error.message };
  }
}
