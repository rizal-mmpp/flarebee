
'use server';

import type { ProjectFormValues } from '@/app/admin/projects/new/page';
import type { Project, Customer } from '@/lib/types';
import { fetchFromErpNext } from './utils';
import { sendEmail } from '@/lib/services/email.service';

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

const customFieldsForProject = [
    { fieldname: 'customer', fieldtype: 'Link', options: 'Customer', label: 'Customer', reqd: 1, insert_after: 'company' },
    { fieldname: 'service_item', fieldtype: 'Link', options: 'Item', label: 'Service Item', reqd: 1, insert_after: 'customer' },
    { fieldname: 'status', fieldtype: 'Select', options: 'Draft\nAwaiting Payment\nIn Progress\nAwaiting Delivery\nCompleted\nCancelled', label: 'Status', reqd: 1, default: 'Draft', insert_after: 'service_item'},
    { fieldname: 'sales_invoice', fieldtype: 'Link', options: 'Sales Invoice', label: 'Sales Invoice', insert_after: 'status' },
    { fieldname: 'service_management_url', fieldtype: 'Data', label: 'Service Management URL', insert_after: 'sales_invoice' },
    { fieldname: 'final_service_url', fieldtype: 'Data', label: 'Final Service URL', insert_after: 'service_management_url' },
    { fieldname: 'credential_setup_url', fieldtype: 'Data', label: 'Credential Setup URL', insert_after: 'final_service_url' },
    { fieldname: 'delivery_date', fieldtype: 'Datetime', label: 'Delivery Date', insert_after: 'credential_setup_url' },
];

async function postRequest(endpoint: string, data: any, sid: string) {
  if (!ERPNEXT_API_URL) throw new Error('ERPNext API URL is not configured.');
  
  const response = await fetch(`${ERPNEXT_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ERPNext API Error for endpoint ${endpoint}:`, errorText);
    try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.exception || errorData._server_messages?.[0] || 'Unknown ERPNext Error');
    } catch(e) {
        throw new Error(`Failed with status ${response.status}: ${errorText}`);
    }
  }
  return response.json();
}


export async function ensureProjectCustomFieldsExist(sid: string): Promise<{ success: boolean; error?: string }> {
  try {
    for (const field of customFieldsForProject) {
        const payload = {
            doctype: "Custom Field",
            dt: "Project", // Add to the standard Project DocType
            ...field
        };
        
        try {
            await postRequest('/api/resource/Custom Field', payload, sid);
            console.log(`Successfully added or verified custom field '${field.fieldname}' to 'Project'.`);
        } catch (error: any) {
            // It's safe to ignore "already exists" errors.
            if (error.message && (error.message.includes('already exists') || error.message.includes('exists'))) {
                console.log(`Custom field '${field.fieldname}' already exists in 'Project'. Skipping.`);
            } else {
                throw new Error(`Failed to add custom field '${field.fieldname}' to 'Project': ${error.message}`);
            }
        }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error in ensureProjectCustomFieldsExist:", error);
    return { success: false, error: error.message };
  }
}

export async function createProject({ sid, projectData }: { sid: string, projectData: ProjectFormValues }): Promise<{ success: boolean; error?: string }> {
   try {
    const infrastructureResult = await ensureProjectCustomFieldsExist(sid);
    if (!infrastructureResult.success) {
      throw new Error(`Failed to prepare ERPNext infrastructure: ${infrastructureResult.error}`);
    }

    const dataToPost = {
      ...projectData,
      status: 'Draft', 
    };

    await postRequest('/api/resource/Project', dataToPost, sid);

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
        fields: ['name', 'project_name', 'customer', 'status', 'modified', 'creation', 'company'],
    });

    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Projects.' };
    }
    const projects = result.data.map(transformErpProject);
    return { success: true, data: projects };
}

export async function getProjectByName({ sid, projectName }: { sid: string; projectName: string; }): Promise<{ success: boolean; data?: Project; error?: string; }> {
    const result = await fetchFromErpNext<any>({ 
        sid, 
        doctype: 'Project', 
        docname: projectName,
    });
    if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get Project.' };
    }
    const project: Project = transformErpProject(result.data);
    return { success: true, data: project };
}

// Action to create and send invoice
export async function createAndSendInvoice({ sid, projectName }: { sid: string; projectName: string }): Promise<{ success: boolean; invoiceName?: string; error?: string }> {
  try {
    // 1. Fetch Project and related Item/Customer data
    const projectResult = await getProjectByName({ sid, projectName });
    if (!projectResult.success || !projectResult.data) {
      throw new Error(projectResult.error || "Project not found.");
    }
    const project = projectResult.data;

    if (project.status !== 'Draft') {
      return { success: false, error: `Project status must be 'Draft' to create an invoice. Current status: ${project.status}` };
    }
    if (project.sales_invoice) {
        return { success: false, error: `An invoice (${project.sales_invoice}) already exists for this project.` };
    }
    
    const itemResult = await fetchFromErpNext<any>({ sid, doctype: 'Item', docname: project.service_item });
    if (!itemResult.success || !itemResult.data) {
      throw new Error("Service item details could not be fetched.");
    }

    const customerResult = await fetchFromErpNext<Customer>({ sid, doctype: 'Customer', docname: project.customer });
     if (!customerResult.success || !customerResult.data) {
      throw new Error("Customer details could not be fetched.");
    }

    const item = itemResult.data;
    const customer = customerResult.data;

    // 2. Create Sales Invoice
    const invoicePayload = {
      customer: project.customer,
      items: [{
        item_code: item.name,
        qty: 1,
        rate: item.standard_rate || 0,
      }],
      // Other fields as needed, e.g., due_date
      due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // 7 days from now
    };
    
    const invoiceCreationResponse = await postRequest('/api/resource/Sales Invoice', invoicePayload, sid);
    const invoiceName = invoiceCreationResponse.data.name;

    // 3. Update Project status and link to invoice
    const projectUpdatePayload = {
      status: 'Awaiting Payment',
      sales_invoice: invoiceName,
    };
    await fetch(`${ERPNEXT_API_URL}/api/resource/Project/${projectName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
        body: JSON.stringify(projectUpdatePayload),
    });

    // 4. Send Email
    if (customer.email_id) {
       await sendEmail({
        to: customer.email_id,
        subject: `Invoice for Project: ${project.project_name}`,
        html: `
            <h1>Invoice for Your Project</h1>
            <p>Dear ${customer.customer_name},</p>
            <p>Please find the invoice for your project: <strong>${project.project_name}</strong>.</p>
            <p>Invoice ID: ${invoiceName}</p>
            <p>Amount: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.standard_rate || 0)}</p>
            <p>You can view and pay your invoice through your dashboard.</p>
            <p>Thank you!</p>
        `,
      });
    } else {
        console.warn(`Customer ${customer.customer_name} has no email ID. Invoice email was not sent.`);
    }

    return { success: true, invoiceName };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
