
"use client";

import * as React from "react";
import * as fileUpload from "@zag-js/file-upload";
import { useMachine, normalizeProps } from "@zag-js/react";
import { Button } from "@/components/ui/button";
import { UploadCloud, XCircle, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CustomFileUploadProps {
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  currentFileName?: string | null;
  disabled?: boolean;
  label?: React.ReactNode;
}

export function CustomFileUpload({
  onFileChange,
  accept = "image/*",
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFileName,
  disabled,
  label = "Drag 'n' drop image here, or click to select",
}: CustomFileUploadProps) {
  const { toast } = useToast();
  const [internalFileName, setInternalFileName] = React.useState<string | null>(null);

  const [state, send] = useMachine(
    fileUpload.machine({
      id: React.useId(),
      accept,
      maxFiles,
      maxSize,
      onFileAccept: (details) => {
        const file = details.files.length > 0 ? details.files[0] : null;
        setInternalFileName(file ? file.name : null);
        onFileChange(file);
      },
      onFileReject: (details) => {
        const rejectionReason = details.rejectedFiles[0]?.errors[0]?.message || "File rejected";
        toast({
          title: "File Upload Error",
          description: rejectionReason,
          variant: "destructive",
        });
        if (api.files.length === 0 && !currentFileName) {
          setInternalFileName(null);
        }
        onFileChange(null); // Ensure parent is notified of cleared/rejected selection
      },
      onFileChange: (details) => {
         // This callback can be used if you need to react to any file change,
         // including additions or removals from Zag's internal state.
         // For simplicity, we primarily rely on onFileAccept and manual clearing.
        if (details.files.length === 0 && !currentFileName) {
            setInternalFileName(null);
        } else if (details.files.length > 0) {
            setInternalFileName(details.files[0].name);
        }
      }
    })
  );

  const api = fileUpload.connect(state, send, normalizeProps);

  const handleClearFile = () => {
    api.clearFiles(); // Clears Zag's internal file state
    setInternalFileName(null);
    onFileChange(null); // Notifies parent
  };

  // Determine what file name to display
  const displayFileName = internalFileName || currentFileName;
  const fileToShow = api.files.length > 0 ? api.files[0] : null;

  return (
    <div {...api.rootProps} className="space-y-3">
      <div
        {...api.dropzoneProps}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
          "border-input hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background",
          api.isDragging && "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2",
          disabled && "opacity-60 cursor-not-allowed bg-muted/50 hover:border-input"
        )}
        aria-disabled={disabled}
      >
        <UploadCloud
          className={cn(
            "w-10 h-10 mb-3",
            api.isDragging ? "text-primary" : "text-muted-foreground",
            disabled && "text-muted-foreground/70"
          )}
        />
        <p
          className={cn(
            "text-sm text-center",
            api.isDragging ? "text-primary font-medium" : "text-muted-foreground",
             disabled && "text-muted-foreground/70"
          )}
        >
          {api.isDragging ? "Drop image here" : label}
        </p>
        <input {...api.hiddenInputProps} disabled={disabled} />
        {!api.isDragging && (
             <Button
                type="button"
                variant="link"
                {...api.triggerProps}
                className="mt-1 text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground/70"
                disabled={disabled}
                onClick={(e) => {
                    if(disabled) e.preventDefault();
                    else api.triggerProps.onClick?.(e);
                }}
            >
                Or select a file
            </Button>
        )}
        
        {accept && (
            <p className={cn("text-xs text-muted-foreground/80 mt-2 text-center", disabled && "text-muted-foreground/60")}>
                Accepted: {accept.split(',').map(a => a.trim()).join(', ')}
            </p>
        )}
        {maxSize && (
            <p className={cn("text-xs text-muted-foreground/80 mt-0.5", disabled && "text-muted-foreground/60")}>
                Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </p>
        )}
      </div>

      {displayFileName && (
        <div className="p-3 border border-border rounded-lg bg-card flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <span
              className="text-sm text-foreground truncate"
              title={displayFileName}
            >
              {displayFileName}
            </span>
            {fileToShow && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                ({(fileToShow.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearFile}
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive/90 disabled:opacity-50"
            aria-label="Clear selected file"
            disabled={disabled}
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
      )}
      {api.rejectedFiles.length > 0 && (
        <div className="p-3 border border-destructive rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">File Rejected:</p>
            <ul className="list-disc list-inside text-xs">
              {api.rejectedFiles.map((rejection, idx) => (
                <li key={`${rejection.file.name}-${idx}`}>
                  {rejection.file.name}: {rejection.errors.map(e => e.message).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
