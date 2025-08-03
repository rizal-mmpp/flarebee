
'use server';

import { sendEmail } from '@/lib/services/email.service';

interface TestEmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Server action to send a test email. Used by the admin email test page.
 */
export async function sendTestEmailAction(
  payload: TestEmailPayload
): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = payload;
  
  if (!to || !subject || !html) {
    return { success: false, error: 'Recipient, subject, and HTML content are required.' };
  }

  try {
    const result = await sendEmail({ to, subject, html });
    return result;
  } catch (error: any) {
    console.error("Error in sendTestEmailAction:", error);
    return { success: false, error: error.message || "An unexpected server error occurred." };
  }
}
