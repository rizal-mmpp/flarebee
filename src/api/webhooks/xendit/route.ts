
'use server';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrderByOrderIdFromFirestore, updateOrderStatusInFirestore } from '@/lib/firebase/firestoreOrders';
import { createDraftPaymentEntry, submitDoc } from '@/lib/actions/erpnext/sales-invoice.actions';
import { getProjectByInvoiceId, updateProject } from '@/lib/actions/erpnext/project.actions';
import { sendEmail } from '@/lib/services/email.service';
import type { Order } from '@/lib/types';
import { fetchFromErpNext } from '@/lib/actions/erpnext/utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface XenditWebhookPayload {
  id: string; // Xendit Invoice ID
  external_id: string; // Our orderId (e.g., rio-order-..., SINV-...)
  status: 'PAID' | 'EXPIRED' | 'PENDING' | string;
  payment_method?: string; // Used in v1
  payment_channel?: string; // Used in v2
  payment_destination?: string;
  paid_amount?: number;
  paid_at?: string;
  // ... other fields from Xendit payload
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

    const { external_id, status: xenditStatus } = payload;

    if (!external_id) {
      console.error('[Webhook] Validation Error: Payload missing external_id.');
      return NextResponse.json({ success: false, message: 'Missing external_id in payload.' }, { status: 400 });
    }

    if (external_id.startsWith('rio-order-')) {
      await handleB2CFlow(external_id, xenditStatus);
      return NextResponse.json({ success: true, message: 'Legacy B2C webhook processed.' }, { status: 200 });
    } else if (external_id.startsWith('ACC-SINV-')) { // Changed to match ERPNext naming series
      const result = await handleB2BFlow(external_id, xenditStatus, payload);
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

async function handleB2BFlow(invoiceName: string, xenditStatus: string, xenditPayload: XenditWebhookPayload): Promise<{ success: boolean; message: string; details?: any }> {
  const logPrefix = `[B2B Flow - ${invoiceName}]`;
  console.log(`${logPrefix} Starting for status: ${xenditStatus}`);

  if (xenditStatus.toUpperCase() !== 'PAID') {
    return { success: true, message: `Ignoring non-PAID status "${xenditStatus}".` };
  }
  
  try {
    // Step 1: Self-heal the Mode of Payment if it doesn't exist
    const paymentMethodName = `${xenditPayload.payment_method || 'Unknown'} - ${xenditPayload.payment_channel || 'Unknown'}`;
    const mopExistsResult = await fetchFromErpNext({ sid: null, doctype: 'Mode of Payment', docname: paymentMethodName, fields: ['name'] });

    if (!mopExistsResult.success && mopExistsResult.error?.includes('not found')) {
      console.log(`${logPrefix} Mode of Payment "${paymentMethodName}" not found. Creating it...`);
      try {
        const invoiceDocResult = await fetchFromErpNext<any>({ sid: null, doctype: 'Sales Invoice', docname: invoiceName, fields: ['company', 'account_for_change_amount'] });
        if (!invoiceDocResult.success || !invoiceDocResult.data) {
          throw new Error(`Could not fetch Sales Invoice details to create Mode of Payment.`);
        }

        const mopPayload = {
          doctype: 'Mode of Payment',
          mode_of_payment: paymentMethodName,
          type: 'General',
          company: invoiceDocResult.data.company,
          accounts: [{
              company: invoiceDocResult.data.company,
              default_account: invoiceDocResult.data.account_for_change_amount || "Cash - RIO",
          }]
        };

        const createMopResponse = await fetch(`${ERPNEXT_API_URL}/api/resource/Mode of Payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`,
          },
          body: JSON.stringify(mopPayload),
        });

        if (!createMopResponse.ok) {
          const errorData = await createMopResponse.json();
          const serverMessages = errorData._server_messages ? JSON.parse(errorData._server_messages[0]).message : 'Unknown error during creation.';
          throw new Error(`Failed to auto-create Mode of Payment: ${errorData.exception || serverMessages}`);
        }
        console.log(`${logPrefix} Successfully created Mode of Payment "${paymentMethodName}".`);
      } catch (creationError: any) {
        return { success: false, message: `Critical error: Failed during self-healing of Mode of Payment.`, details: { modeOfPaymentCreation: creationError.message }};
      }
    } else if (!mopExistsResult.success) {
      // Handle other errors during the check
      return { success: false, message: 'Critical error: Could not verify Mode of Payment existence.', details: { modeOfPaymentCheck: mopExistsResult.error } };
    }

    // Step 2: Create the DRAFT Payment Entry with all Xendit details.
    console.log(`${logPrefix} Step 2: Creating Draft Payment Entry.`);
    const paymentEntryResult = await createDraftPaymentEntry({
      sid: null,
      invoiceName: invoiceName,
      xenditPayload: xenditPayload,
    });

    if (!paymentEntryResult.success || !paymentEntryResult.doc) {
      throw new Error(`Failed at Step 2: Could not create Draft Payment Entry. Error: ${paymentEntryResult.error}`);
    }
    console.log(`${logPrefix} SUCCESS Step 2: Draft Payment Entry created.`);

    // Step 3: Submit the Payment Entry. This will automatically update the Sales Invoice status.
    console.log(`${logPrefix} Step 3: Submitting Payment Entry.`);
    await submitDoc(paymentEntryResult.doc, null);
    console.log(`${logPrefix} SUCCESS Step 3: Payment Entry submitted.`);

  } catch (error: any) {
    console.error(`${logPrefix} Critical error during payment processing:`, error.message);
    return { 
      success: false, 
      message: `Critical error: ${error.message}`,
    };
  }

  // --- Post-Payment Actions (non-critical if they fail) ---

  // Find the associated Project.
  console.log(`${logPrefix} Step 4: Finding associated Project.`);
  const projectResult = await getProjectByInvoiceId(null, invoiceName);
  if (!projectResult.success || !projectResult.data) {
    console.warn(`${logPrefix} SKIPPED post-payment actions: Project not found for invoice.`);
  } else {
    const project = projectResult.data;
    console.log(`${logPrefix} SUCCESS Step 4: Found Project: ${project.name}`);

    // Update the project status.
    console.log(`${logPrefix} Step 5: Updating Project ${project.name} status to "In Progress".`);
    const updateResult = await updateProject({ sid: null, projectName: project.name, projectData: { status: 'In Progress' } });
    if (!updateResult.success) {
        console.error(`${logPrefix} FAILED Step 5: Could not update project status. Error: ${updateResult.error}`);
    } else {
        console.log(`${logPrefix} SUCCESS Step 5: Project status updated.`);
    }
    
    // Send the confirmation email.
    console.log(`${logPrefix} Step 6: Sending confirmation email.`);
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
        console.log(`${logPrefix} SUCCESS Step 6: Confirmation email sent to ${project.customer_email}.`);
      } catch (emailError: any) {
          console.error(`${logPrefix} FAILED Step 6: Could not send confirmation email:`, emailError.message);
      }
    } else {
      console.warn(`${logPrefix} SKIPPED Step 6: No email found for customer ${project.customer}.`);
    }
  }

  return { success: true, message: 'Success: Payment processed and project status updated.' };
}
