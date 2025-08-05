

'use server';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;
const GUEST_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_GUEST_API_KEY;
const GUEST_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_GUEST_API_SECRET;
const ADMIN_API_KEY = process.env.ERPNEXT_ADMIN_API_KEY;
const ADMIN_API_SECRET = process.env.ERPNEXT_ADMIN_API_SECRET;

interface FetchFromErpNextArgs {
  sid?: string | null;
  doctype: string;
  docname?: string;
  fields?: string[];
  filters?: (string | number | boolean)[][];
  limit?: number;
}

export async function fetchFromErpNext<T>({
  sid,
  doctype,
  docname,
  fields = ['*'],
  filters = [],
  limit = 20,
}: FetchFromErpNextArgs): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!ERPNEXT_API_URL) {
    return { success: false, error: 'ERPNext API URL is not configured.' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

  if (sid) {
    // Priority 1: Use session ID if provided (for logged-in user actions)
    headers['Cookie'] = `sid=${sid}`;
  } else if (ADMIN_API_KEY && ADMIN_API_SECRET) {
    // Priority 2: Use Admin API keys if no SID (for server-to-server actions like webhooks)
    headers['Authorization'] = `token ${ADMIN_API_KEY}:${ADMIN_API_SECRET}`;
  } else if (GUEST_API_KEY && GUEST_API_SECRET) {
    // Priority 3: Use Guest API keys for public requests
    headers['Authorization'] = `token ${GUEST_API_KEY}:${GUEST_API_SECRET}`;
  } else {
    // No authentication method available
    return { success: false, error: 'No authentication method available for ERPNext request.' };
  }
  
  let url: string;
  if (docname) {
    url = `${ERPNEXT_API_URL}/api/resource/${doctype}/${docname}`;
  } else {
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(fields));
    if (filters.length > 0) params.append('filters', JSON.stringify(filters));
    if (limit > 0) params.append('limit', String(limit));
    url = `${ERPNEXT_API_URL}/api/resource/${doctype}?${params.toString()}`;
  }
  
  try {
    const response = await fetch(url, { headers, cache: 'no-store' });
    const responseData = await response.json();

    if (!response.ok) {
        const errorMessage = responseData.exception || responseData._server_messages || 'Failed to fetch data from ERPNext.';
        return { success: false, error: errorMessage };
    }

    return { success: true, data: responseData.data };
  } catch (error: any) {
    return { success: false, error: `An unexpected error occurred: ${error.message}` };
  }
}

/**
 * Utility function to make a POST request with x-www-form-urlencoded data,
 * which is required for some Frappe RPC calls like `savedocs`.
 */
export async function postEncodedRequest(endpoint: string, body: string, sid: string | null): Promise<any> {
    if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
    };

    if (sid) {
        headers['Cookie'] = `sid=${sid}`;
    } else if (ADMIN_API_KEY && ADMIN_API_SECRET) {
        headers['Authorization'] = `token ${ADMIN_API_KEY}:${ADMIN_API_SECRET}`;
    } else {
        throw new Error('No authentication method available for this ERPNext request.');
    }

    const response = await fetch(`${ERPNEXT_API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body,
    });
    
    const responseData = await response.json();

    if (!response.ok) {
        const errorMessage = responseData.exception || (Array.isArray(responseData._server_messages) ? JSON.parse(responseData._server_messages[0]).message : 'Unknown ERPNext POST Error');
        throw new Error(errorMessage);
    }
    return responseData;
}
