'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadFileToErpNext } from '@/lib/actions/erpnext/file.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Loader2, UploadCloud, File as FileIcon, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadComplete: (fileUrl: string) => void;
  allowedFileTypes?: { [key: string]: string[] };
}

export function FileUploadModal({
  isOpen,
  onOpenChange,
  onUploadComplete,
  allowedFileTypes = { 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] },
}: FileUploadModalProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPrivate, setIsPrivate] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile || !erpSid) {
      toast({ title: "Error", description: "No file selected or you are not logged in.", variant: "destructive" });
      return;
    }

    startUploadTransition(async () => {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);
      formData.append('is_private', isPrivate ? '1' : '0');

      // Simulate progress for user feedback as we can't track stream from server action easily
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const result = await uploadFileToErpNext({ sid: erpSid, formData });
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.file_url) {
        toast({ title: "Upload Successful", description: `File "${selectedFile.name}" uploaded.` });
        onUploadComplete(result.file_url);
        onOpenChange(false);
      } else {
        toast({ title: "Upload Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
        setUploadProgress(0);
      }
    });
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };
  
  // Reset state when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      clearFileSelection();
    }
  }, [isOpen]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Select a file to upload to your ERPNext file storage.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!selectedFile ? (
            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors", isDragActive && "border-primary bg-primary/10")}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UploadCloud className="h-10 w-10" />
                <p className="font-semibold">Drag & drop file here</p>
                <p className="text-xs">or</p>
                <Button type="button" variant="outline" size="sm">Click to select file</Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3">
                <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm font-medium truncate" title={selectedFile.name}>{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={clearFileSelection} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_private" className="text-sm font-medium text-muted-foreground">
                  Private
                </Label>
              </div>
              {isUploading && (
                <div className="flex items-center gap-3">
                   <Progress value={uploadProgress} className="w-full h-2" />
                   <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isUploading}>Cancel</Button></DialogClose>
          <Button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
