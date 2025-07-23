
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


function transformErpServiceToAppService(item: any): Service {
    const category = SERVICE_CATEGORIES.find(c => c.name === item.category) || SERVICE_CATEGORIES[4]; // Default to 'Other'
    
    const imageUrl = (item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('https')))
      ? item.image_url
      : item.image_url
        ? `${ERPNEXT_API_URL}${item.image_url}`
        : 'https://placehold.co/600x400.png';

    return {
        id: item.name, 
        slug: item.slug,
        title: item.service_name,
        shortDescription: item.short_description,
        longDescription: item.long_description,
        category: category,
        tags: typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : [],
        imageUrl: imageUrl,
        status: item.status,
        serviceUrl: item.service_url || '#',
        createdAt: item.creation,
        updatedAt: item.modified,
        pricing: {
            isFixedPriceActive: true,
            fixedPriceDetails: { price: item.price || 0 }
        }
    };
}

function transformErpSalesInvoiceToAppOrder(item: any): Order {
    let items: PurchasedTemplateItem[] = [];
    try {
        // Assuming the items are stored in the 'items' table of the Sales Invoice
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
        userId: item.customer, // The customer link in ERPNext
        userEmail: item.customer_email || 'N/A', // Assuming a custom field or fetched separately
        orderId: item.name, // The Sales Invoice name is the Order ID
        items: items,
        totalAmount: item.grand_total,
        currency: item.currency || 'IDR',
        status: item.status?.toLowerCase() || 'pending',
        paymentGateway: item.payment_gateway || 'ERPNext', // Default or custom field
        createdAt: item.creation,
        updatedAt: item.modified,
        xenditPaymentStatus: item.status, // Assuming ERPNext status maps directly
    };
}


export async function getServicesFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({ sid, doctype: 'Service' });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get services.' };
    }
    const services: Service[] = (result.data as any[]).map(transformErpServiceToAppService);
    return { success: true, data: services };
}

export async function getServiceFromErpNextByName({ sid, serviceName }: { sid: string; serviceName: string; }): Promise<{ success: boolean; data?: Service; error?: string; }> {
    const result = await fetchFromErpNext<any>({ sid, doctype: 'Service', docname: serviceName });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get service.' };
    }
    const service: Service = transformErpServiceToAppService(result.data);
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

function transformFormToErpService(data: ServiceFormValues, imageUrl: string | null): any {
    const category = SERVICE_CATEGORIES.find(cat => cat.id === data.categoryId);
    return {
        service_name: data.title,
        slug: slugify(data.title),
        short_description: data.shortDescription,
        long_description: data.longDescription,
        category: category?.name || 'Other Services',
        status: data.status,
        tags: data.tags,
        price: data.pricing?.fixedPriceDetails?.price ?? 0,
        image_url: imageUrl,
        service_url: data.serviceUrl,
    };
}

export async function createServiceInErpNext({ sid, serviceData, imageFile, fixedPriceImageFile }: { sid: string, serviceData: ServiceFormValues, imageFile: File | null, fixedPriceImageFile: File | null }) {
    try {
        if (!imageFile) throw new Error("Main image is required to create a service.");
        const imageUrl = await uploadAndGetUrl(imageFile);
        if (!imageUrl) throw new Error("Main image URL could not be generated after upload.");
        
        const erpData = transformFormToErpService(serviceData, imageUrl);

        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(erpData),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.exception || responseData._server_messages || 'Failed to create service in ERPNext.');
        }

        return { success: true, message: `Service "${serviceData.title}" created successfully.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateServiceInErpNext({ sid, serviceName, serviceData, imageFile, fixedPriceImageFile, currentImageUrl, currentFixedPriceImageUrl }: { sid: string, serviceName: string, serviceData: ServiceFormValues, imageFile: File | null, fixedPriceImageFile: File | null, currentImageUrl?: string | null, currentFixedPriceImageUrl?: string | null }) {
    try {
        let finalImageUrl = imageFile ? await uploadAndGetUrl(imageFile) : currentImageUrl;
        const erpData = transformFormToErpService(serviceData, finalImageUrl || null);
        
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Service/${serviceName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(erpData),
        });
        
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.exception || responseData._server_messages || 'Failed to update service in ERPNext.');
        }

        return { success: true, message: `Service "${serviceData.title}" updated successfully.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteServiceFromErpNext({ sid, serviceName }: { sid: string, serviceName: string }) {
  try {
    const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Service/${serviceName}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData._server_messages || 'Failed to delete service from ERPNext.');
    }
    
    return { success: true, message: `Service "${serviceName}" deleted successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getOrdersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Order[]; error?: string; }> {
     const result = await fetchFromErpNext<any[]>({ sid, doctype: 'Sales Invoice', fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'currency', 'status'] });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Sales Invoices.' };
    }

    // Since customer email is not a default field in the list view, we need a way to map it.
    // For now, we will use customer_name. A more robust solution might need another query.
    const orders: Order[] = (result.data as any[]).map(item => ({
        ...transformErpSalesInvoiceToAppOrder(item),
        userEmail: item.customer_name || item.customer, // Use customer name as a fallback for display
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
     const result = await fetchFromErpNext<any[]>({ sid, doctype: 'User', fields: ['name', 'email', 'full_name', 'user_image', 'creation', 'role'] });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get users.' };
    }
    
    const users: UserProfile[] = (result.data as any[]).map(item => ({
        uid: item.name,
        email: item.email,
        displayName: item.full_name,
        photoURL: item.user_image ? `${ERPNEXT_API_URL}${item.user_image}` : null,
        role: item.role === 'System Manager' ? 'admin' : 'user',
        createdAt: new Date(item.creation),
    }));

    return { success: true, data: users };
}
