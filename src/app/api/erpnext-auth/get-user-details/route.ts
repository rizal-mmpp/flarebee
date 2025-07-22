
import { type NextRequest, NextResponse } from 'next/server';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

// This function now expects the SID to be passed in the request body
export async function POST(request: NextRequest) {
  try {
    const { sid } = await request.json();

    if (!sid) {
      return NextResponse.json({ error: 'Not authenticated: SID is missing.' }, { status: 401 });
    }

    const getHeaders = (sessionId: string) => ({
      'Cookie': `sid=${sessionId}`,
    });

    // 1. Get the logged-in user's ID from ERPNext
    const loggedUserResponse = await fetch(
      `${ERPNEXT_API_URL}/api/method/frappe.auth.get_logged_user`,
      { headers: getHeaders(sid) }
    );
    
    if (!loggedUserResponse.ok) {
       // It's possible the SID is invalid/expired
       return NextResponse.json({ error: 'Session invalid or expired.' }, { status: 401 });
    }
    
    const loggedUserData = await loggedUserResponse.json();
    const userId = loggedUserData.message;

    if (!userId || userId === 'Guest') {
      return NextResponse.json({ error: 'User is Guest or not logged in.' }, { status: 401 });
    }
    
    // 2. Get the user's full details from the User doctype
    const fields = ['email', 'full_name', 'user_image'];
    const filters = [['name', '=', userId]];
    const userDetailsUrl = `${ERPNEXT_API_URL}/api/resource/User?fields=${JSON.stringify(fields)}&filters=${JSON.stringify(filters)}`;

    const userDetailsResponse = await fetch(userDetailsUrl, { headers: getHeaders(sid) });

    if (!userDetailsResponse.ok) {
      return NextResponse.json({ error: `Failed to get user details: ${userDetailsResponse.statusText}` }, { status: userDetailsResponse.status });
    }
    
    const userDetailsData = await userDetailsResponse.json();
    if (!userDetailsData.data || userDetailsData.data.length === 0) {
        return NextResponse.json({ error: 'User details not found for the logged-in user.' }, { status: 404 });
    }

    const user = userDetailsData.data[0];

    return NextResponse.json({
        success: true,
        user: {
            username: userId,
            email: user.email,
            fullName: user.full_name,
            photoURL: user.user_image ? `${ERPNEXT_API_URL}${user.user_image}` : null,
        }
    });

  } catch (error: any) {
    console.error('[GET_USER_DETAILS_API] Error:', error.message);
    return NextResponse.json({ error: 'Server error while fetching user data.' }, { status: 500 });
  }
}
