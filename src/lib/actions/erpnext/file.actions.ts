'use server';

import { ERPNEXT_API_URL } from './utils';

interface UploadFileToErpNextArgs {
    sid: string;
    formData: FormData;
}

interface UploadFileResponse {
    message: {
        file_url: string;
        name: string;
        is_private: number;
        // ... other properties from ERPNext response
    };
}

export async function uploadFileToErpNext({ sid, formData }: UploadFileToErpNextArgs): Promise<{ success: boolean; file_url?: string; error?: string }> {
    if (!ERPNEXT_API_URL) return { success: false, error: 'ERPNext API URL is not configured.' };
    if (!sid) return { success: false, error: 'Session ID (sid) is required for upload.' };

    try {
        const response = await fetch(`${ERPNEXT_API_URL}/api/method/upload_file`, {
            method: 'POST',
            headers: {
                'Cookie': `sid=${sid}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        const responseData: UploadFileResponse = await response.json();

        if (!response.ok || !responseData.message?.file_url) {
            // @ts-ignore
            const errorMessage = responseData.message || responseData.exception || responseData._server_messages || 'Failed to upload file to ERPNext.';
            return { success: false, error: errorMessage };
        }

        return { success: true, file_url: responseData.message.file_url };
    } catch (error: any) {
        return { success: false, error: `An unexpected error occurred during file upload: ${error.message}` };
    }
}
