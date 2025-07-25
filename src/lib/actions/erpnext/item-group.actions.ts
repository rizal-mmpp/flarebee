
'use server';

import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

export async function getItemGroupsFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: { name: string }[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({
        sid,
        doctype: 'Item Group',
        fields: ['name'],
        filters: [['is_group', '=', 0]], // Correctly fetch categories, not parent folders
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Item Groups.' };
    }
    return { success: true, data: result.data };
}

export async function createItemGroupInErpNext({ sid, name }: { sid: string; name: string; }): Promise<{ success: boolean; data?: any; error?: string; }> {
    if (!name.trim()) return { success: false, error: 'Item Group name cannot be empty.' };
    try {
        const itemGroupData = {
            item_group_name: name,
            is_group: 0, // Correctly create as a category, not a parent folder
            parent_item_group: "All Item Groups", // Standard parent
        };

        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Item Group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(itemGroupData),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.exception || responseData._server_messages || 'Failed to create Item Group in ERPNext.');
        }

        return { success: true, data: responseData.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
