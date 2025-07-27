

'use server';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;
const GUEST_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_GUEST_API_KEY;
const GUEST_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_GUEST_API_SECRET;

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
    headers['Cookie'] = `sid=${sid}`;
  } else if (GUEST_API_KEY && GUEST_API_SECRET) {
    headers['Authorization'] = `token ${GUEST_API_KEY}:${GUEST_API_SECRET}`;
  } else {
    return { success: false, error: 'No authentication method available (Session ID or API Key).' };
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
