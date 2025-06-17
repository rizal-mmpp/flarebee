
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle, ExternalLink, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
import type { PutBlobResult } from '@vercel/blob';
import Image from 'next/image';
import Link from 'next/link';

export default function FileUploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; data?: PutBlobResult; error?: string } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setUploadResult(null); // Reset previous result
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUploadResult({ success: false, error: 'Please select a file to upload.' });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadFileToVercelBlob(formData);
    setUploadResult(result);
    setIsUploading(false);

    if (result.success) {
      setFile(null); // Clear file input on success
      // Consider resetting the input field visually if needed:
      // (event.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UploadCloud className="h-7 w-7 text-primary mr-3" />
            Vercel Blob File Upload Test
          </CardTitle>
          <CardDescription>
            Test uploading files to Vercel Blob storage. Ensure your project is linked to a Vercel account and a Blob store is created.
            The <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">BLOB_READ_WRITE_TOKEN</code> must be available.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="fileUpload" className="text-base">Select File</Label>
              <Input 
                id="fileUpload" 
                type="file" 
                onChange={handleFileChange} 
                className="mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isUploading}
              />
              {file && <p className="text-sm text-muted-foreground mt-2">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
            </div>
            
            <Button type="submit" disabled={isUploading || !file} className="w-full sm:w-auto" size="lg">
              {isUploading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-5 w-5" />
              )}
              Upload to Vercel Blob
            </Button>

            {uploadResult && (
              <div className="mt-6">
                {uploadResult.success && uploadResult.data ? (
                  <Alert variant="default" className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-700">Upload Successful!</AlertTitle>
                    <AlertDescription className="text-green-600/90 space-y-2">
                      <p>Your file has been uploaded to Vercel Blob.</p>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        <Link href={uploadResult.data.url} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-green-700 break-all">
                          {uploadResult.data.url}
                        </Link>
                      </div>
                      <p className="text-xs">Pathname: {uploadResult.data.pathname}</p>
                      {file?.type.startsWith('image/') && uploadResult.data.url && (
                        <div className="mt-3 p-2 border border-green-300 rounded-md bg-green-500/5 max-w-xs">
                           <ImageIcon className="h-4 w-4 text-green-600 mb-1" />
                          <Image 
                            src={uploadResult.data.url} 
                            alt="Uploaded image preview" 
                            width={200} 
                            height={150} 
                            className="rounded-md object-contain max-h-[150px]"
                           />
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Upload Failed</AlertTitle>
                    <AlertDescription>
                      {uploadResult.error || 'An unknown error occurred.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </form>
        <CardFooter>
            <p className="text-xs text-muted-foreground pt-4">
                This page uses Vercel Blob for file storage. Files uploaded here will be publicly accessible via the generated URL.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
