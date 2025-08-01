
'use server';

import type { Customer } from '@/lib/types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface NewCustomerData {
    customer_name: string;
    customer_type: 'Company' | 'Individual';
    email_id?: string;
}

export async function createCustomerInErpNext({ sid, customerData }: { sid: string; customerData: NewCustomerData }): Promise<{ success: boolean; name?: string; error?: string }> {
    if (!ERPNEXT_API_URL) return { success: false, error: 'ERPNext API URL is not configured.' };
    if (!sid) return { success: false, error: 'Session ID (sid) is required.' };

    try {
        if(customerData.email_id) {
            const emailExistsResult = await fetchFromErpNext<{name: string}[]>({
                sid,
                doctype: 'Customer',
                filters: [['email_id', '=', customerData.email_id]],
                fields: ['name']
            });
            
            if (emailExistsResult.success && emailExistsResult.data?.length) {
                return { success: false, error: `A customer with email "${customerData.email_id}" already exists.` };
            }
        }

        const dataToPost = {
            ...customerData,
            customer_group: 'All Customer Groups', // Default group
            territory: 'All Territories', // Default territory
        };

        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': `sid=${sid}`,
            },
            body: JSON.stringify(dataToPost),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData.exception || responseData._server_messages?.[0] || 'Failed to create customer in ERPNext.';
            throw new Error(errorMessage);
        }

        return { success: true, name: responseData.data.name };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getCustomersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Customer[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({ 
        sid, 
        doctype: 'Customer', 
        fields: ['name', 'customer_name', 'customer_type', 'email_id'] 
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get customers.' };
    }
    
    // Transform the raw data to match our Customer type
    const customers: Customer[] = (result.data as any[]).map(item => ({
        name: item.name,
        customer_name: item.customer_name,
        customer_type: item.customer_type,
        email_id: item.email_id
    }));

    return { success: true, data: customers };
}
