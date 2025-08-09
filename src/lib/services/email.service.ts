
'use server';

interface SendEmailArgs {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailArgs): Promise<{ success: boolean, error?: string }> {
    const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
    const webhookAuth = process.env.N8N_EMAIL_WEBHOOK_AUTH;

    if (!webhookUrl || !webhookAuth) {
        console.error("n8n email webhook URL or Auth is not configured.");
        return { success: false, error: "Email service (n8n) is not configured on the server." };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': webhookAuth,
            },
            body: JSON.stringify({
                to,
                subject,
                text,
                html,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`n8n webhook failed with status ${response.status}:`, errorBody);
            return { success: false, error: `Email webhook service returned an error: ${response.statusText}` };
        }
        
        // Assuming n8n returns a success message in its body
        const result = await response.json();
        console.log("n8n webhook response:", result);

        return { success: true };

    } catch (error: any) {
        console.error("Error sending email via n8n webhook:", error.message);
        return { success: false, error: error.message };
    }
}
