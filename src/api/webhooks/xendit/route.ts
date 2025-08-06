
'use server';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrderByOrderIdFromFirestore, updateOrderStatusInFirestore } from '@/lib/firebase/firestoreOrders';
import { createPaymentEntry, updateSalesInvoicePaymentDetails } from '@/lib/actions/erpnext/sales-invoice.actions';
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


export async function POST(request: NextRequest) {
  const callbackToken = request.headers.get('x-callback-token');
  const expectedToken = process.env.XENDIT_CALLBACK_VERIFICATION_TOKEN;

  if (!expectedToken) {
    console.error('[Webhook] CRITICAL: XENDIT_CALLBACK_VERIFICATION_TOKEN is not set.');
    return NextResponse.json({ success: false, message: 'Webhook configuration error on server.' }, { status: 500 });
  }

  if (callbackToken !== expectedToken) {
    console.warn('[Webhook] Unauthorized: Invalid callback token received.');
    return NextResponse.json({ success: false, message: 'Unauthorized: Invalid callback token.' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as XenditWebhookPayload;
    console.log('[Webhook] Payload received and parsed:', JSON.stringify(payload, null, 2));

    const { external_id, id: xenditInvoiceId, status: xenditStatus, payment_channel, paid_amount } = payload;

    if (!external_id) {
      console.error('[Webhook] Validation Error: Payload missing external_id.');
      return NextResponse.json({ success: false, message: 'Missing external_id in payload.' }, { status: 400 });
    }

    if (external_id.startsWith('rio-order-')) {
      await handleB2CFlow(external_id, xenditStatus);
      return NextResponse.json({ success: true, message: 'Legacy B2C webhook processed.' }, { status: 200 });
    } else if (external_id.includes('SINV-')) {
      const result = await handleB2BFlow(external_id, xenditInvoiceId, xenditStatus, payment_channel || payload.payment_method || 'Unknown', paid_amount);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } else {
      console.warn(`[Webhook] Unrecognized external_id format: ${external_id}`);
      return NextResponse.json({ success: false, message: `Unrecognized external_id format: ${external_id}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Webhook] Internal Server Error:', error.message);
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS, HEAD' } }); }
export async function HEAD() { return new NextResponse(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS, HEAD' } }); }

async function handleB2CFlow(orderId: string, xenditStatus: string) {
  // This is a legacy flow, we can keep it simple.
  const order = await getOrderByOrderIdFromFirestore(orderId);
  if (!order) return;
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

async function handleB2BFlow(invoiceName: string, xenditInvoiceId: string, xenditStatus: string, paymentMethod: string, paidAmount?: number): Promise<{ success: boolean; message: string; details?: any }> {
  const logPrefix = `[B2B Flow - ${invoiceName}]`;
  console.log(`${logPrefix} Starting for status: ${xenditStatus}`);

  if (xenditStatus.toUpperCase() !== 'PAID') {
    return { success: true, message: `Ignoring non-PAID status "${xenditStatus}".` };
  }
  
  // Step 1: Create the Payment Entry to mark the invoice as paid.
  // This is the action that submits the Sales Invoice and changes its status to "Paid".
  console.log(`${logPrefix} Step 1: Creating Payment Entry.`);
  const paymentResult = await createPaymentEntry({
    sid: null, 
    invoiceName: invoiceName,
    paymentAmount: paidAmount,
    paymentMethod: paymentMethod,
  });

  if (!paymentResult.success) {
    const errorMsg = `Failed at Step 1: Could not create Payment Entry. Error: ${paymentResult.error}`;
    console.error(`${logPrefix} ${errorMsg}`);
    return { success: false, message: errorMsg };
  }
  console.log(`${logPrefix} SUCCESS Step 1: Payment Entry created and submitted.`);
  
  // The Sales Invoice is now submitted and its status is 'Paid'.
  // Further direct updates to most fields are locked.
  // We can still update it via custom scripts/methods in ERPNext if needed in the future.
  
  // Step 2: Find the associated Project.
  console.log(`${logPrefix} Step 2: Finding associated Project.`);
  const projectResult = await getProjectByInvoiceId(null, invoiceName);
  if (!projectResult.success || !projectResult.data) {
    const errorMsg = `Failed at Step 2: Project not found for invoice. Error: ${projectResult.error || 'Not found.'}`;
    console.error(`${logPrefix} ${errorMsg}`);
    // Note: The payment is recorded, but the project status won't be updated.
    // We should still return success for the webhook, but log this issue.
    return { success: true, message: `Warning: Payment recorded, but project update failed. ${errorMsg}` };
  }
  const project = projectResult.data;
  console.log(`${logPrefix} SUCCESS Step 2: Found Project: ${project.name}`);

  // Step 3: Update the project status.
  console.log(`${logPrefix} Step 3: Updating Project ${project.name} status to "In Progress".`);
  const updateResult = await updateProject({ sid: null, projectName: project.name, projectData: { status: 'In Progress' } });
  if (!updateResult.success) {
      const errorMsg = `Failed at Step 3: Could not update project status. Error: ${updateResult.error}`;
      console.error(`${logPrefix} ${errorMsg}`);
      // Log and continue, as the payment itself was successful.
  } else {
      console.log(`${logPrefix} SUCCESS Step 3: Project status updated.`);
  }
  
  // Step 4: Send the confirmation email.
  console.log(`${logPrefix} Step 4: Sending confirmation email.`);
  if (project.customer_email) {
    try {
      await sendEmail({
          to: project.customer_email,
          subject: `Payment Received for Project: ${project.project_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                <h1 style="color: #1A202C; margin: 0; font-size: 24px;">Payment Received!</h1>
              </div>
              <div style="padding: 20px;">
                <p>Dear ${project.customer},</p>
                <p>We have successfully received your payment for project: <strong>${project.project_name}</strong>.</p>
                <p>We have started working on it and will keep you updated on the progress. You can view your project status and details in your dashboard.</p>
                 <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" style="background-color: #1A202C; color: #FFFFFF; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Go to Dashboard</a>
                </div>
                <p>Thank you!</p>
              </div>
              <div style="background-color: #f8f8f8; padding: 10px; text-align: center; font-size: 12px; color: #777;">
                <p>&copy; ${new Date().getFullYear()} Ragam Inovasi Optima. All rights reserved.</p>
              </div>
            </div>
        `,
      });
      console.log(`${logPrefix} SUCCESS Step 4: Confirmation email sent to ${project.customer_email}.`);
    } catch (emailError: any) {
        console.error(`${logPrefix} FAILED Step 4: Could not send confirmation email:`, emailError.message);
    }
  } else {
    console.warn(`${logPrefix} SKIPPED Step 4: No email found for customer ${project.customer}.`);
  }

  // Step 5: Update the payment method on the invoice (this should happen on the draft invoice before submission)
  // This call is now redundant as details are set during invoice creation. It's safe to remove.
  // If for some reason we need to update AFTER submission, a different ERPNext method (like a whitelisted server script) would be required.

  return { 
    success: true, 
    message: 'Success: Payment Entry created and Project status updated.',
    details: {
      paymentEntry: paymentResult.success,
      projectUpdate: updateResult.success ? 'Success' : `Failed: ${updateResult.error}`,
    }
  };
}
