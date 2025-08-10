'use server';

import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handles the webhook verification challenge from Meta.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
export async function GET(request: NextRequest) {
  const verifyToken = process.env.WABA_VERIFY_TOKEN;

  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WABA Webhook] Verification successful!');
    // Respond with the challenge token from the request
    return new NextResponse(challenge, { status: 200 });
  } else {
    // Respond with '403 Forbidden' if tokens do not match
    console.error('[WABA Webhook] Verification failed: Tokens do not match.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

/**
 * Handles incoming event notifications from the WhatsApp Business API.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    console.log(`\n\n--- WABA Webhook Received ${timestamp} ---\n`);
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n--- End WABA Webhook ---\n\n');

    // Respond with a 200 OK to acknowledge receipt of the event
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('[WABA Webhook] Error processing incoming event:', error);
    // It's important to still send a 200 OK, otherwise Meta may retry and disable the webhook.
    // The error is logged for debugging.
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 200 });
  }
}
