'use server';

import type { ProjectFormValues } from '@/app/admin/projects/new/page';
import type { Project } from '@/lib/types';
import { fetchFromErpNext } from './utils';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

async function postToErpNext(doctype: string, data: any, sid: string) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
  
  const endpoint = `${ERPNEXT_API_URL}/api/resource/${doctype}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ERPNext API Error for ${doctype}:`, errorText);
    try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Unknown ERPNext Error');
    } catch(e) {
        throw new Error(`Failed with status ${response.status}: ${errorText}`);
    }
  }
  return response.json();
}


export async function ensureProjectDocTypeExists(sid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const doctypeName = 'Project';
    const checkUrl = `${ERPNEXT_API_URL}/api/resource/DocType/${doctypeName}`;
    const checkResponse = await fetch(checkUrl, { headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` } });

    if (checkResponse.ok) {
      console.log(`DocType '${doctypeName}' already exists.`);
      return { success: true };
    }

    if (checkResponse.status === 404) {
      console.log(`DocType '${doctypeName}' not found. Creating...`);
      const schema = {
        doctype: 'DocType',
        name: doctypeName,
        module: 'Projects', // Standard module
        custom: 1,
        fields: [
            { fieldname: 'customer', fieldtype: 'Link', options: 'Customer', label: 'Customer', reqd: 1 },
            { fieldname: 'service_item', fieldtype: 'Link', options: 'Item', label: 'Service Item', reqd: 1 },
            { fieldname: 'project_name', fieldtype: 'Data', label: 'Project Name', reqd: 1 },
            { fieldname: 'status', fieldtype: 'Select', options: 'Draft\nAwaiting Payment\nIn Progress\nAwaiting Delivery\nCompleted\nCancelled', label: 'Status', reqd: 1, default: 'Draft' },
            { fieldname: 'sales_invoice', fieldtype: 'Link', options: 'Sales Invoice', label: 'Sales Invoice' },
            { fieldname: 'service_management_url', fieldtype: 'Data', label: 'Service Management URL' },
            { fieldname: 'final_service_url', fieldtype: 'Data', label: 'Final Service URL' },
            { fieldname: 'credential_setup_url', fieldtype: 'Data', label: 'Credential Setup URL' },
            { fieldname: 'delivery_date', fieldtype: 'Datetime', label: 'Delivery Date' },
        ],
        permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }],
        issingle: 0,
        istable: 0,
        title_field: 'project_name',
      };
      await postToErpNext('DocType', schema, sid);
      console.log(`DocType '${doctypeName}' created successfully.`);
      return { success: true };
    }

    const errorData = await checkResponse.json();
    throw new Error(`Failed to check DocType '${doctypeName}': ${errorData.exception || 'Unknown error'}`);

  } catch (error: any) {
    console.error("Error in ensureProjectDocTypeExists:", error);
    return { success: false, error: error.message };
  }
}

export async function createProject({ sid, projectData }: { sid: string, projectData: ProjectFormValues }): Promise<{ success: boolean; error?: string }> {
   try {
    // 1. Ensure the "Project" DocType and its custom fields exist.
    const infrastructureResult = await ensureProjectDocTypeExists(sid);
    if (!infrastructureResult.success) {
      throw new Error(`Failed to prepare ERPNext infrastructure: ${infrastructureResult.error}`);
    }

    // 2. Prepare the data for the new Project document.
    const dataToPost = {
      ...projectData,
      status: 'Draft', // Always start as Draft
    };

    // 3. Create the new "Project" document in ERPNext.
    await postToErpNext('Project', dataToPost, sid);

    return { success: true };
  } catch (error: any) {
    console.error("Error in createProject:", error);
    return { success: false, error: error.message };
  }
}

function transformErpProject(erpProject: any): Project {
  return {
    name: erpProject.name,
    customer: erpProject.customer,
    service_item: erpProject.service_item,
    project_name: erpProject.project_name,
    status: erpProject.status,
    sales_invoice: erpProject.sales_invoice,
    service_management_url: erpProject.service_management_url,
    final_service_url: erpProject.final_service_url,
    credential_setup_url: erpProject.credential_setup_url,
    delivery_date: erpProject.delivery_date,
    creation: erpProject.creation,
    modified: erpProject.modified,
  };
}

export async function getProjects({ sid }: { sid: string }): Promise<{ success: boolean; data?: Project[]; error?: string; }> {
    const result = await fetchFromErpNext<any[]>({
        sid,
        doctype: 'Project',
        fields: ['name', 'project_name', 'customer', 'status', 'modified', 'creation'],
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Projects.' };
    }
    const projects = result.data.map(transformErpProject);
    return { success: true, data: projects };
}