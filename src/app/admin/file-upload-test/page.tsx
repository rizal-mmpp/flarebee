
'use client';

import { useState, type FormEvent, useEffect, useCallback, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle, ExternalLink, ImageIcon, LinkIcon, RefreshCw, ServerCrash, FolderClosed, Archive, Copy, Trash2, FileText as FileTextIcon, Info } from 'lucide-react';
import { uploadFileToVercelBlob, listVercelBlobFiles, deleteVercelBlobFile } from '@/lib/actions/vercelBlob.actions';
import type { PutBlobResult, ListBlobResultBlob } from '@vercel/blob';
import NextImage from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

// Helper function to check for image extensions
const isImagePath = (pathname: string): boolean => {
  return /\.(png|jpe?g|gif|webp|avif)$/i.test(pathname);
};

export default function AssetsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadResult, setUploadResult] = useState<{ success: boolean; data?: PutBlobResult; error?: string } | null>(null);

  const [listedBlobs, setListedBlobs] = useState<ListBlobResultBlob[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isDeleting, startDeleteTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [blobToDelete, setBlobToDelete] = useState<ListBlobResultBlob | null>(null);


  const handleFetchListedFiles = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    const result = await listVercelBlobFiles({ limit: 100 }); // Increased limit
    if (result.success && result.data) {
      setListedBlobs(result.data.blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
    } else {
      setListError(result.error || 'Failed to fetch file list.');
      setListedBlobs([]);
    }
    setIsLoadingList(false);
  }, []);

  useEffect(() => {
    handleFetchListedFiles();
  }, [handleFetchListedFiles]);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setUploadResult(null); 
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUploadResult({ success: false, error: 'Please select a file to upload.' });
      return;
    }

    startUploadTransition(async () => {
      setUploadResult(null);
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadFileToVercelBlob(formData);
      setUploadResult(result);
      if (result.success) {
        setFile(null); 
        (event.target as HTMLFormElement).reset(); 
        handleFetchListedFiles(); 
         toast({ title: "Upload Successful", description: `${file.name} has been uploaded.` });
      } else {
        toast({ title: "Upload Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
      }
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => toast({ title: "URL Copied!", description: "Asset URL copied to clipboard." }))
      .catch(err => toast({ title: "Copy Failed", description: "Could not copy URL.", variant: "destructive" }));
  };

  const handleDeleteClick = (blob: ListBlobResultBlob) => {
    setBlobToDelete(blob);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!blobToDelete) return;
    startDeleteTransition(async () => {
      const result = await deleteVercelBlobFile(blobToDelete.url);
      if (result.success) {
        toast({ title: "Asset Deleted", description: `${blobToDelete.pathname} has been deleted.` });
        handleFetchListedFiles(); // Refresh the list
      } else {
        toast({ title: "Delete Failed", description: result.error || "Could not delete asset.", variant: "destructive" });
      }
      setShowDeleteDialog(false);
      setBlobToDelete(null);
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UploadCloud className="h-7 w-7 text-primary mr-3" />
            Upload New Asset
          </CardTitle>
          <CardDescription>
            Upload files to Vercel Blob storage. Ensure your project is linked, a Blob store is created, and the 
            <code className="font-mono bg-muted px-1 py-0.5 rounded-sm text-xs">BLOB_READ_WRITE_TOKEN</code> is available.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="fileUpload" className="text-base">Select File</Label>
              <CustomDropzone
                onFileChange={handleFileChange}
                currentFileName={file?.name}
                accept={{}} // Accept all file types by passing an empty object
                maxSize={10 * 1024 * 1024} // 10MB limit example
                className="mt-2"
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

            {uploadResult && !isUploading && (
              <div className="mt-6">
                {uploadResult.success && uploadResult.data ? (
                  <Alert variant="default" className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-700">Upload Successful!</AlertTitle>
                    <AlertDescription className="text-green-600/90 space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        <Link href={uploadResult.data.url} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-green-700 break-all">
                          {uploadResult.data.url}
                        </Link>
                      </div>
                      {uploadResult.data.contentType?.startsWith('image/') && uploadResult.data.url && (
                        <div className="mt-3 p-2 border border-green-300 rounded-md bg-green-500/5 max-w-xs">
                           <ImageIcon className="h-4 w-4 text-green-600 mb-1" />
                          <NextImage 
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
      </Card>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl flex items-center">
                    <Archive className="h-7 w-7 text-primary mr-3" />
                    Asset Library
                </CardTitle>
                <CardDescription>
                    Showing up to 100 most recent assets from your Blob store.
                </CardDescription>
            </div>
            <Button onClick={handleFetchListedFiles} disabled={isLoadingList || isDeleting} variant="outline">
                {isLoadingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh List
            </Button>
        </CardHeader>
        <CardContent>
            {isLoadingList ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Loading asset library...</p>
                </div>
            ) : listError ? (
                <Alert variant="destructive" className="mt-4">
                    <ServerCrash className="h-5 w-5" />
                    <AlertTitle>Error Fetching Asset List</AlertTitle>
                    <AlertDescription>{listError}</AlertDescription>
                </Alert>
            ) : listedBlobs.length === 0 ? (
                 <div className="text-center py-10">
                    <FolderClosed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">No assets found in Vercel Blob.</p>
                    <p className="text-sm text-muted-foreground">Try uploading an asset using the form above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {listedBlobs.map((blob) => (
                        <Card key={blob.url} className="flex flex-col group relative">
                            <CardContent className="p-2 aspect-square flex items-center justify-center bg-muted/30 rounded-t-lg">
                                {isImagePath(blob.pathname) ? (
                                    <div className="relative w-full h-full rounded-md overflow-hidden">
                                        <NextImage
                                            src={blob.url}
                                            alt={blob.pathname}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileTextIcon className="h-16 w-16 text-muted-foreground/70" />
                                    </div>
                                )}
                            </CardContent>
                            
                            <div className="absolute top-1 right-1 z-10">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background text-muted-foreground hover:text-primary rounded-full shadow"
                                        aria-label="View asset details"
                                    >
                                        <Info className="h-4 w-4" />
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-60 text-xs p-3 space-y-1 shadow-xl border-border/70">
                                        <p className="font-semibold text-foreground truncate mb-1.5" title={blob.pathname}>
                                            {blob.pathname}
                                        </p>
                                        <p className="text-muted-foreground">
                                            <span className="font-medium">Uploaded:</span> {format(new Date(blob.uploadedAt), "PPp")}
                                        </p>
                                        <p className="text-muted-foreground">
                                            <span className="font-medium">Size:</span> {(blob.size / 1024).toFixed(2)} KB
                                        </p>
                                        {/* contentType is not available in ListBlobResultBlob, so it's removed here */}
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <CardFooter className="p-2 border-t flex items-center justify-end gap-1.5 rounded-b-lg">
                                <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(blob.url)} className="h-7 w-7 text-muted-foreground hover:text-primary" title="Copy URL">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(blob)} className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete Asset" disabled={isDeleting}>
                                  {isDeleting && blobToDelete?.url === blob.url ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the asset "{blobToDelete?.pathname}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4"/>}
              Delete Asset
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    