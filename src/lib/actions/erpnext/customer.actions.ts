
'use server';

import type { Customer } from '@/lib/types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface NewCustomerData {
    customer_name: string;
    customer_type: 'Company' | 'Individual';
    email_id?: string;
    mobile_no?: string;
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
        fields: ['name', 'customer_name', 'customer_type', 'email_id', 'mobile_no'] 
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get customers.' };
    }
    
    const customers: Customer[] = (result.data as any[]).map(item => ({
        name: item.name,
        customer_name: item.customer_name,
        customer_type: item.customer_type,
        email_id: item.email_id,
        mobile_no: item.mobile_no,
    }));

    return { success: true, data: customers };
}


export async function getCustomerByName({ sid, customerName }: { sid: string; customerName: string; }): Promise<{ success: boolean; data?: Customer; error?: string; }> {
    const result = await fetchFromErpNext<any>({ 
        sid, 
        doctype: 'Customer', 
        docname: customerName,
    });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Customer.' };
    }
    
    const customer: Customer = {
        name: result.data.name,
        customer_name: result.data.customer_name,
        customer_type: result.data.customer_type,
        email_id: result.data.email_id,
        mobile_no: result.data.mobile_no,
    };

    return { success: true, data: customer };
}

export async function getContactForCustomer({ sid, customerName }: { sid: string; customerName: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const filters = [['Dynamic Link', 'link_doctype', '=', 'Customer'], ['Dynamic Link', 'link_name', '=', customerName]];
    const result = await fetchFromErpNext<any[]>({
      sid,
      doctype: 'Contact',
      fields: ['*'], // Fetch all fields to get child tables
      filters,
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return { success: false, error: result.error || 'Contact not found for this customer.' };
    }
    return { success: true, data: result.data[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContactDetails({ sid, contactId, newEmail, newPhone }: { sid: string; contactId: string; newEmail?: string; newPhone?: string; }): Promise<{ success: boolean; error?: string }> {
  if (!sid || !contactId) return { success: false, error: 'Session ID and Contact ID are required.' };
  
  try {
    // 1. Fetch the full existing contact document
    const contactResult = await fetchFromErpNext<any>({ sid, doctype: 'Contact', docname: contactId, fields: ['*'] });
    if (!contactResult.success || !contactResult.data) {
      return { success: false, error: 'Could not fetch existing contact details.' };
    }
    const contactDoc = contactResult.data;

    // 2. Handle Email Update
    if (newEmail) {
      contactDoc.email_ids = contactDoc.email_ids || [];
      // Unset all other emails as primary
      contactDoc.email_ids.forEach((e: any) => e.is_primary = 0);
      
      const existingEmail = contactDoc.email_ids.find((e: any) => e.email_id === newEmail);
      if (existingEmail) {
        existingEmail.is_primary = 1; // Mark existing as primary
      } else {
        contactDoc.email_ids.push({ // Add new email as primary
          email_id: newEmail,
          is_primary: 1,
        });
      }
      // Update the main email_id field on the Contact as well
      contactDoc.email_id = newEmail;
    }

    // 3. Handle Phone Update
    if (newPhone) {
      contactDoc.phone_nos = contactDoc.phone_nos || [];
      // Unset all other phones as primary
      contactDoc.phone_nos.forEach((p: any) => p.is_primary_mobile = 0);

      const existingPhone = contactDoc.phone_nos.find((p: any) => p.phone === newPhone);
      if (existingPhone) {
        existingPhone.is_primary_mobile = 1; // Mark existing as primary
      } else {
        contactDoc.phone_nos.push({ // Add new phone as primary
          phone: newPhone,
          is_primary_mobile: 1,
        });
      }
       // Update the main mobile_no field on the Contact as well
      contactDoc.mobile_no = newPhone;
    }

    // 4. Update the entire document
    const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Contact/${contactId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
      body: JSON.stringify(contactDoc),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Failed to update Contact in ERPNext.');
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateContactDetails:", error);
    return { success: false, error: error.message };
  }
}
