
'use server';

import Mailjet from 'node-mailjet';
import { getSiteSettings } from '../actions/settings.actions';
import { DEFAULT_SETTINGS } from '../constants';

interface SendEmailArgs {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET,
});

export async function sendEmail({ to, subject, text, html }: SendEmailArgs): Promise<{ success: boolean, error?: string }> {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_API_SECRET) {
        console.error("Mailjet API Key or Secret is not configured.");
        return { success: false, error: "Email service is not configured on the server." };
    }

    try {
        const settings = await getSiteSettings();
        const senderName = settings.senderName || DEFAULT_SETTINGS.senderName;
        // The senderEmail from settings MUST be a verified sender in Mailjet.
        const senderEmail = settings.senderEmail || process.env.MAILJET_SENDER_EMAIL;

        if (!senderEmail) {
            console.error("No verified sender email is configured in site settings or environment variables.");
            return { success: false, error: "Sender email address is not configured." };
        }

        const request = mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        Email: senderEmail,
                        Name: senderName,
                    },
                    To: [
                        {
                            Email: to,
                        },
                    ],
                    Subject: subject,
                    TextPart: text,
                    HTMLPart: html,
                },
            ],
        });

        const result = await request;
        console.log("Mailjet response:", result.body);

        // @ts-ignore
        if (result.body.Messages[0].Status === 'success') {
            return { success: true };
        } else {
            // @ts-ignore
            const errorInfo = result.body.Messages[0].Errors.map(e => e.ErrorMessage).join(', ');
            return { success: false, error: errorInfo };
        }

    } catch (error: any) {
        console.error("Error sending email via Mailjet:", error.message);
        return { success: false, error: error.message };
    }
}
