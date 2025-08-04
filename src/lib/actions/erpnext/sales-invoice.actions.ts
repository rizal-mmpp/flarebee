
'use server';

import type { Order, PurchasedTemplateItem } from '../../types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

async function postRequest(endpoint: string, data: any, sid: string | null) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (sid) {
    headers['Cookie'] = `sid=${sid}`;
  } else {
    headers['Authorization'] = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
  }

  const response = await fetch(`${ERPNEXT_API_URL}${endpoint}`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ERPNext API Error for endpoint ${endpoint}:`, errorText);
    try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Unknown ERPNext Error');
    } catch(e) {
        throw new Error(`Failed with status ${response.status}: ${errorText}`);
    }
  }
  return response.json();
}

async function postEncodedRequest(endpoint: string, body: string, sid: string | null) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json',
  };
  if (sid) {
    headers['Cookie'] = `sid=${sid}`;
  } else {
    headers['Authorization'] = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
  }

  const response = await fetch(`${ERPNEXT_API_URL}${endpoint}`, {
    method: 'POST',
    headers: headers,
    body: body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.exception || errorData._server_messages?.[0] || `Failed to post to ${endpoint}.`);
  }
  return response.json();
}

async function saveDoc(doc: any, sid: string | null): Promise<any> {
    const body = `doc=${encodeURIComponent(JSON.stringify(doc))}&action=Save`;
    return postEncodedRequest('/api/method/frappe.desk.form.save.savedocs', body, sid);
}

async function submitDoc(doc: any, sid: string | null): Promise<any> {
  const body = `doc=${encodeURIComponent(JSON.stringify(doc))}&action=Submit`;
  return postEncodedRequest('/api/method/frappe.desk.form.save.savedocs', body, sid);
}

const customFieldsForSalesInvoice = [
    { fieldname: 'xendit_invoice_id', fieldtype: 'Data', label: 'Xendit Invoice ID', insert_after: 'title' },
    { fieldname: 'xendit_invoice_url', fieldtype: 'Data', label: 'Xendit Invoice URL', insert_after: 'xendit_invoice_id' },
    { fieldname: 'custom_payment_gateway', fieldtype: 'Data', label: 'Payment Method (Custom)', insert_after: 'xendit_invoice_url' },
];

export async function ensureSalesInvoiceCustomFieldsExist(sid: string): Promise<{ success: boolean; error?: string }> {
  try {
    for (const field of customFieldsForSalesInvoice) {
        const payload = { doctype: "Custom Field", dt: "Sales Invoice", ...field };
        try {
            await postRequest('/api/resource/Custom Field', payload, sid);
        } catch (error: any) {
            if (error.message && (error.message.includes('already exists') || error.message.includes('exists'))) {
                // Ignore if field already exists
            } else {
                throw new Error(`Failed to add custom field '${field.fieldname}' to 'Sales Invoice': ${error.message}`);
            }
        }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error in ensureSalesInvoiceCustomFieldsExist:", error);
    return { success: false, error: error.message };
  }
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
        userEmail: item.customer_name || 'N/A', 
        orderId: item.name,
        items: items,
        totalAmount: item.grand_total,
        currency: item.currency || 'IDR',
        status: item.status?.toLowerCase() || 'pending',
        paymentGateway: item.custom_payment_gateway || 'ERPNext',
        createdAt: item.posting_date,
        updatedAt: item.modified,
        xenditPaymentStatus: item.status, 
        xenditInvoiceUrl: item.xendit_invoice_url, 
    };
}

export async function getOrdersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Order[]; error?: string; }> {
     const result = await fetchFromErpNext<any[]>({ 
         sid, 
         doctype: 'Sales Invoice', 
         fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'currency', 'status', 'xendit_invoice_url', 'custom_payment_gateway'] 
    });

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

export async function createPaymentEntry({ sid, invoiceName, paymentAmount, paymentMethod }: { sid: string | null; invoiceName: string; paymentAmount?: number; paymentMethod?: string; }): Promise<{ success: boolean; error?: string }> {
  try {
    const invoiceResult = await fetchFromErpNext<any>({ sid, doctype: 'Sales Invoice', docname: invoiceName });
    if (!invoiceResult.success || !invoiceResult.data) {
      throw new Error(`Could not fetch Sales Invoice ${invoiceName}: ${invoiceResult.error}`);
    }
    const invoiceDoc = invoiceResult.data;
    if (invoiceDoc.status === 'Paid') {
      console.log(`Invoice ${invoiceName} is already marked as Paid. Skipping payment entry.`);
      return { success: true };
    }
    if (invoiceDoc.outstanding_amount === 0) {
      console.log(`Invoice ${invoiceName} has no outstanding amount. Skipping payment entry.`);
      return { success: true };
    }

    // Step 1: Ask ERPNext to generate the pre-filled Payment Entry document
    const getPaymentEntryResponse = await postEncodedRequest(
        '/api/method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry',
        `dt=Sales+Invoice&dn=${invoiceName}`,
        sid
    );
    const paymentEntryDoc = getPaymentEntryResponse.message;
    
    // Step 2: Modify the pre-filled doc with our data
    paymentEntryDoc.mode_of_payment = `Xendit - ${paymentMethod || 'Other'}`;
    if (paymentAmount !== undefined) {
      paymentEntryDoc.paid_amount = paymentAmount;
      paymentEntryDoc.received_amount = paymentAmount;
      if (paymentEntryDoc.references && paymentEntryDoc.references.length > 0) {
        paymentEntryDoc.references[0].allocated_amount = paymentAmount;
      }
    }
    
    // Step 3: Save the modified draft document
    const savedDocResponse = await saveDoc(paymentEntryDoc, sid);
    const savedDoc = savedDocResponse.docs[0];

    // Step 4: Submit the saved document
    await submitDoc(savedDoc, sid);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error creating Payment Entry:", error);
    return { success: false, error: error.message };
  }
}
