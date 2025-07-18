
import { type NextRequest, NextResponse } from 'next/server';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const response = await fetch(`${ERPNEXT_API_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `cmd=frappe.core.doctype.user.user.reset_password&user=${encodeURIComponent(email)}`,
    });

    const textResponse = await response.text();
    
    // Frappe reset password returns HTML, so we check status and response text
    if (response.ok && (textResponse.includes("sent") || textResponse.includes("exists"))) {
        return NextResponse.json({ success: true, message: "Password reset email sent if user exists." });
    } else {
        console.error("ERPNext Reset Password Failed Response:", textResponse);
        return NextResponse.json({ success: false, error: 'Failed to send password reset request to ERPNext.' }, { status: response.status });
    }

  } catch (error: any) {
    console.error('[RESET_PASSWORD_API] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
