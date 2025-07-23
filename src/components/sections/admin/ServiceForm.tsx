
'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import React from 'react'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '@/lib/constants';
import type { ServiceFormValues } from './ServiceFormTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageIcon, DollarSign, HelpCircle, FileText, Settings, Info } from 'lucide-react';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  const MAX_FILE_SIZE_BYTES = 0.95 * 1024 * 1024; 

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4 hidden sm:inline-block"/>General</TabsTrigger>
        <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4 hidden sm:inline-block"/>Content</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader><CardTitle>General Information</CardTitle><CardDescription>Core details that define and categorize the service.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="title">Service Title *</Label><Input id="title" {...register('title')} className="mt-1" placeholder="e.g., Business Profile Website Design"/>{errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="categoryId">Service Category *</Label><Controller name="categoryId" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger id="categoryId" className={cn("mt-1", errors.categoryId && "border-destructive")}><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{SERVICE_CATEGORIES.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select>)}/>{errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}</div>
              <div><Label htmlFor="status">Status *</Label><Controller name="status" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || 'draft'}><SelectTrigger id="status" className={cn("mt-1", errors.status && "border-destructive")}><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map(stat => (<SelectItem key={stat} value={stat} className="capitalize">{stat.replace('_', ' ')}</SelectItem>))}</SelectContent></Select>)}/>{errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}</div>
            </div>
            <div>
                <Label htmlFor="price">Standard Rate (IDR)</Label>
                <Input id="price" {...register('pricing.fixedPriceDetails.price', { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 500000"/>
                <p className="text-xs text-muted-foreground mt-1">This sets the default price. Use Item Price in ERPNext for more complex pricing.</p>
                {errors.pricing?.fixedPriceDetails?.price && <p className="text-sm text-destructive mt-1">{errors.pricing.fixedPriceDetails.price.message}</p>}
            </div>
            <div><Label>Service Image *</Label><CustomDropzone onFileChange={onFileChange} currentFileName={selectedFileName} accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }} maxSize={MAX_FILE_SIZE_BYTES} className="mt-1"/><input type="hidden" {...register('imageUrl')} />{errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}</div>
            {currentImageUrl ? (<div className="mt-3 p-2 border border-border rounded-lg bg-muted/50 max-w-xs"><p className="text-xs text-muted-foreground mb-1">Preview:</p><Image src={currentImageUrl} alt="Service image preview" width={200} height={120} style={{objectFit: 'fill'}} className="rounded-md max-h-[120px]" data-ai-hint="service image"/></div>) : !selectedFileName && (<div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs"><ImageIcon className="mx-auto h-8 w-8 mb-1" /><p className="text-xs">Upload an image.</p></div>)}
            <div><Label htmlFor="dataAiHint">AI Hint for Image (Optional)</Label><Input id="dataAiHint" {...register('dataAiHint')} className="mt-1" placeholder="e.g., modern website, ai chat" />{errors.dataAiHint && <p className="text-sm text-destructive mt-1">{errors.dataAiHint.message}</p>}</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="content">
         <Card><CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Detailed descriptions for the public service page.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="shortDescription">Short Description *</Label><Textarea id="shortDescription" {...register('shortDescription')} rows={3} className="mt-1" placeholder="A concise summary of the service."/>{errors.shortDescription && <p className="text-sm text-destructive mt-1">{errors.shortDescription.message}</p>}</div>
            <div><Label htmlFor="longDescription">Detailed Description *</Label><Textarea id="longDescription" {...register('longDescription')} rows={8} className="mt-1" placeholder="Use Markdown for formatting."/>{errors.longDescription && <p className="text-sm text-destructive mt-1">{errors.longDescription.message}</p>}</div>
            <div><Label htmlFor="tags">Tags (comma-separated) *</Label><Input id="tags" {...register('tags')} className="mt-1" placeholder="e.g., web design, n8n, openai" />{errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}</div>
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
  );
}
