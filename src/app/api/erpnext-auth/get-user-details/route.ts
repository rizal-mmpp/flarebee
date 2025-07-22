
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const sid = cookieStore.get('sid');

  if (!sid || !sid.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const getHeaders = (sessionId: string) => ({
    'Cookie': `sid=${sessionId}`,
  });

  try {
    // 1. Get the logged-in user's ID
    const loggedUserResponse = await fetch(
      `${ERPNEXT_API_URL}/api/method/frappe.auth.get_logged_user`,
      { headers: getHeaders(sid.value) }
    );

    if (!loggedUserResponse.ok) {
      if (loggedUserResponse.status === 401) {
         cookieStore.delete('sid'); // Clear invalid cookie
      }
      throw new Error(`Failed to get logged user: ${loggedUserResponse.statusText}`);
    }

    const loggedUserData = await loggedUserResponse.json();
    const userId = loggedUserData.message;

    if (!userId || userId === 'Guest') {
      cookieStore.delete('sid'); // Clear guest cookie
      throw new Error('User is Guest or not logged in.');
    }

    // 2. Get the user's full details from the User doctype
    const fields = ['email', 'full_name', 'user_image']; // Add any other fields you need
    const filters = [['name', '=', userId]];
    const userDetailsUrl = `${ERPNEXT_API_URL}/api/resource/User?fields=${JSON.stringify(fields)}&filters=${JSON.stringify(filters)}`;

    const userDetailsResponse = await fetch(userDetailsUrl, { headers: getHeaders(sid.value) });

    if (!userDetailsResponse.ok) {
      throw new Error(`Failed to get user details: ${userDetailsResponse.statusText}`);
    }
    
    const userDetailsData = await userDetailsResponse.json();
    if (!userDetailsData.data || userDetailsData.data.length === 0) {
        throw new Error('User details not found for the logged-in user.');
    }

    const user = userDetailsData.data[0];

    return NextResponse.json({
        success: true,
        user: {
            username: userId,
            email: user.email,
            fullName: user.full_name,
            photoURL: user.user_image ? `${ERPNEXT_API_URL}${user.user_image}` : null
        }
    });

  } catch (error: any) {
    console.error('[GET_USER_DETAILS_API] Error:', error.message);
    return NextResponse.json({ error: 'Session invalid or failed to fetch user data.' }, { status: 401 });
  }
}
