
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
  currentFileName?: string | null; // To display if a file is already set from parent
  disabled?: boolean;
  className?: string;
}

export function CustomDropzone({
  onFileChange,
  accept = { 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFileName,
  disabled = false,
  className,
}: CustomDropzoneProps) {
  const [internalFileName, setInternalFileName] = useState<string | null>(null);
  const [isRejectedLocal, setIsRejectedLocal] = useState(false);

  const handleDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setIsRejectedLocal(false); // Reset rejection state on new drop attempt
      if (fileRejections.length > 0) {
        console.error('File rejected by react-dropzone:', fileRejections);
        onFileChange(null);
        setInternalFileName(null);
        setIsRejectedLocal(true);
        // You might want to show a toast here for user feedback
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileChange(file);
        setInternalFileName(file.name);
      } else {
        // This case might occur if drop is cancelled or empty
        onFileChange(null);
        setInternalFileName(null);
      }
    },
    [onFileChange]
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
  };

  // Show internalFileName if a new file is selected, otherwise show currentFileName (from parent)
  const effectiveFileName = internalFileName || currentFileName;

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
          // Allows clicking the dropzone to open the file dialog even if a file is selected
          // If you want to force using the "Change File" button, you could add:
          // if (effectiveFileName && !disabled) { e.stopPropagation(); }
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
            Accepted: PNG, JPG, GIF, WEBP, AVIF (Max {maxSize / (1024 * 1024)}MB)
          </p>
          {(isDragReject || isRejectedLocal) && !disabled && (
             <p className="text-xs text-destructive mt-1 font-medium">File type not accepted or file is too large.</p>
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
