
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const sid = cookieStore.get('sid');

  try {
    if (sid && sid.value) {
      // We still call ERPNext's logout to invalidate their session
      await fetch(`${ERPNEXT_API_URL}/api/method/logout`, {
        headers: {
          'Cookie': `sid=${sid.value}`,
        },
      });
    }

    // Always clear the browser cookie
    cookieStore.delete('sid');

    return NextResponse.json({ success: true, message: 'Logged out successfully' });

  } catch (error: any) {
    console.error('[LOGOUT_API] Error:', error);
    // Clear cookie even if ERPNext call fails
    cookieStore.delete('sid');
    return NextResponse.json({ error: 'An unexpected error occurred during logout.' }, { status: 500 });
  }
}
