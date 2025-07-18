
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { usr, pwd } = await request.json();

    if (!usr || !pwd) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const response = await fetch(`${ERPNEXT_API_URL}/api/method/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ usr, pwd }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Login failed' }, { status: response.status });
    }

    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) {
      return NextResponse.json({ error: 'Session ID not found in ERPNext response' }, { status: 500 });
    }
    
    const match = setCookieHeader.match(/sid=([^;]+)/);
    if (!match || !match[1]) {
        return NextResponse.json({ error: 'Could not parse Session ID from ERPNext' }, { status: 500 });
    }
    const sid = match[1];

    (await cookies()).set({
      name: 'sid',
      value: sid,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, sid: sid });

  } catch (error: any) {
    console.error('[LOGIN_API] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login.' }, { status: 500 });
  }
}
