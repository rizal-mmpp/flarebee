
'use server';

import type { UserProfile } from '../../types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

export async function getUsersFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: UserProfile[]; error?: string; }> {
     const result = await fetchFromErpNext<any[]>({ 
        sid, 
        doctype: 'User', 
        fields: ['name', 'email', 'full_name', 'user_image', 'creation']
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get users.' };
    }
    
    const users: UserProfile[] = (result.data as any[]).map(item => {
        return {
            uid: item.name,
            email: item.email,
            displayName: item.full_name,
            photoURL: item.user_image ? `${ERPNEXT_API_URL}${item.user_image}` : null,
            role: 'user', // Default role to user
            createdAt: new Date(item.creation),
        };
    });

    return { success: true, data: users };
}
