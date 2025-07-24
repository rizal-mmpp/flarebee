
'use server';

import type { Service, ServiceCategory } from '../../types';
import type { ServiceFormValues } from '@/components/sections/admin/ServiceFormTypes';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

function transformErpItemToAppService(item: any): Service {
    const categoryName = item.item_group || 'Other Services';
    const category: ServiceCategory = {
        id: categoryName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')
    };
    
    const imageUrl = (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://')))
      ? item.image
      : item.image
        ? `${ERPNEXT_API_URL}${item.image}`
        : 'https://placehold.co/600x400.png';

    return {
        id: item.name, 
        slug: item.item_code,
        title: item.item_name,
        shortDescription: item.description || '',
        longDescription: item.website_description || '',
        category: category,
        tags: typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : [],
        imageUrl: imageUrl,
        status: item.disabled ? 'inactive' : 'active',
        serviceUrl: item.service_url || '#',
        createdAt: item.creation,
        updatedAt: item.modified,
        pricing: {
            isFixedPriceActive: item.standard_rate > 0,
            fixedPriceDetails: { price: item.standard_rate || 0 }
            // Subscription details would need to be fetched separately and merged here
        }
    };
}

// For client-side fetching where no SID is available
export async function getPublicServices({ categorySlug }: { categorySlug?: string } = {}): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    // This is a placeholder for a potential future API route that doesn't require SID
    // For now, we use getServicesFromErpNext and assume a guest/public SID if necessary
    return { success: false, error: "Direct public fetching not implemented. Use a server component." };
}

export async function getPublicServiceBySlug(slug: string): Promise<{ success: boolean; data?: Service; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({
        doctype: 'Item',
        fields: ['name', 'item_code', 'item_name', 'item_group', 'description', 'website_description', 'image', 'disabled', 'standard_rate', 'tags', 'service_url', 'creation', 'modified'],
        filters: [['item_code', '=', slug]],
        limit: 1,
    });
    if (!result.success || !result.data || result.data.length === 0) {
        return { success: false, error: result.error || `Service with slug '${slug}' not found.` };
    }
    const service: Service = transformErpItemToAppService(result.data[0]);
    return { success: true, data: service };
}

export async function getPublicServicesFromErpNext({ categorySlug }: { categorySlug?: string }): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    const filters: any[] = [['disabled', '=', 0]]; // Only fetch active services
    if (categorySlug) {
        const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        filters.push(['item_group', '=', categoryName]);
    }
    const result = await fetchFromErpNext<any[]>({ 
        doctype: 'Item', 
        fields: ['name', 'item_code', 'item_name', 'item_group', 'description', 'image', 'disabled', 'standard_rate', 'tags', 'service_url', 'creation', 'modified'],
        filters,
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get items.' };
    }
    const services: Service[] = (result.data as any[]).map(transformErpItemToAppService);
    return { success: true, data: services };
}

export async function getServicesFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({ 
        sid, 
        doctype: 'Item', 
        fields: ['name', 'item_code', 'item_name', 'item_group', 'description', 'website_description', 'image', 'disabled', 'standard_rate', 'tags', 'service_url', 'creation', 'modified'] 
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get items.' };
    }
    const services: Service[] = (result.data as any[]).map(transformErpItemToAppService);
    return { success: true, data: services };
}

export async function getServiceFromErpNextByName({ sid, serviceName }: { sid: string; serviceName: string; }): Promise<{ success: boolean; data?: Service; error?: string; }> {
    const result = await fetchFromErpNext<any>({ 
        sid, 
        doctype: 'Item', 
        docname: serviceName,
        fields: ['name', 'item_code', 'item_name', 'item_group', 'description', 'website_description', 'image', 'disabled', 'standard_rate', 'tags', 'service_url', 'creation', 'modified'] 
    });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get item.' };
    }
    const service: Service = transformErpItemToAppService(result.data);
    return { success: true, data: service };
}

function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function transformFormToErpItem(data: ServiceFormValues): any {
    return {
        item_code: slugify(data.title),
        item_name: data.title,
        item_group: data.categoryId, 
        description: data.shortDescription,
        website_description: data.longDescription,
        disabled: data.status === 'inactive' ? 1 : 0,
        image: data.imageUrl, 
        is_stock_item: 0, 
        service_url: data.serviceUrl || '',
        tags: data.tags,
    };
}

export async function createServiceInErpNext({ sid, serviceData }: { sid: string, serviceData: ServiceFormValues }) {
    try {
        const erpData = transformFormToErpItem(serviceData);

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

export async function updateServiceInErpNext({ sid, serviceName, serviceData }: { sid: string, serviceName: string, serviceData: ServiceFormValues }) {
    try {
        const erpData = transformFormToErpItem(serviceData);
        
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
