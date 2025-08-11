'use server';

interface SendMessageArgs {
  recipientNumber: string;
  messageText: string;
}

interface CreateTemplateArgs {
    templateName: string;
    languageCode: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    bodyText: string;
}

const WABA_API_VERSION = 'v19.0';
const WABA_API_URL = 'https://graph.facebook.com';

async function makeWhatsAppApiRequest(endpoint: string, payload: object): Promise<{ success: boolean, error?: string, data?: any }> {
    const accessToken = process.env.API_ACCESS_TOKEN;

    if (!accessToken) {
        return { success: false, error: 'WhatsApp API Access Token is not configured on the server.' };
    }

    try {
        const response = await fetch(`${WABA_API_URL}/${WABA_API_VERSION}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.error?.message || `API request failed with status ${response.status}`;
            console.error('WhatsApp API Error:', responseData.error);
            return { success: false, error: errorMessage, data: responseData };
        }
        
        return { success: true, data: responseData };
    } catch (error: any) {
        console.error('Failed to make WhatsApp API request:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}


export async function sendWhatsAppMessageAction(
  args: SendMessageArgs
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    return { success: false, error: 'WhatsApp Phone Number ID is not configured on the server.' };
  }

  const { recipientNumber, messageText } = args;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipientNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: messageText,
    },
  };

  const endpoint = `${phoneNumberId}/messages`;
  return makeWhatsAppApiRequest(endpoint, payload);
}

export async function createWhatsAppTemplateAction(
    args: CreateTemplateArgs
): Promise<{ success: boolean, error?: string, data?: any }> {
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
     if (!businessAccountId) {
        return { success: false, error: 'WhatsApp Business Account ID is not configured on the server.' };
    }
    
    const { templateName, languageCode, category, bodyText } = args;
    
    const payload = {
        name: templateName,
        language: languageCode,
        category: category,
        components: [
            {
                type: 'BODY',
                text: bodyText,
            },
        ],
    };

    const endpoint = `${businessAccountId}/message_templates`;
    return makeWhatsAppApiRequest(endpoint, payload);
}
