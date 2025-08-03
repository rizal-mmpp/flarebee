
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrderByOrderIdFromFirestore, updateOrderStatusInFirestore } from '@/lib/firebase/firestoreOrders';
import { getSalesInvoiceByXenditId, updateSalesInvoiceStatus } from '@/lib/actions/erpnext/sales-invoice.actions';
import { getProjectByInvoiceId, updateProject } from '@/lib/actions/erpnext/project.actions';
import { sendEmail } from '@/lib/services/email.service';
import type { Order } from '@/lib/types';

interface XenditWebhookPayload {
  id: string; // Xendit Invoice ID
  external_id: string; // Our orderId (e.g., rio-order-..., SINV-...)
  status: 'PAID' | 'EXPIRED' | 'PENDING' | string;
  payment_method?: string; // Used in v1
  payment_channel?: string; // Used in v2
  payment_destination?: string;
  paid_amount?: number;
  paid_at?: string;
  // ... other fields from Xendit
}

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;
const ERPNEXT_ADMIN_SID = process.env.ERPNEXT_ADMIN_SID; // An SID with admin rights for backend operations

export async function POST(request: NextRequest) {
  const callbackToken = request.headers.get('x-callback-token');
  const expectedToken = process.env.XENDIT_CALLBACK_VERIFICATION_TOKEN;

  if (!expectedToken) {
    console.error('XENDIT_CALLBACK_VERIFICATION_TOKEN is not set in environment variables.');
    return NextResponse.json({ error: 'Webhook configuration error.' }, { status: 500 });
  }

  if (callbackToken !== expectedToken) {
    console.warn('Invalid Xendit callback token received.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as XenditWebhookPayload;
    console.log('Xendit webhook payload received:', JSON.stringify(payload, null, 2));

    const { id: xenditInvoiceId, external_id, status: xenditStatus, payment_channel } = payload;

    if (!external_id) {
      console.error('Webhook payload missing external_id.');
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    // Differentiate flow based on external_id prefix
    if (external_id.startsWith('rio-order-')) {
      // B2C Flow (from user checkout)
      await handleB2CFlow(external_id, xenditStatus);
    } else if (external_id.startsWith('SINV-')) {
      // B2B Flow (from admin-created Sales Invoice)
      await handleB2BFlow(external_id, xenditStatus, payment_channel || payload.payment_method || 'Unknown');
    } else {
      console.warn(`Webhook for unrecognized external_id format: ${external_id}`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing Xendit webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

async function handleB2CFlow(orderId: string, xenditStatus: string) {
  const order = await getOrderByOrderIdFromFirestore(orderId);
  if (!order) {
    console.warn(`B2C Order not found for external_id: ${orderId}`);
    return;
  }

  let newFlarebeeStatus: Order['status'];
  switch (xenditStatus.toUpperCase()) {
    case 'PAID':
      newFlarebeeStatus = 'completed';
      break;
    case 'EXPIRED':
      newFlarebeeStatus = 'expired';
      break;
    case 'FAILED':
      newFlarebeeStatus = 'failed';
      break;
    default:
      console.log(`Unhandled Xendit status for B2C order: ${xenditStatus}`);
      return;
  }
  
  if (order.status !== newFlarebeeStatus) {
    await updateOrderStatusInFirestore(order.id, newFlarebeeStatus, xenditStatus);
    console.log(`B2C Order ${order.id} status updated to ${newFlarebeeStatus}`);
  }
}

async function handleB2BFlow(invoiceName: string, xenditStatus: string, paymentMethod: string) {
  if (xenditStatus.toUpperCase() !== 'PAID') {
    console.log(`Ignoring non-PAID status "${xenditStatus}" for B2B invoice ${invoiceName}.`);
    return;
  }

  if (!ERPNEXT_ADMIN_SID) {
    console.error("ERPNEXT_ADMIN_SID is not configured. Cannot process B2B webhook.");
    // Do not throw, as Xendit would retry. Log the error.
    return;
  }

  // 1. Update Sales Invoice status in ERPNext
  await updateSalesInvoiceStatus(ERPNEXT_ADMIN_SID, invoiceName, 'Paid', paymentMethod);

  // 2. Find the associated Project
  const projectResult = await getProjectByInvoiceId(ERPNEXT_ADMIN_SID, invoiceName);
  if (!projectResult.success || !projectResult.data) {
    console.error(`Project not found for Sales Invoice ${invoiceName}. Cannot update project status.`);
    return;
  }
  const project = projectResult.data;

  // 3. Update Project status to "In Progress"
  await updateProject({ sid: ERPNEXT_ADMIN_SID, projectName: project.name, projectData: { status: 'In Progress' } });
  
  console.log(`Project ${project.name} status updated to "In Progress".`);
  
  // 4. Send confirmation email to customer
  if (project.customer_email) {
    await sendEmail({
        to: project.customer_email,
        subject: `Payment Received for Project: ${project.project_name}`,
        html: `
            <h1>Thank You For Your Payment</h1>
            <p>Dear ${project.customer},</p>
            <p>We have successfully received your payment for project: <strong>${project.project_name}</strong>.</p>
            <p>We have started working on it and will keep you updated on the progress.</p>
            <p>Thank you!</p>
        `,
    });
    console.log(`Payment confirmation email sent to ${project.customer_email}`);
  } else {
    console.warn(`No email found for customer ${project.customer}. Cannot send confirmation email.`);
  }
}

// Function to find project by invoice ID (needs to be added to project.actions.ts)
async function getProjectByInvoiceId(sid: string, invoiceId: string): Promise<{ success: boolean; data?: { name: string, project_name: string, customer: string, customer_email?: string }; error?: string }> {
  const filters = [['sales_invoice', '=', invoiceId]];
  const result = await fetchFromErpNext<{ name: string; project_name: string; customer: string; }[]>({
    sid,
    doctype: 'Project',
    fields: ['name', 'project_name', 'customer'],
    filters,
    limit: 1,
  });

  if (!result.success || !result.data || result.data.length === 0) {
    return { success: false, error: result.error || 'Project not found for this Sales Invoice ID.' };
  }
  
  const project = result.data[0];

  // Fetch customer email
  const customerResult = await fetchFromErpNext<any>({ sid, doctype: 'Customer', docname: project.customer, fields: ['email_id'] });
  const customerEmail = customerResult.success ? customerResult.data.email_id : undefined;

  return { success: true, data: { ...project, customer_email: customerEmail } };
}

