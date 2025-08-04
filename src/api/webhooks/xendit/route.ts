
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrderByOrderIdFromFirestore, updateOrderStatusInFirestore } from '@/lib/firebase/firestoreOrders';
import { createPaymentEntry } from '@/lib/actions/erpnext/sales-invoice.actions';
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

    const { id: xenditInvoiceId, external_id, status: xenditStatus, payment_channel, paid_amount } = payload;

    if (!external_id) {
      console.error('Webhook payload missing external_id.');
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    // Differentiate flow based on external_id prefix
    if (external_id.startsWith('rio-order-')) {
      // B2C Flow (from user checkout) - This is deprecated and should be migrated to ERPNext flow
      console.warn(`Received legacy B2C webhook for ${external_id}. This flow should be migrated.`);
      await handleB2CFlow(external_id, xenditStatus);
    } else if (external_id.includes('SINV-')) { 
      // B2B Flow (from admin-created Sales Invoice)
      await handleB2BFlow(external_id, xenditStatus, payment_channel || payload.payment_method || 'Unknown', paid_amount);
    } else {
      console.warn(`Webhook for unrecognized external_id format: ${external_id}`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing Xendit webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// Add OPTIONS and HEAD handlers to satisfy potential preflight checks
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS, HEAD',
    },
  });
}

export async function HEAD() {
   return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS, HEAD',
    },
  });
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

async function handleB2BFlow(invoiceName: string, xenditStatus: string, paymentMethod: string, paidAmount?: number) {
  if (xenditStatus.toUpperCase() !== 'PAID') {
    console.log(`Ignoring non-PAID status "${xenditStatus}" for B2B invoice ${invoiceName}.`);
    return;
  }

  if (!ERPNEXT_ADMIN_SID) {
    console.error("ERPNEXT_ADMIN_SID is not configured. Cannot process B2B webhook.");
    return;
  }
  
  // 1. Create a Payment Entry in ERPNext to mark the invoice as paid
  const paymentResult = await createPaymentEntry({
    sid: ERPNEXT_ADMIN_SID,
    invoiceName: invoiceName,
    paymentAmount: paidAmount,
  });

  if (!paymentResult.success) {
    console.error(`Failed to create Payment Entry for Sales Invoice ${invoiceName}. Error: ${paymentResult.error}`);
    // We stop here because the core financial transaction failed in ERPNext.
    return;
  }
  console.log(`Successfully created Payment Entry for Sales Invoice ${invoiceName}. Invoice is now Paid.`);


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
    try {
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
    } catch (emailError: any) {
        console.error(`Failed to send confirmation email for project ${project.name}:`, emailError.message);
    }
  } else {
    console.warn(`No email found for customer ${project.customer}. Cannot send confirmation email.`);
  }
}
