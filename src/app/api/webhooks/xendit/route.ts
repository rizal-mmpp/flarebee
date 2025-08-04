
'use server';

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
  console.log('[Webhook] Received new request.');
  const callbackToken = request.headers.get('x-callback-token');
  const expectedToken = process.env.XENDIT_CALLBACK_VERIFICATION_TOKEN;

  if (!expectedToken) {
    console.error('[Webhook] CRITICAL: XENDIT_CALLBACK_VERIFICATION_TOKEN is not set.');
    return NextResponse.json({ error: 'Webhook configuration error.' }, { status: 500 });
  }

  if (callbackToken !== expectedToken) {
    console.warn('[Webhook] Unauthorized: Invalid callback token received.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as XenditWebhookPayload;
    console.log('[Webhook] Payload received and parsed successfully:', JSON.stringify(payload, null, 2));

    const { external_id, status: xenditStatus, payment_channel, paid_amount } = payload;

    if (!external_id) {
      console.error('[Webhook] Validation Error: Payload missing external_id.');
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    if (external_id.startsWith('rio-order-')) {
      console.log(`[Webhook] Handling legacy B2C flow for ${external_id}.`);
      await handleB2CFlow(external_id, xenditStatus);
    } else if (external_id.includes('SINV-')) { 
      console.log(`[Webhook] Handling B2B Sales Invoice flow for ${external_id}.`);
      await handleB2BFlow(external_id, xenditStatus, payment_channel || payload.payment_method || 'Unknown', paid_amount);
    } else {
      console.warn(`[Webhook] Unrecognized external_id format: ${external_id}`);
    }

    console.log(`[Webhook] Processed successfully for external_id: ${external_id}`);
    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook] Internal Server Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS, HEAD' } });
}

export async function HEAD() {
   return new NextResponse(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS, HEAD' } });
}

async function handleB2CFlow(orderId: string, xenditStatus: string) {
  // B2C flow is deprecated, minimal logging
  const order = await getOrderByOrderIdFromFirestore(orderId);
  if (!order) {
    console.warn(`[Webhook-B2C] Order not found for external_id: ${orderId}`);
    return;
  }
  let newFlarebeeStatus: Order['status'];
  switch (xenditStatus.toUpperCase()) {
    case 'PAID': newFlarebeeStatus = 'completed'; break;
    case 'EXPIRED': newFlarebeeStatus = 'expired'; break;
    case 'FAILED': newFlarebeeStatus = 'failed'; break;
    default: return;
  }
  if (order.status !== newFlarebeeStatus) {
    await updateOrderStatusInFirestore(order.id, newFlarebeeStatus, xenditStatus);
  }
}

async function handleB2BFlow(invoiceName: string, xenditStatus: string, paymentMethod: string, paidAmount?: number) {
  console.log(`[B2B Flow] Starting for invoice: ${invoiceName}, Status: ${xenditStatus}`);
  if (xenditStatus.toUpperCase() !== 'PAID') {
    console.log(`[B2B Flow] Ignoring non-PAID status "${xenditStatus}" for invoice ${invoiceName}.`);
    return;
  }

  if (!ERPNEXT_ADMIN_SID) {
    console.error("[B2B Flow] CRITICAL: ERPNEXT_ADMIN_SID is not configured. Cannot process webhook.");
    return;
  }
  
  console.log(`[B2B Flow] Step 1: Creating Payment Entry for invoice ${invoiceName}.`);
  const paymentResult = await createPaymentEntry({
    sid: ERPNEXT_ADMIN_SID,
    invoiceName: invoiceName,
    paymentAmount: paidAmount,
    paymentMethod: paymentMethod,
  });

  if (!paymentResult.success) {
    console.error(`[B2B Flow] FAILED Step 1: Could not create Payment Entry for ${invoiceName}. Error: ${paymentResult.error}`);
    return;
  }
  console.log(`[B2B Flow] SUCCESS Step 1: Payment Entry for ${invoiceName} created and submitted.`);

  console.log(`[B2B Flow] Step 2: Finding associated Project for invoice ${invoiceName}.`);
  const projectResult = await getProjectByInvoiceId(ERPNEXT_ADMIN_SID, invoiceName);
  if (!projectResult.success || !projectResult.data) {
    console.error(`[B2B Flow] FAILED Step 2: Project not found for invoice ${invoiceName}. Error: ${projectResult.error}`);
    return;
  }
  const project = projectResult.data;
  console.log(`[B2B Flow] SUCCESS Step 2: Found Project: ${project.name}`);

  console.log(`[B2B Flow] Step 3: Updating Project ${project.name} status to "In Progress".`);
  const updateResult = await updateProject({ sid: ERPNEXT_ADMIN_SID, projectName: project.name, projectData: { status: 'In Progress' } });
  if (!updateResult.success) {
      console.error(`[B2B Flow] FAILED Step 3: Could not update project status for ${project.name}. Error: ${updateResult.error}`);
  } else {
      console.log(`[B2B Flow] SUCCESS Step 3: Project ${project.name} status updated.`);
  }
  
  console.log(`[B2B Flow] Step 4: Sending confirmation email.`);
  if (project.customer_email) {
    try {
      await sendEmail({
          to: project.customer_email,
          subject: `Payment Received for Project: ${project.project_name}`,
          html: `<h1>Thank You For Your Payment</h1><p>Dear ${project.customer},</p><p>We have successfully received your payment for project: <strong>${project.project_name}</strong>.</p><p>We have started working on it and will keep you updated on the progress.</p><p>Thank you!</p>`,
      });
      console.log(`[B2B Flow] SUCCESS Step 4: Confirmation email sent to ${project.customer_email}.`);
    } catch (emailError: any) {
        console.error(`[B2B Flow] FAILED Step 4: Could not send confirmation email for project ${project.name}:`, emailError.message);
    }
  } else {
    console.warn(`[B2B Flow] SKIPPED Step 4: No email found for customer ${project.customer}. Cannot send email.`);
  }
  console.log(`[B2B Flow] Finished processing for invoice ${invoiceName}.`);
}
