
'use server';

import type { Order, PurchasedTemplateItem } from '../../types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

async function postRequest(endpoint: string, data: any, sid: string) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
  
  const response = await fetch(`${ERPNEXT_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
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

const customFieldsForSalesInvoice = [
    { fieldname: 'xendit_invoice_id', fieldtype: 'Data', label: 'Xendit Invoice ID', insert_after: 'title' },
    { fieldname: 'xendit_invoice_url', fieldtype: 'Data', label: 'Xendit Invoice URL', insert_after: 'xendit_invoice_id' },
    { fieldname: 'custom_payment_gateway', fieldtype: 'Data', label: 'Payment Method (Custom)', insert_after: 'xendit_invoice_url' },
];

export async function ensureSalesInvoiceCustomFieldsExist(sid: string): Promise<{ success: boolean; error?: string }> {
  try {
    for (const field of customFieldsForSalesInvoice) {
        const payload = {
            doctype: "Custom Field",
            dt: "Sales Invoice", 
            ...field
        };
        
        try {
            await postRequest('/api/resource/Custom Field', payload, sid);
            console.log(`Successfully added or verified custom field '${field.fieldname}' to 'Sales Invoice'.`);
        } catch (error: any) {
            if (error.message && (error.message.includes('already exists') || error.message.includes('exists'))) {
                console.log(`Custom field '${field.fieldname}' already exists in 'Sales Invoice'. Skipping.`);
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

export async function getSalesInvoiceByXenditId(sid: string, xenditInvoiceId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const filters = [['xendit_invoice_id', '=', xenditInvoiceId]];
    const result = await fetchFromErpNext<any[]>({
      sid,
      doctype: 'Sales Invoice',
      fields: ['name', 'customer'],
      filters,
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return { success: false, error: result.error || 'Sales Invoice not found for this Xendit ID.' };
    }

    return { success: true, data: result.data[0] };
}

export async function createPaymentEntry({ sid, invoiceName, paymentAmount }: { sid: string; invoiceName: string; paymentAmount?: number; }): Promise<{ success: boolean; error?: string }> {
  try {
    const invoiceResult = await fetchFromErpNext<any>({ sid, doctype: 'Sales Invoice', docname: invoiceName });
    if (!invoiceResult.success || !invoiceResult.data) {
      throw new Error(`Could not fetch Sales Invoice ${invoiceName}: ${invoiceResult.error}`);
    }
    const invoiceDoc = invoiceResult.data;

    // Check if the invoice is already paid to prevent duplicate payment entries
    if (invoiceDoc.status === 'Paid') {
        console.log(`Invoice ${invoiceName} is already marked as Paid. Skipping payment entry.`);
        return { success: true };
    }
    
    // Default account can be fetched from Company Doctype or hardcoded for simplicity
    const modeOfPayment = 'Xendit'; // Needs to be an existing Mode of Payment in ERPNext
    const company = invoiceDoc.company;
    
    // Fetch company details to get the default bank account
    const companyResult = await fetchFromErpNext<any>({ sid, doctype: 'Company', docname: company });
    if (!companyResult.success || !companyResult.data) {
      throw new Error(`Could not fetch company details for ${company}`);
    }
    const defaultBankAccount = companyResult.data.default_bank_account;
    if (!defaultBankAccount) {
        throw new Error(`Default bank account is not set for company ${company}.`);
    }

    const paymentPayload = {
      doctype: 'Payment Entry',
      payment_type: 'Receive',
      mode_of_payment: modeOfPayment,
      party_type: 'Customer',
      party: invoiceDoc.customer,
      paid_amount: paymentAmount ?? invoiceDoc.outstanding_amount,
      received_amount: paymentAmount ?? invoiceDoc.outstanding_amount,
      company: company,
      bank_account: defaultBankAccount, 
      references: [{
        reference_doctype: 'Sales Invoice',
        reference_name: invoiceName,
        allocated_amount: paymentAmount ?? invoiceDoc.outstanding_amount,
      }],
      docstatus: 1, // Submit the payment entry
    };

    await postRequest('/api/resource/Payment Entry', paymentPayload, sid);

    return { success: true };
  } catch (error: any) {
    console.error("Error creating Payment Entry:", error);
    return { success: false, error: error.message };
  }
}
