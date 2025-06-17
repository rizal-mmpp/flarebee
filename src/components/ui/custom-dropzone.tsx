
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { UploadCloud, XCircle, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface CustomDropzoneProps {
  onFileChange: (file: File | null) => void;
  accept?: Accept;
  maxSize?: number; // in bytes
  currentFileName?: string | null; 
  disabled?: boolean;
  className?: string;
}

export function CustomDropzone({
  onFileChange,
  accept = { 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] },
  maxSize = 0.95 * 1024 * 1024, // Default to ~0.95MB
  currentFileName,
  disabled = false,
  className,
}: CustomDropzoneProps) {
  const [internalFileName, setInternalFileName] = useState<string | null>(null);
  const [isRejectedLocal, setIsRejectedLocal] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const handleDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setIsRejectedLocal(false); 
      setRejectionMessage(null);
      if (fileRejections.length > 0) {
        console.error('File rejected by react-dropzone:', fileRejections);
        onFileChange(null);
        setInternalFileName(null);
        setIsRejectedLocal(true);
        const firstRejection = fileRejections[0];
        if (firstRejection.errors && firstRejection.errors.length > 0) {
            if (firstRejection.errors[0].code === 'file-too-large') {
                 setRejectionMessage(`File is too large. Max size: ${(maxSize / (1024 * 1024)).toFixed(2)}MB.`);
            } else if (firstRejection.errors[0].code === 'file-invalid-type') {
                 setRejectionMessage('Invalid file type.');
            } else {
                 setRejectionMessage(firstRejection.errors[0].message || 'File rejected.');
            }
        } else {
            setRejectionMessage('File rejected.');
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileChange(file);
        setInternalFileName(file.name);
      } else {
        onFileChange(null);
        setInternalFileName(null);
      }
    },
    [onFileChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } =
    useDropzone({
      onDrop: handleDrop,
      accept,
      maxSize,
      multiple: false,
      disabled,
    });

  const clearFile = () => {
    onFileChange(null);
    setInternalFileName(null);
    setIsRejectedLocal(false);
    setRejectionMessage(null);
  };

  const effectiveFileName = internalFileName || currentFileName;
  const displayMaxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);

  const dropzoneBaseStyle = "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const dropzoneActiveStyle = "border-primary bg-primary/10";
  const dropzoneAcceptStyle = "border-green-500 bg-green-500/10 text-green-700";
  const dropzoneRejectStyle = "border-destructive bg-destructive/10 text-destructive";

  const dropzoneClasses = cn(
    dropzoneBaseStyle,
    disabled && "bg-muted/50 cursor-not-allowed opacity-70 border-muted",
    !disabled && isDragActive && dropzoneActiveStyle,
    !disabled && isDragAccept && dropzoneAcceptStyle,
    !disabled && (isDragReject || isRejectedLocal) && dropzoneRejectStyle,
    className
  );

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={dropzoneClasses}
        onClick={(e) => {
          // Allow clicking to open file dialog
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud
            className={cn(
              "h-10 w-10 text-muted-foreground",
              !disabled && isDragAccept && "text-green-600",
              !disabled && (isDragReject || isRejectedLocal) && "text-destructive"
            )}
          />
          {isDragActive && !disabled ? (
            <p className="font-semibold text-sm">Drop the file here...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Drag & drop an image here, or
              <Button
                type="button"
                variant="link"
                className="ml-1 p-0 h-auto text-primary hover:underline text-sm"
                onClick={(e) => {
                  e.stopPropagation(); 
                  if (!disabled) open();
                }}
                disabled={disabled}
              >
                click to select
              </Button>
            </p>
          )}
          <p className="text-xs text-muted-foreground/80">
            Accepted: PNG, JPG, GIF, WEBP, AVIF (Max {displayMaxSizeMB}MB)
          </p>
          {(isDragReject || isRejectedLocal) && !disabled && rejectionMessage && (
             <p className="text-xs text-destructive mt-1 font-medium">{rejectionMessage}</p>
          )}
        </div>
      </div>

      {effectiveFileName && !disabled && (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-2.5 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate text-foreground" title={effectiveFileName}>
              {effectiveFileName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={open}
                disabled={disabled}
                className="h-8 text-xs px-3"
            >
                Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Clear selected file"
              disabled={disabled}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
