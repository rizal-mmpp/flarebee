
'use server';

import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handles the webhook verification challenge from Meta.
 * This is required to prove ownership of the webhook URL.
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
 * Receives event notifications from the WhatsApp Business API,
 * forwards them to an n8n webhook, and returns n8n's response.
 */
export async function POST(request: NextRequest) {
  const n8nWebhookUrl = process.env.N8N_WABA_WEBHOOK_URL; 

  if (!n8nWebhookUrl) {
    console.error('[WABA Webhook] N8N_WABA_WEBHOOK_URL is not configured.');
    // It's important to still send a 200 OK, otherwise Meta may retry and disable the webhook.
    return NextResponse.json({ status: 'error', message: 'Internal server configuration error.' }, { status: 200 });
  }
  
  try {
    const payload = await request.json();
    console.log('[WABA Webhook] Received payload:', JSON.stringify(payload, null, 2));

    // Forward the payload to the n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add any specific auth headers for n8n if needed, e.g., 'Authorization': 'Bearer ...'
        },
        body: JSON.stringify(payload),
    });

    // Get the response from n8n to send back to WhatsApp
    const n8nResponseBody = await n8nResponse.json();
    const n8nStatus = n8nResponse.status;

    console.log(`[WABA Webhook] Forwarded to n8n. n8n responded with status ${n8nStatus}. Response:`, JSON.stringify(n8nResponseBody, null, 2));

    // Respond to WhatsApp with the response from n8n
    return NextResponse.json(n8nResponseBody, { status: n8nStatus });

  } catch (error: any) {
    console.error('[WABA Webhook] Error processing incoming event:', error.message);
    // Respond with a 200 OK to acknowledge receipt even if processing fails.
    return NextResponse.json({ status: 'error', message: 'Internal server error while processing webhook.' }, { status: 200 });
  }
}
