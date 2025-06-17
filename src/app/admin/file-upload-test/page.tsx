
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle, ExternalLink, Image as ImageIcon, Link as LinkIcon, RefreshCw, ServerCrash, FolderClosed } from 'lucide-react';
import { uploadFileToVercelBlob, listVercelBlobFiles } from '@/lib/actions/vercelBlob.actions';
import type { PutBlobResult, ListBlobResultBlob } from '@vercel/blob';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function FileUploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; data?: PutBlobResult; error?: string } | null>(null);

  const [listedBlobs, setListedBlobs] = useState<ListBlobResultBlob[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const handleFetchListedFiles = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    const result = await listVercelBlobFiles({ limit: 50 });
    if (result.success && result.data) {
      setListedBlobs(result.data.blobs);
    } else {
      setListError(result.error || 'Failed to fetch file list.');
      setListedBlobs([]);
    }
    setIsLoadingList(false);
  }, []);

  useEffect(() => {
    handleFetchListedFiles();
  }, [handleFetchListedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setUploadResult(null); 
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
      setFile(null); 
      (event.target as HTMLFormElement).reset(); 
      handleFetchListedFiles(); 
    }
  };

  const imageBlobs = listedBlobs.filter(blob => {
    const knownImageContentTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
    ];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

    const lcContentType = blob.contentType?.toLowerCase();
    const lcPathname = blob.pathname.toLowerCase();

    // Check against known content types first
    if (lcContentType && knownImageContentTypes.includes(lcContentType)) {
      return true;
    }
    // Fallback: If content type is missing or not in the known list, check by extension
    if (imageExtensions.some(ext => lcPathname.endsWith(ext))) {
      return true;
    }
    // Broader check for any image/* if content type exists but wasn't in the known list and extension didn't match
    if (lcContentType && lcContentType.startsWith('image/')) {
        return true;
    }
    
    return false;
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UploadCloud className="h-7 w-7 text-primary mr-3" />
            Vercel Blob File Upload Test
          </CardTitle>
          <CardDescription>
            Test uploading files to Vercel Blob storage. Ensure your project is linked to a Vercel account, a Blob store is created, and the 
            <code className="font-mono bg-muted px-1 py-0.5 rounded-sm">BLOB_READ_WRITE_TOKEN</code> is available.
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
                Files uploaded here will be publicly accessible via the generated URL.
            </p>
        </CardFooter>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl flex items-center">
                    <ImageIcon className="h-7 w-7 text-primary mr-3" />
                    Stored Images in Vercel Blob
                </CardTitle>
                <CardDescription>
                    Showing up to 50 most recent image files from your Blob store.
                </CardDescription>
            </div>
            <Button onClick={handleFetchListedFiles} disabled={isLoadingList} variant="outline">
                {isLoadingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh List
            </Button>
        </CardHeader>
        <CardContent>
            {isLoadingList ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Loading image list...</p>
                </div>
            ) : listError ? (
                <Alert variant="destructive" className="mt-4">
                    <ServerCrash className="h-5 w-5" />
                    <AlertTitle>Error Fetching File List</AlertTitle>
                    <AlertDescription>{listError}</AlertDescription>
                </Alert>
            ) : imageBlobs.length === 0 ? (
                 <div className="text-center py-10">
                    <FolderClosed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">No images found in Vercel Blob.</p>
                    <p className="text-sm text-muted-foreground">Try uploading an image using the form above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {imageBlobs.map((blob) => (
                        <div key={blob.url} className="group relative border rounded-lg overflow-hidden aspect-square bg-muted">
                            <Image
                                src={blob.url}
                                alt={blob.pathname}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-xs font-medium truncate" title={blob.pathname}>{blob.pathname}</p>
                                <Link href={blob.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                                    View Raw <ExternalLink className="inline h-3 w-3 ml-0.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
