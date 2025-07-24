
'use server';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface FetchFromErpNextArgs {
    sid?: string; // SID is now optional for public fetches
    doctype: string;
    docname?: string;
    fields?: string[];
    filters?: any[];
    limit?: number;
}

export async function fetchFromErpNext<T>({ sid, doctype, docname, fields = ['*'], filters = [], limit = 0 }: FetchFromErpNextArgs): Promise<{ success: boolean, data?: T | T[], error?: string }> {
    if (!ERPNEXT_API_URL) return { success: false, error: 'ERPNext API URL is not configured.' };
    
    // For public endpoints, we might not have a SID.
    // ERPNext Guest access must be configured correctly for this to work.
    const headers: HeadersInit = { 'Accept': 'application/json' };
    if (sid) {
        headers['Cookie'] = `sid=${sid}`;
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            const errorMessage = errorData.message || errorData.exception || `Failed to fetch data from ${doctype}. Check permissions for Guests if you are not logged in.`;
            return { success: false, error: errorMessage };
        }

        const result: { data: T | T[] } = await response.json();
        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}
