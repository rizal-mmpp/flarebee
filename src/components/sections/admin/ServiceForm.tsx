
'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import React, { useState } from 'react'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceFormValues } from './ServiceFormTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageIcon, FileText, Settings, UploadCloud, Library, Link as LinkIcon, Monitor, Trash2 } from 'lucide-react';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategorySelector } from '@/components/admin/services/CategorySelector';
import { Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import NextLink from 'next/link';

interface ServiceFormProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
  watch: UseFormWatch<ServiceFormValues>;
  setValue: UseFormSetValue<ServiceFormValues>;
  getValues: UseFormGetValues<ServiceFormValues>;
  currentImageUrl?: string | null; 
  onFileChange: (file: File | null) => void; 
  selectedFileName?: string | null; 
  isEditMode?: boolean;
}

export function ServiceForm({
  control,
  register,
  errors,
  watch,
  setValue,
  getValues,
  currentImageUrl,
  onFileChange,
  selectedFileName, 
  isEditMode = false,
}: ServiceFormProps) {
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleModalFileChange = (file: File | null) => {
    onFileChange(file);
    // Keep modal open for confirmation, or close it if a file is selected.
    // Let's close it for a simpler flow.
    if (file) {
      setIsUploadModalOpen(false);
    }
  };

  const handleRemoveImage = () => {
    onFileChange(null);
    setValue('imageUrl', ''); // Explicitly clear the URL
  };


  return (
    <>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4 hidden sm:inline-block"/>General</TabsTrigger>
          <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4 hidden sm:inline-block"/>Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>General Information</CardTitle><CardDescription>Core details that define and categorize the service.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Service Title</Label>
                <Input id="title" {...register('title')} className="mt-1" placeholder="e.g., Business Profile Website Design"/>
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <CategorySelector 
                          value={field.value} 
                          onChange={field.onChange} 
                          className="mt-1"
                          hasError={!!errors.categoryId}
                        />
                      )}
                    />
                  {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || 'draft'}>
                      <SelectTrigger id="status" className={cn("mt-1", errors.status && "border-destructive")}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {['active', 'inactive', 'draft'].map(stat => (
                          <SelectItem key={stat} value={stat} className="capitalize">{stat.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}/>
                  {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
                </div>
              </div>
              
              <div>
                <Label>Service Image</Label>
                 <div className="mt-2 flex items-center gap-4">
                  {currentImageUrl ? (
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                      <Image src={currentImageUrl} alt="Service preview" fill style={{objectFit:'cover'}} />
                    </div>
                  ) : (
                    <div className="w-40 h-24 rounded-lg bg-muted flex items-center justify-center border border-dashed flex-shrink-0">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-2">
                     <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                       <UploadCloud className="mr-2 h-4 w-4" /> Change Image
                    </Button>
                    <p className="text-xs text-muted-foreground">Recommended: 16:9 aspect ratio, &lt;1MB.</p>
                  </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Detailed descriptions for the public service page.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div><Label htmlFor="shortDescription">Short Description</Label><Textarea id="shortDescription" {...register('shortDescription')} rows={3} className="mt-1" placeholder="A concise summary of the service."/>{errors.shortDescription && <p className="text-sm text-destructive mt-1">{errors.shortDescription.message}</p>}</div>
              <div><Label htmlFor="longDescription">Detailed Description</Label><Textarea id="longDescription" {...register('longDescription')} rows={8} className="mt-1" placeholder="Use Markdown for formatting."/>{errors.longDescription && <p className="text-sm text-destructive mt-1">{errors.longDescription.message}</p>}</div>
              <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" {...register('tags')} className="mt-1" placeholder="e.g., web design, n8n, openai" />{errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}</div>
              <div>
                <Label htmlFor="serviceUrl">Service Management URL</Label>
                <Input id="serviceUrl" type="url" {...register('serviceUrl')} className="mt-1" placeholder="e.g., https://app.webflow.com/dashboard/..." />
                <p className="text-xs text-muted-foreground mt-1">Optional: A link for admins to manage the provisioned service externally.</p>
                {errors.serviceUrl && <p className="text-sm text-destructive mt-1">{errors.serviceUrl.message}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Service Image</DialogTitle>
            <DialogDescription>
              Drag and drop a file, upload from your device, or select from the asset library.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <CustomDropzone
              onFileChange={handleModalFileChange}
              accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }}
              maxSize={1 * 1024 * 1024}
            />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button type="button" variant="outline" asChild>
                <NextLink href="/admin/assets" target="_blank">
                  <Library className="mr-2 h-4 w-4" /> Select from Library
                </NextLink>
              </Button>
               {currentImageUrl && (
                <Button type="button" variant="destructive" onClick={handleRemoveImage}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove Current Image
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
