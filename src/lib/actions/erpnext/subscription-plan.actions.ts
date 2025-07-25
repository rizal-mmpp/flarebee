
'use server';

import type { SubscriptionPlanFormValues } from '@/components/admin/subscriptions/SubscriptionPlanFormTypes';
import type { SubscriptionPlan } from '@/lib/types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

function transformErpSubscriptionPlan(erpPlan: any): SubscriptionPlan {
    return {
        name: erpPlan.name,
        plan_name: erpPlan.plan_name,
        item: erpPlan.item,
        cost: erpPlan.cost,
        currency: erpPlan.currency,
        billing_interval: erpPlan.billing_interval,
        billing_interval_count: erpPlan.billing_interval_count,
    };
}

export async function getSubscriptionPlansFromErpNext({ sid }: { sid: string }): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({
        sid,
        doctype: 'Subscription Plan',
        fields: ['name', 'plan_name', 'item', 'cost', 'currency', 'billing_interval', 'billing_interval_count'],
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Subscription Plans.' };
    }
    
    const plans = result.data.map(transformErpSubscriptionPlan);
    return { success: true, data: plans };
}

export async function getSubscriptionPlanByName({ sid, planName }: { sid: string; planName: string }): Promise<{ success: boolean; data?: SubscriptionPlan; error?: string }> {
    const result = await fetchFromErpNext<any>({ sid, doctype: 'Subscription Plan', docname: planName });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Subscription Plan.' };
    }
    const plan = transformErpSubscriptionPlan(result.data);
    return { success: true, data: plan };
}


export async function createSubscriptionPlanInErpNext({ sid, planData }: { sid: string, planData: SubscriptionPlanFormValues }): Promise<{ success: boolean; error?: string; }> {
    try {
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Subscription Plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(planData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.exception || errorData._server_messages || 'Failed to create Subscription Plan.');
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSubscriptionPlanInErpNext({ sid, planName, planData }: { sid: string, planName: string, planData: SubscriptionPlanFormValues }): Promise<{ success: boolean; error?: string; }> {
     try {
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Subscription Plan/${planName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
            body: JSON.stringify(planData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.exception || errorData._server_messages || 'Failed to update Subscription Plan.');
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteSubscriptionPlanInErpNext({ sid, planName }: { sid: string, planName: string }): Promise<{ success: boolean; message?: string, error?: string; }> {
    try {
        const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Subscription Plan/${planName}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.exception || errorData._server_messages || 'Failed to delete Subscription Plan.');
        }

        return { success: true, message: `Subscription Plan "${planName}" deleted successfully.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
