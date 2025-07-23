
'use server';

import type { Service } from '../../types';
import type { ServiceFormValues } from '@/components/sections/admin/ServiceFormTypes';
import { uploadFileToVercelBlob } from '../vercelBlob.actions';
import { fetchFromErpNext, ERPNEXT_API_URL } from './utils';

function transformErpItemToAppService(item: any): Service {
    const category = { id: item.item_group, name: item.item_group, slug: item.item_group.toLowerCase().replace(/ /g, '-') };
    
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
            fixedPriceDetails: { price: item.standard_rate || 0 }
        }
    };
}

export async function getServicesFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Service[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({ 
        sid, 
        doctype: 'Item', 
        fields: ['name', 'item_code', 'item_name', 'item_group', 'description', 'image', 'disabled', 'standard_rate'] 
    });

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
    return {
        item_code: slugify(data.title),
        item_name: data.title,
        item_group: data.categoryId, // Directly use categoryId which now holds the Item Group name
        description: data.shortDescription,
        website_description: data.longDescription,
        disabled: data.status === 'inactive' ? 1 : 0,
        image: imageUrl, 
        is_stock_item: 0, 
        standard_rate: data.pricing?.fixedPriceDetails?.price ?? 0,
        service_url: data.serviceUrl || '',
        tags: data.tags,
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
