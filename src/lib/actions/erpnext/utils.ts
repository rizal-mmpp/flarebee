
'use server';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

// Public/Guest Keys - available on the client
const ERPNEXT_GUEST_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_GUEST_API_KEY;
const ERPNEXT_GUEST_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_GUEST_API_SECRET;


interface FetchFromErpNextArgs {
    sid?: string; // SID is now a signal for "admin-level" access
    doctype: string;
    docname?: string;
    fields?: string[];
    filters?: any[];
    limit?: number;
}

export async function fetchFromErpNext<T>({ sid, doctype, docname, fields = ['*'], filters = [], limit = 0 }: FetchFromErpNextArgs): Promise<{ success: boolean, data?: T | T[], error?: string }> {
    if (!ERPNEXT_API_URL) return { success: false, error: 'ERPNext API URL is not configured.' };
    
    const headers: HeadersInit = { 'Accept': 'application/json' };
    
    if (sid) {
        // Authenticated user request - use the provided session ID
        headers['Cookie'] = `sid=${sid}`;
    } else {
        // Public/Guest request - use GUEST keys
        if (ERPNEXT_GUEST_API_KEY && ERPNEXT_GUEST_API_SECRET) {
             // IMPORTANT: The format is "token key:secret" NOT "token key secret"
             headers['Authorization'] = `token ${ERPNEXT_GUEST_API_KEY}:${ERPNEXT_GUEST_API_SECRET}`;
        } else {
            return { success: false, error: 'Guest API keys are not configured for public requests.' };
        }
    }

    const endpoint = docname ? `${ERPNEXT_API_URL}/api/resource/${doctype}/${docname}` : `${ERPNEXT_API_URL}/api/resource/${doctype}`;
    const url = new URL(endpoint);

    if (!docname) { // Params are for list view
        url.searchParams.append('fields', JSON.stringify(fields));
        if (filters.length > 0) {
            url.searchParams.append('filters', JSON.stringify(filters));
        }
        if (limit > 0) {
            url.searchParams.append('limit', String(limit));
        } else {
            url.searchParams.append('limit_page_length', '0'); // Fetch all
        }
    }

    try {
        const response = await fetch(url.toString(), {
            headers: headers,
            cache: 'no-store',
        });
        
        const responseData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}. Non-JSON response.` }));

        if (!response.ok) {
            const errorMessage = responseData.message || responseData.exception || `Failed to fetch data from ${doctype}. Check permissions for the provided credentials.`;
            return { success: false, error: errorMessage };
        }

        return { success: true, data: responseData.data };
    } catch (error: any) {
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}
