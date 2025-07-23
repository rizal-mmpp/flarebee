
'use server';

import type { Service, Order, UserProfile, ServiceCategory, PurchasedTemplateItem } from '../types';
import { SERVICE_CATEGORIES } from '../constants';
import type { ServiceFormValues } from '@/components/sections/admin/ServiceFormTypes';
import { uploadFileToVercelBlob } from './vercelBlob.actions';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface ErpNextApiResponse<T> {
  data: T[];
}

interface FetchFromErpNextArgs {
    sid: string;
    doctype: string;
    docname?: string;
    fields?: string[];
    filters?: any[];
    limit?: number;
}

// Unified fetch function
async function fetchFromErpNext<T>({ sid, doctype, docname, fields = ['*'], filters = [], limit = 0 }: FetchFromErpNextArgs): Promise<{ success: boolean, data?: T | T[], error?: string }> {
    if (!ERPNEXT_API_URL) return { success: false, error: 'ERPNext API URL is not configured.' };
    if (!sid) return { success: false, error: 'Session ID (sid) is required.' };

    const endpoint = docname ? `${ERPNEXT_API_URL}/api/resource/${doctype}/${docname}` : `${ERPNEXT_API_URL}/api/resource/${doctype}`;
    const url = new URL(endpoint);

    if (!docname) { // Params are for list view
        url.searchParams.append('fields', JSON.stringify(fields));
        if (filters.length > 0) {
            url.searchParams.append('filters', JSON.stringify(filters));
        }
        if (limit > 0) {
            url.searchParams.append('limit', String(limit));
        } else {
            url.searchParams.append('limit_page_length', '0'); // Fetch all
        }
    }


    try {
        const response = await fetch(url.toString(), {
            headers: { 'Cookie': `sid=${sid}`, 'Accept': 'application/json' },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            return { success: false, error: errorData.message || errorData.exception || `Failed to fetch data from ${doctype}.` };
        }

        const result: { data: T | T[] } = await response.json();
        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}


function transformErpItemToAppService(item: any): Service {
    const category = SERVICE_CATEGORIES.find(c => c.name === item.item_group) || SERVICE_CATEGORIES[4]; // Default to 'Other'
    
    // Check if image URL is absolute. If not, prepend ERPNext URL.
    const imageUrl = (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://')))
      ? item.image
      : item.image
        ? `${ERPNEXT_API_URL}${item.image}`
        : 'https://placehold.co/600x400.png';

    return {
        id: item.name, 
        slug: item.item_code, // Assuming item_code is the slug
        title: item.item_name,
        shortDescription: item.description,
        longDescription: item.website_description || '',
        category: category,
        tags: typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : [],
        imageUrl: imageUrl,
        status: item.disabled ? 'inactive' : 'active',
        serviceUrl: item.service_url || '#',
        createdAt: item.creation,
        updatedAt: item.modified,
        pricing: {
            isFixedPriceActive: true,
            // The price is now decoupled and fetched from a Price List or standard_rate
            fixedPriceDetails: { price: item.standard_rate || 0 }
        }
    };
}

function transformErpSalesInvoiceToAppOrder(item: any): Order {
    let items: PurchasedTemplateItem[] = [];
    try {
        if (Array.isArray(item.items)) {
            items = item.items.map((it: any) => ({
                id: it.item_code,
                title: it.item_name || 'N/A',
                price: it.rate || 0,
            }));
        }
    } catch (e) {
        console.error(`Failed to parse items for Sales Invoice ${item.name}:`, e);
    }
    
    return {
        id: item.name,
        userId: item.customer, 
        userEmail: item.customer_email || 'N/A', 
        orderId: item.name,
        items: items,
        totalAmount: item.grand_total,
        currency: item.currency || 'IDR',
        status: item.status?.toLowerCase() || 'pending',
        paymentGateway: item.payment_gateway || 'ERPNext',
        createdAt: item.creation,
        updatedAt: item.modified,
        xenditPaymentStatus: item.status, 
    };
}


export async function getServicesFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({ sid, doctype: 'Item', fields: ['name', 'item_code', 'item_name', 'item_group', 'description', 'image', 'disabled', 'standard_rate'] });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get items.' };
    }
    const services: Service[] = (result.data as any[]).map(transformErpItemToAppService);
    return { success: true, data: services };
}

export async function getServiceFromErpNextByName({ sid, serviceName }: { sid: string; serviceName: string; }): Promise<{ success: boolean; data?: Service; error?: string; }> {
    const result = await fetchFromErpNext<any>({ sid, doctype: 'Item', docname: serviceName });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get item.' };
    }
    const service: Service = transformErpItemToAppService(result.data);
    return { success: true, data: service };
}

async function uploadAndGetUrl(file: File | null): Promise<string | null> {
    if (!file) return null;
    const blobFormData = new FormData();
    blobFormData.append('file', file);
    const uploadResult = await uploadFileToVercelBlob(blobFormData);
    if (!uploadResult.success || !uploadResult.data?.url) {
        throw new Error(uploadResult.error || 'Could not upload file.');
    }
    return uploadResult.data.url;
}

function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function transformFormToErpItem(data: ServiceFormValues, imageUrl: string | null): any {
    const category = SERVICE_CATEGORIES.find(cat => cat.id === data.categoryId);
    return {
        item_code: slugify(data.title),
        item_name: data.title,
        item_group: category?.name || 'Services', // Default Item Group
        description: data.shortDescription,
        website_description: data.longDescription,
        disabled: data.status === 'inactive' ? 1 : 0,
        image: imageUrl, // ERPNext expects 'image' field for Item
        is_stock_item: 0, // Explicitly set as non-stock item
        // Note: standard_rate should be set via Item Price Doctype, but we can set a default here if needed.
        standard_rate: data.pricing?.fixedPriceDetails?.price ?? 0,
    };
}

export async function createServiceInErpNext({ sid, serviceData, imageFile }: { sid: string, serviceData: ServiceFormValues, imageFile: File | null }) {
    try {
        const imageUrl = await uploadAndGetUrl(imageFile);
        const erpData = transformFormToErpItem(serviceData, imageUrl);

        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(erpData),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.exception || responseData._server_messages || 'Failed to create item in ERPNext.');
        }

        return { success: true, message: `Item "${serviceData.title}" created successfully.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateServiceInErpNext({ sid, serviceName, serviceData, imageFile, currentImageUrl }: { sid: string, serviceName: string, serviceData: ServiceFormValues, imageFile: File | null, currentImageUrl?: string | null }) {
    try {
        let finalImageUrl = imageFile ? await uploadAndGetUrl(imageFile) : currentImageUrl;
        const erpData = transformFormToErpItem(serviceData, finalImageUrl || null);
        
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Item/${serviceName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(erpData),
        });
        
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.exception || responseData._server_messages || 'Failed to update item in ERPNext.');
        }

        return { success: true, message: `Item "${serviceData.title}" updated successfully.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function deleteServiceFromErpNext({ sid, serviceName }: { sid: string, serviceName: string }) {
  try {
    const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Item/${serviceName}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData._server_messages || 'Failed to delete item from ERPNext.');
    }
    
    return { success: true, message: `Item "${serviceName}" deleted successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getOrdersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Order[]; error?: string; }> {
     const result = await fetchFromErpNext<any[]>({ sid, doctype: 'Sales Invoice', fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'currency', 'status'] });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Sales Invoices.' };
    }

    const orders: Order[] = (result.data as any[]).map(item => ({
        ...transformErpSalesInvoiceToAppOrder(item),
        userEmail: item.customer_name || item.customer, 
    }));

    return { success: true, data: orders };
}

export async function getOrderByOrderIdFromErpNext({ sid, orderId }: { sid: string; orderId: string; }): Promise<{ success: boolean; data?: Order; error?: string; }> {
    const result = await fetchFromErpNext<any>({ sid, doctype: 'Sales Invoice', docname: orderId });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Sales Invoice.' };
    }
    const order: Order = transformErpSalesInvoiceToAppOrder(result.data);
    return { success: true, data: order };
}


export async function getUsersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: UserProfile[]; error?: string; }> {
     const result = await fetchFromErpNext<any[]>({ sid, doctype: 'User', fields: ['name', 'email', 'full_name', 'user_image', 'creation', 'user_roles'] });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get users.' };
    }
    
    const users: UserProfile[] = (result.data as any[]).map(item => {
        const roles = Array.isArray(item.user_roles) ? item.user_roles.map(r => r.role) : [];
        return {
            uid: item.name,
            email: item.email,
            displayName: item.full_name,
            photoURL: item.user_image ? `${ERPNEXT_API_URL}${item.user_image}` : null,
            role: roles.includes('System Manager') ? 'admin' : 'user',
            createdAt: new Date(item.creation),
        };
    });

    return { success: true, data: users };
}
