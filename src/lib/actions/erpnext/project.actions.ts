
'use server';

import type { ProjectFormValues } from '@/app/admin/projects/new/page';
import type { Project, Customer, SubscriptionPlan } from '@/lib/types';
import { fetchFromErpNext } from './utils';
import { sendEmail } from '@/lib/services/email.service';
import { updateContactDetails } from './customer.actions';
import { Xendit } from 'xendit-node';
import { ensureSalesInvoiceCustomFieldsExist } from './sales-invoice.actions';

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

const { Invoice } = xenditClient;

const ERPNEXT_API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

const customFieldsForProject = [
    { fieldname: 'customer', fieldtype: 'Link', options: 'Customer', label: 'Customer', reqd: 1, insert_after: 'company' },
    { fieldname: 'service_item', fieldtype: 'Link', options: 'Item', label: 'Service Item', reqd: 1, insert_after: 'customer' },
    { fieldname: 'subscription_plan', fieldtype: 'Link', options: 'Subscription Plan', label: 'Subscription Plan', insert_after: 'service_item' },
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
      status: 'Open', 
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
    company: erpProject.company,
    service_item: erpProject.service_item,
    subscription_plan: erpProject.subscription_plan,
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

// This function now correctly handles status changes via the `set_status` method.
export async function updateProject({
  sid,
  projectName,
  projectData,
  contactData,
}: {
  sid: string;
  projectName: string;
  projectData: Partial<Project> & { status?: string }; // Allow status to be part of the update
  contactData?: { contactId: string; newEmail?: string; newPhone?: string };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { status, ...otherProjectData } = projectData;

    // Update standard fields first
    if (Object.keys(otherProjectData).length > 0) {
      await fetch(`${ERPNEXT_API_URL}/api/resource/Project/${projectName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': `sid=${sid}` },
        body: JSON.stringify(otherProjectData),
      });
    }

    // If status needs to be updated, use the correct RPC method
    if (status) {
      const statusUpdateData = new URLSearchParams({
        doctype: 'Project',
        docname: projectName,
        status: status,
      });
      await fetch(`${ERPNEXT_API_URL}/api/method/frappe.desk.form.utils.set_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': `sid=${sid}` },
        body: statusUpdateData,
      });
    }

    // Update contact details if provided
    if (contactData && contactData.contactId && (contactData.newEmail || contactData.newPhone)) {
      const contactUpdateResult = await updateContactDetails({
        sid,
        contactId: contactData.contactId,
        newEmail: contactData.newEmail,
        newPhone: contactData.newPhone,
      });
      if (!contactUpdateResult.success) {
        console.warn(`Project updated, but failed to update contact: ${contactUpdateResult.error}`);
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function deleteProject({ sid, projectName }: { sid: string; projectName: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${ERPNEXT_API_URL}/api/resource/Project/${projectName}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', 'Cookie': `sid=${sid}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData._server_messages || 'Failed to delete project from ERPNext.');
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function submitDoc(doctype: string, docname: string, sid: string): Promise<any> {
  const docResult = await fetchFromErpNext<any>({ sid, doctype, docname });
  if (!docResult.success || !docResult.data) {
    throw new Error(`Could not fetch draft document ${docname} to submit.`);
  }

  const response = await fetch(`${ERPNEXT_API_URL}/api/method/frappe.desk.form.save.savedocs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json',
      'Cookie': `sid=${sid}`,
    },
    body: `doc=${encodeURIComponent(JSON.stringify(docResult.data))}&action=Submit`,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.exception || errorData._server_messages || `Failed to submit ${doctype} ${docname}.`);
  }
  return response.json();
}


export async function createAndSendInvoice({ sid, projectName }: { sid: string; projectName: string }): Promise<{ success: boolean; invoiceName?: string; error?: string }> {
  try {
    // 0. Ensure custom fields exist before we do anything else
    const fieldsReady = await ensureSalesInvoiceCustomFieldsExist(sid);
    if (!fieldsReady.success) {
      throw new Error(`Failed to prepare ERPNext for invoicing: ${fieldsReady.error}`);
    }

    // 1. Fetch Project and related data
    const projectResult = await getProjectByName({ sid, projectName });
    if (!projectResult.success || !projectResult.data) {
      throw new Error(projectResult.error || "Project not found.");
    }
    const project = projectResult.data;

    if (project.sales_invoice) {
        return { success: false, error: `An invoice (${project.sales_invoice}) already exists for this project.` };
    }

    if (!project.subscription_plan) {
        return { success: false, error: "Project does not have a subscription plan assigned." };
    }
    
    const planResult = await fetchFromErpNext<SubscriptionPlan>({ sid, doctype: 'Subscription Plan', docname: project.subscription_plan });
    if (!planResult.success || !planResult.data) {
      throw new Error("Linked Subscription Plan details could not be fetched.");
    }
    const plan = planResult.data;

    const customerResult = await fetchFromErpNext<Customer>({ sid, doctype: 'Customer', docname: project.customer });
     if (!customerResult.success || !customerResult.data) {
      throw new Error("Customer details could not be fetched.");
    }
    const customer = customerResult.data;

    // 2. Create Sales Invoice in DRAFT status
    const invoicePayload = {
      customer: project.customer,
      company: project.company,
      items: [{
        item_code: plan.item,
        qty: 1,
        rate: plan.cost,
      }],
      due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      // docstatus: 0 is default for new doc, creating a DRAFT
    };
    
    const invoiceCreationResponse = await postRequest('/api/resource/Sales Invoice', invoicePayload, sid);
    const invoiceName = invoiceCreationResponse.data.name;
    
    // 2a. SUBMIT the newly created Sales Invoice
    await submitDoc('Sales Invoice', invoiceName, sid);

    // 3. Create Xendit Invoice
    const xenditInvoice = await Invoice.createInvoice({
        data: {
            externalId: invoiceName,
            amount: plan.cost,
            payerEmail: customer.email_id || undefined,
            description: `Payment for Project: ${project.project_name}`,
            currency: 'IDR',
        }
    });
    
    if (!xenditInvoice.invoiceUrl || !xenditInvoice.id) {
        throw new Error("Failed to get payment URL from Xendit.");
    }

    // 4. Update Sales Invoice in ERPNext with Xendit details
    await fetch(`${ERPNEXT_API_URL}/api/resource/Sales Invoice/${invoiceName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': `sid=${sid}` },
      body: JSON.stringify({
        xendit_invoice_id: xenditInvoice.id,
        xendit_invoice_url: xenditInvoice.invoiceUrl
      }),
    });

    // 5. Update Project status and link to invoice
    await updateProject({ sid, projectName, projectData: { status: 'Awaiting Payment', sales_invoice: invoiceName }});

    // 6. Send Email
    if (customer.email_id) {
       await sendEmail({
        to: customer.email_id,
        subject: `Invoice for Project: ${project.project_name}`,
        html: `
            <h1>Invoice for Your Project</h1>
            <p>Dear ${customer.customer_name},</p>
            <p>Please find the invoice for your project: <strong>${project.project_name}</strong>.</p>
            <p>Invoice ID: ${invoiceName}</p>
            <p>Amount: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(plan.cost || 0)}</p>
            <p>Click the button below to complete your payment.</p>
            <a href="${xenditInvoice.invoiceUrl}" style="background-color: #FFC72C; color: #1A202C; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Pay Invoice</a>
            <p>Thank you!</p>
        `,
      });
    }

    return { success: true, invoiceName };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectByInvoiceId(sid: string, invoiceId: string): Promise<{ success: boolean; data?: { name: string, project_name: string, customer: string, customer_email?: string }; error?: string }> {
  const filters = [['sales_invoice', '=', invoiceId]];
  const result = await fetchFromErpNext<{ name: string; project_name: string; customer: string; }[]>({
    sid,
    doctype: 'Project',
    fields: ['name', 'project_name', 'customer'],
    filters,
    limit: 1,
  });

  if (!result.success || !result.data || result.data.length === 0) {
    return { success: false, error: result.error || 'Project not found for this Sales Invoice ID.' };
  }
  
  const project = result.data[0];

  // Fetch customer email
  const customerResult = await fetchFromErpNext<any>({ sid, doctype: 'Customer', docname: project.customer, fields: ['email_id'] });
  const customerEmail = customerResult.success ? customerResult.data.email_id : undefined;

  return { success: true, data: { ...project, customer_email: customerEmail } };
}
