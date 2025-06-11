
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrderByOrderIdFromFirestore, updateOrderStatusInFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';

interface XenditWebhookPayload {
  id: string; // Xendit Invoice ID or Payment ID
  external_id: string; // Our orderId
  status: 'PAID' | 'EXPIRED' | 'FAILED' | string; // Xendit's status
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
  // ... other fields from Xendit
}

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

    const { external_id, status: xenditStatus } = payload;

    if (!external_id) {
      console.error('Webhook payload missing external_id.');
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    const order = await getOrderByOrderIdFromFirestore(external_id);

    if (!order) {
      console.warn(`Order not found for external_id: ${external_id}`);
      // Still acknowledge Xendit, as we might not have an order for every callback (e.g. direct payment tests)
      return NextResponse.json({ message: 'Webhook received, order not found or not relevant.' }, { status: 200 });
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
        console.log(`Unhandled Xendit status: ${xenditStatus} for order ${order.id}. Retaining current status.`);
        // Optionally, update xenditPaymentStatus without changing Flarebee status
        await updateOrderStatusInFirestore(order.id, order.status, xenditStatus);
        return NextResponse.json({ message: 'Webhook received, status not mapped for full update.' }, { status: 200 });
    }
    
    // Only update if the status is changing to prevent redundant writes or overwriting manual adjustments
    if (order.status !== newFlarebeeStatus || order.xenditPaymentStatus !== xenditStatus) {
        await updateOrderStatusInFirestore(order.id, newFlarebeeStatus, xenditStatus);
        console.log(`Order ${order.id} (external: ${external_id}) status updated to ${newFlarebeeStatus} (Xendit: ${xenditStatus})`);
    } else {
        console.log(`Order ${order.id} status already up-to-date or no relevant change (${newFlarebeeStatus} / ${xenditStatus}).`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing Xendit webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
