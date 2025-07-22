
'use server';

import type { Service, Order, UserProfile, ServiceCategory } from '../types';
import { SERVICE_CATEGORIES } from '../constants';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface ErpNextApiResponse<T> {
  data: T[];
}

interface FetchFromErpNextArgs {
    sid: string;
    doctype: string;
    fields?: string[];
    filters?: any[];
    limit?: number;
}

async function fetchFromErpNext<T>({ sid, doctype, fields = ['*'], filters = [], limit = 0 }: FetchFromErpNextArgs): Promise<{ success: boolean, data?: T[], error?: string }> {
    if (!ERPNEXT_API_URL) return { success: false, error: 'ERPNext API URL is not configured.' };
    if (!sid) return { success: false, error: 'Session ID (sid) is required.' };

    const url = new URL(`${ERPNEXT_API_URL}/api/resource/${doctype}`);
    url.searchParams.append('fields', JSON.stringify(fields));
    if (filters.length > 0) {
        url.searchParams.append('filters', JSON.stringify(filters));
    }
    if (limit > 0) {
        url.searchParams.append('limit', String(limit));
    } else {
        url.searchParams.append('limit_page_length', '0'); // Fetch all
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

        const result: ErpNextApiResponse<T> = await response.json();
        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}


export async function getServicesFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    const result = await fetchFromErpNext<any>({ sid, doctype: 'Service' });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get services.' };
    }

    const services: Service[] = result.data.map(item => {
        const category = SERVICE_CATEGORIES.find(c => c.name === item.category) || SERVICE_CATEGORIES[4]; // Default to 'Other'
        return {
            id: item.name, // ERPNext uses 'name' as the unique ID
            slug: item.slug,
            title: item.service_name,
            shortDescription: item.short_description,
            longDescription: item.long_description,
            category: category,
            tags: item.tags?.split(',') || [],
            imageUrl: item.image_url ? `${ERPNEXT_API_URL}${item.image_url}` : 'https://placehold.co/600x400.png',
            status: item.status,
            serviceUrl: '#',
            createdAt: item.creation,
            updatedAt: item.modified,
             pricing: {
                isFixedPriceActive: true,
                fixedPriceDetails: { price: item.price || 0 }
            }
        };
    });

    return { success: true, data: services };
}


export async function getOrdersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Order[]; error?: string; }> {
     const result = await fetchFromErpNext<any>({ sid, doctype: 'Orders' });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get orders.' };
    }

    const orders: Order[] = result.data.map(item => ({
        id: item.name,
        userId: 'N/A', // ERPNext doesn't have a direct mapping to Firebase UID
        userEmail: item.customer_email,
        orderId: item.order_id,
        items: JSON.parse(item.items_json || '[]'),
        totalAmount: item.total_amount,
        currency: item.currency,
        status: item.status?.toLowerCase() || 'pending',
        paymentGateway: item.payment_gateway,
        createdAt: item.creation,
        updatedAt: item.modified,
        xenditPaymentStatus: item.status, // Assuming ERPNext status mirrors Xendit's
    }));

    return { success: true, data: orders };
}

export async function getUsersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: UserProfile[]; error?: string; }> {
     const result = await fetchFromErpNext<any>({ sid, doctype: 'User', fields: ['name', 'email', 'full_name', 'user_image', 'creation', 'role'] });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get users.' };
    }
    
    const users: UserProfile[] = result.data.map(item => ({
        uid: item.name,
        email: item.email,
        displayName: item.full_name,
        photoURL: item.user_image ? `${ERPNEXT_API_URL}${item.user_image}` : null,
        role: item.role === 'System Manager' ? 'admin' : 'user',
        createdAt: new Date(item.creation),
    }));

    return { success: true, data: users };
}
