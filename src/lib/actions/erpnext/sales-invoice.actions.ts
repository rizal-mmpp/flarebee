
'use server';

import type { Order, PurchasedTemplateItem } from '../../types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

async function submitDoc(doc: any, sid: string | null): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json',
  };
  if (sid) {
    headers['Cookie'] = `sid=${sid}`;
  } else if (process.env.ERPNEXT_ADMIN_API_KEY && process.env.ERPNEXT_ADMIN_API_SECRET) {
    headers['Authorization'] = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
  } else {
    throw new Error('No authentication method available for submitDoc.');
  }

  const response = await fetch(`${ERPNEXT_API_URL}/api/method/frappe.desk.form.save.savedocs`, {
    method: 'POST',
    headers,
    body: `doc=${encodeURIComponent(JSON.stringify(doc))}&action=Submit`,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Failed to submit document.');
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
        const payload = { doctype: "Custom Field", dt: "Sales Invoice", ...field };
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Custom Field`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
           const errorData = await response.json();
           if(errorData?.exception?.includes("already exists")) {
              // Ignore if field already exists
              console.log(`Custom field '${field.fieldname}' already exists in 'Sales Invoice'. Skipping.`);
           } else {
              throw new Error(`Failed to add custom field '${field.fieldname}' to 'Sales Invoice': ${errorData.exception}`);
           }
        } else {
           console.log(`Successfully added or verified custom field '${field.fieldname}' to 'Sales Invoice'.`);
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
        paymentGateway: item.custom_payment_gateway,
        createdAt: item.posting_date,
        updatedAt: item.modified,
        xenditPaymentStatus: item.status, 
        xenditInvoiceUrl: item.xendit_invoice_url, 
        xenditInvoiceId: item.xendit_invoice_id,
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
    const result = await fetchFromErpNext<any>({ 
        sid, 
        doctype: 'Sales Invoice', 
        docname: orderId,
        fields: ['*']
    });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Sales Invoice.' };
    }
    const order: Order = transformErpSalesInvoiceToAppOrder(result.data);
    return { success: true, data: order };
}


export async function createPaymentEntry({ sid, invoiceName, paymentAmount, paymentMethod }: { sid: string | null; invoiceName: string; paymentAmount?: number; paymentMethod?: string; }): Promise<{ success: boolean; error?: string }> {
  try {
    const invoiceResult = await fetchFromErpNext<any>({ sid, doctype: 'Sales Invoice', docname: invoiceName, fields: ['*'] });
    if (!invoiceResult.success || !invoiceResult.data) {
        throw new Error(`Could not fetch Sales Invoice ${invoiceName} to create payment.`);
    }
    const invoiceDoc = invoiceResult.data;

    const finalPaymentAmount = paymentAmount !== undefined ? paymentAmount : invoiceDoc.outstanding_amount;
    
    const paymentEntryPayload = {
        doctype: 'Payment Entry',
        payment_type: 'Receive',
        party_type: 'Customer',
        party: invoiceDoc.customer,
        company: invoiceDoc.company,
        posting_date: new Date().toISOString().split('T')[0],
        paid_from: invoiceDoc.debit_to,
        paid_to: invoiceDoc.account_for_change_amount || "Cash - RIO",
        paid_amount: finalPaymentAmount,
        received_amount: finalPaymentAmount,
        mode_of_payment: `Xendit - ${paymentMethod || 'Unknown'}`,
        references: [{
            reference_doctype: 'Sales Invoice',
            reference_name: invoiceName,
            total_amount: invoiceDoc.total,
            outstanding_amount: invoiceDoc.outstanding_amount,
            allocated_amount: finalPaymentAmount,
        }]
    };
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (sid) {
      headers['Cookie'] = `sid=${sid}`;
    } else {
      headers['Authorization'] = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
    }

    const createResponse = await fetch(`${ERPNEXT_API_URL}/api/resource/Payment Entry`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paymentEntryPayload),
    });

    if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Failed to create draft Payment Entry.');
    }
    const savedDoc = (await createResponse.json()).data;
    
    await submitDoc(savedDoc, sid);

    return { success: true };
  } catch (error: any) {
    console.error("Error creating and submitting Payment Entry:", error);
    return { success: false, error: error.message };
  }
}

interface UpdatePaymentDetailsArgs {
  sid: string | null;
  invoiceName: string;
  paymentDetails: {
    xendit_invoice_id: string;
    custom_payment_gateway?: string;
  };
}

export async function updateSalesInvoicePaymentDetails({
  sid,
  invoiceName,
  paymentDetails,
}: UpdatePaymentDetailsArgs): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (sid) {
      headers['Cookie'] = `sid=${sid}`;
    } else {
      headers['Authorization'] = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
    }

    const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Sales Invoice/${invoiceName}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(paymentDetails),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Failed to update Sales Invoice payment details.');
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateSalesInvoicePaymentDetails:", error);
    return { success: false, error: error.message };
  }
}
