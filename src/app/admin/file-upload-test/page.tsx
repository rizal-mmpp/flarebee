
'use client';

import { useState, type FormEvent, useEffect, useCallback, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle, ExternalLink, ImageIcon, LinkIcon, RefreshCw, ServerCrash, FolderClosed, Archive, Copy, Trash2, FileText as FileTextIcon, Eye, Info as InfoIcon } from 'lucide-react';
import { uploadFileToVercelBlob, listVercelBlobFiles, deleteVercelBlobFile } from '@/lib/actions/vercelBlob.actions';
import type { PutBlobResult, ListBlobResultBlob } from '@vercel/blob';
import NextImage from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { format } from 'date-fns';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const isImagePath = (pathname: string): boolean => {
  if (!pathname) return false;
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(pathname);
};


export default function AssetsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadResult, setUploadResult] = useState<{ success: boolean; data?: PutBlobResult; error?: string } | null>(null);

  const [listedBlobs, setListedBlobs] = useState<ListBlobResultBlob[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isTransitionPending, startDeleteTransition] = useTransition();
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [imageToPreviewUrl, setImageToPreviewUrl] = useState<string | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [blobForDetails, setBlobForDetails] = useState<ListBlobResultBlob | null>(null);


  const handleFetchListedFiles = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    const result = await listVercelBlobFiles({ limit: 100 });
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

  const handleImmediateDelete = async (blobToDelete: ListBlobResultBlob) => {
    if (!blobToDelete) return;
    const blobPath = blobToDelete.pathname; 
    const blobUrlToDelete = blobToDelete.url; 

    setDeletingUrl(blobUrlToDelete); 

    startDeleteTransition(async () => {
      let wasSuccessful = false;
      try {
        const result = await deleteVercelBlobFile(blobUrlToDelete);
        if (result.success) {
          toast({ title: "Asset Deleted", description: `${blobPath} has been deleted.` });
          wasSuccessful = true;
        } else {
          toast({ title: "Delete Failed", description: result.error || "Could not delete asset.", variant: "destructive" });
        }
      } catch (e) {
         toast({ title: "Delete Operation Error", description: (e as Error).message || "An error occurred.", variant: "destructive" });
      } finally {
        setDeletingUrl(null);     
      }
    });
  };


  const openPreviewModal = (url: string) => {
    setImageToPreviewUrl(url);
    setIsPreviewModalOpen(true);
  };

  const openDetailsModal = (blob: ListBlobResultBlob) => {
    setBlobForDetails(blob);
    setIsDetailsModalOpen(true);
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
            Upload files to Vercel Blob storage. Max file size: 1MB.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="fileUpload" className="text-base">Select File</Label>
              <CustomDropzone
                onFileChange={handleFileChange}
                currentFileName={file?.name}
                accept={{}} 
                maxSize={1 * 1024 * 1024} 
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
                      {isImagePath(uploadResult.data.pathname) && (
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
                    Showing up to 100 most recent assets. Right-click for options.
                </CardDescription>
            </div>
            <Button onClick={handleFetchListedFiles} disabled={isLoadingList || isTransitionPending} variant="outline">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4">
                    {listedBlobs.map((blob) => (
                       <ContextMenu key={blob.url}>
                        <ContextMenuTrigger asChild>
                            <Card 
                                className="group relative overflow-hidden rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                onClick={() => isImagePath(blob.pathname) && openPreviewModal(blob.url)}
                            >
                                <CardContent className="p-0 aspect-square flex items-center justify-center bg-muted/30 rounded-t-lg overflow-hidden">
                                    <div className="relative w-full h-full rounded-t-lg overflow-hidden">
                                        {isImagePath(blob.pathname) ? (
                                            <NextImage
                                                src={blob.url}
                                                alt={blob.pathname}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileTextIcon className="h-16 w-16 text-muted-foreground/70" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-1.5">
                                  <p className="text-xs text-white truncate font-medium" title={blob.pathname.split('/').pop()}>
                                    {blob.pathname.split('/').pop()}
                                  </p>
                                </div>
                            </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56">
                            {isImagePath(blob.pathname) && (
                                <ContextMenuItem onClick={() => openPreviewModal(blob.url)}>
                                    <Eye className="mr-2 h-4 w-4" /> Preview Image
                                </ContextMenuItem>
                            )}
                            <ContextMenuItem onClick={() => openDetailsModal(blob)}>
                                <InfoIcon className="mr-2 h-4 w-4" /> View Details
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleCopyUrl(blob.url)}>
                                <Copy className="mr-2 h-4 w-4" /> Copy URL
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleImmediateDelete(blob)}
                                disabled={isTransitionPending && deletingUrl === blob.url}
                            >
                                {(isTransitionPending && deletingUrl === blob.url) ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete Asset
                            </ContextMenuItem>
                        </ContextMenuContent>
                       </ContextMenu>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only"> 
             <DialogTitle>Asset Preview</DialogTitle>
             <DialogDescription>Full preview of the selected asset.</DialogDescription>
          </DialogHeader>
          {imageToPreviewUrl && (
            <div className="relative w-full aspect-video">
                <NextImage 
                    src={imageToPreviewUrl} 
                    alt="Asset preview" 
                    fill 
                    className="object-contain rounded-md"
                />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center"><InfoIcon className="mr-2 h-5 w-5 text-primary"/>Asset Details</DialogTitle>
                <DialogDescription>Metadata for the selected asset.</DialogDescription>
            </DialogHeader>
            {blobForDetails && (
                <div className="space-y-2 py-2 text-sm">
                    <p><strong className="font-medium text-foreground/80">Filename:</strong> <span className="text-muted-foreground break-all">{blobForDetails.pathname}</span></p>
                    <p><strong className="font-medium text-foreground/80">URL:</strong> <Link href={blobForDetails.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{blobForDetails.url.substring(0,40)}...</Link></p>
                    <p><strong className="font-medium text-foreground/80">Size:</strong> <span className="text-muted-foreground">{(blobForDetails.size / 1024).toFixed(2)} KB</span></p>
                    <p><strong className="font-medium text-foreground/80">Uploaded:</strong> <span className="text-muted-foreground">{format(new Date(blobForDetails.uploadedAt), "PPp")}</span></p>
                </div>
            )}
             <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
    

    




