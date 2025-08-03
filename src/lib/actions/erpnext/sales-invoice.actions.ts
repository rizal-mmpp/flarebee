
'use server';

import type { Order, PurchasedTemplateItem } from '../../types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

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
        paymentGateway: item.payment_gateway || 'ERPNext',
        createdAt: item.posting_date,
        updatedAt: item.modified,
        xenditPaymentStatus: item.status, 
        xenditInvoiceUrl: item.xendit_invoice_url, // Added
    };
}

export async function getOrdersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: Order[]; error?: string; }> {
     const result = await fetchFromErpNext<any[]>({ 
         sid, 
         doctype: 'Sales Invoice', 
         fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'currency', 'status', 'xendit_invoice_url'] 
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

export async function updateSalesInvoiceStatus(sid: string, invoiceName: string, status: string, xenditPaymentMethod: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Sales Invoice/${invoiceName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify({ 
                status,
                custom_payment_gateway: xenditPaymentMethod // Update custom field for payment method
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Failed to update Sales Invoice status.');
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
