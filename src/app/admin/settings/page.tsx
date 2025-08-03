
'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller, type Control, type FieldErrors, type UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Settings as SettingsIcon, Save, Loader2, Image as ImageIcon, Palette, Type, AlertTriangle, Moon, Sun, Contact, Webhook, SlidersHorizontal, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSiteSettings, updateSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { SiteSettings } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { HslColorPicker, type HslColor } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const hslColorStringRegex = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;

const settingsFormSchema = z.object({
  siteTitle: z.string().min(3, 'Site title must be at least 3 characters.'),
  logo: z.instanceof(File).optional().nullable(),
  favicon: z.instanceof(File).optional().nullable(),
  themePrimaryColor: z.string().regex(hslColorStringRegex, 'Must be HSL (e.g., "210 40% 98%")'),
  themeAccentColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  themeBackgroundColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  darkThemePrimaryColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  darkThemeAccentColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  darkThemeBackgroundColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  contactAddress: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email format.").optional().nullable(),
  senderName: z.string().min(2, 'Sender name must be at least 2 characters.'),
  senderEmail: z.string().email('Invalid sender email address.'),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

function hslStringToHslObject(hslString: string): HslColor {
  if (!hslColorStringRegex.test(hslString)) return { h: 0, s: 0, l: 0 };
  const parts = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return { h: 0, s: 0, l: 0 };
  return {
    h: parseInt(parts[1], 10),
    s: parseInt(parts[2], 10),
    l: parseInt(parts[3], 10),
  };
}

function hslObjectToHslString(hslObject: HslColor): string {
  return `${Math.round(hslObject.h)} ${Math.round(hslObject.s)}% ${Math.round(hslObject.l)}%`;
}

function hslStringToCssHsl(hslString: string): string {
  if (!hslColorStringRegex.test(hslString)) return 'hsl(0, 0%, 0%)';
  const parts = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return 'hsl(0, 0%, 0%)';
  return `hsl(${parts[1]}, ${parts[2]}%, ${parts[3]}%)`;
}

interface ColorPickerFieldProps {
  name: keyof SettingsFormValues;
  label: string;
  control: Control<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({ name, label, control, errors, watch }) => {
  const formValue = watch(name) as string;
  const colorForPicker = useMemo(() => hslStringToHslObject(formValue), [formValue]);
  const cssHslColor = useMemo(() => hslStringToCssHsl(formValue), [formValue]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isDarkBg = colorForPicker.l < 50;

  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-button`}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={`${name}-button`}
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-10"
                  style={{
                    backgroundColor: cssHslColor,
                    color: isDarkBg ? 'white' : 'black',
                    borderColor: isDarkBg ? 'hsla(0,0%,100%,0.2)' : 'hsla(0,0%,0%,0.2)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-sm border border-inherit shadow-inner" style={{ backgroundColor: cssHslColor }} />
                    <span>{field.value || "Pick a color"}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-xl" align="start">
                <HslColorPicker
                  color={colorForPicker}
                  onChange={(newHslColor) => {
                    field.onChange(hslObjectToHslString(newHslColor));
                  }}
                  className="!w-[280px]"
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      />
      {errors[name] && <p className="text-sm text-destructive mt-1 text-center">{(errors[name] as any)?.message}</p>}
    </div>
  );
};


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, startSaveTransition] = useTransition();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string | null>(null);
  const [selectedFaviconFile, setSelectedFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const { control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      siteTitle: DEFAULT_SETTINGS.siteTitle,
      logo: null,
      favicon: null,
      themePrimaryColor: DEFAULT_SETTINGS.themePrimaryColor,
      themeAccentColor: DEFAULT_SETTINGS.themeAccentColor,
      themeBackgroundColor: DEFAULT_SETTINGS.themeBackgroundColor,
      darkThemePrimaryColor: DEFAULT_SETTINGS.darkThemePrimaryColor,
      darkThemeAccentColor: DEFAULT_SETTINGS.darkThemeAccentColor,
      darkThemeBackgroundColor: DEFAULT_SETTINGS.darkThemeBackgroundColor,
      contactAddress: DEFAULT_SETTINGS.contactAddress,
      contactPhone: DEFAULT_SETTINGS.contactPhone,
      contactEmail: DEFAULT_SETTINGS.contactEmail,
      senderName: DEFAULT_SETTINGS.senderName,
      senderEmail: DEFAULT_SETTINGS.senderEmail,
    },
  });


  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSettings(true);
      try {
        const settings = await getSiteSettings();
        reset({
          siteTitle: settings.siteTitle,
          logo: null,
          favicon: null,
          themePrimaryColor: settings.themePrimaryColor,
          themeAccentColor: settings.themeAccentColor,
          themeBackgroundColor: settings.themeBackgroundColor,
          darkThemePrimaryColor: settings.darkThemePrimaryColor,
          darkThemeAccentColor: settings.darkThemeAccentColor,
          darkThemeBackgroundColor: settings.darkThemeBackgroundColor,
          contactAddress: settings.contactAddress,
          contactPhone: settings.contactPhone,
          contactEmail: settings.contactEmail,
          senderName: settings.senderName,
          senderEmail: settings.senderEmail,
        });
        setCurrentLogoUrl(settings.logoUrl);
        setLogoPreview(settings.logoUrl);
        setCurrentFaviconUrl(settings.faviconUrl);
        setFaviconPreview(settings.faviconUrl);
      } catch (error) {
        toast({
          title: 'Error Loading Settings',
          description: 'Could not load current site settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, [reset, toast]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedLogoFile) {
      objectUrl = URL.createObjectURL(selectedLogoFile);
      setLogoPreview(objectUrl);
    } else {
      setLogoPreview(currentLogoUrl);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedLogoFile, currentLogoUrl]);

   useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFaviconFile) {
      objectUrl = URL.createObjectURL(selectedFaviconFile);
      setFaviconPreview(objectUrl);
    } else {
      setFaviconPreview(currentFaviconUrl);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFaviconFile, currentFaviconUrl]);

  const handleLogoFileChange = (file: File | null) => {
    setSelectedLogoFile(file);
    setValue('logo', file, { shouldValidate: true });
  };
  
  const handleFaviconFileChange = (file: File | null) => {
    setSelectedFaviconFile(file);
    setValue('favicon', file, { shouldValidate: true });
  };


  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    startSaveTransition(async () => {
      const formData = new FormData();
      formData.append('siteTitle', data.siteTitle);
      formData.append('themePrimaryColor', data.themePrimaryColor);
      formData.append('themeAccentColor', data.themeAccentColor);
      formData.append('themeBackgroundColor', data.themeBackgroundColor);
      formData.append('darkThemePrimaryColor', data.darkThemePrimaryColor);
      formData.append('darkThemeAccentColor', data.darkThemeAccentColor);
      formData.append('darkThemeBackgroundColor', data.darkThemeBackgroundColor);
      formData.append('contactAddress', data.contactAddress || '');
      formData.append('contactPhone', data.contactPhone || '');
      formData.append('contactEmail', data.contactEmail || '');
      formData.append('senderName', data.senderName);
      formData.append('senderEmail', data.senderEmail);

      if (selectedLogoFile) {
        formData.append('logo', selectedLogoFile);
      }
      if (selectedFaviconFile) {
        formData.append('favicon', selectedFaviconFile);
      }

      const result = await updateSiteSettings(formData);

      if (result.success && result.data) {
        toast({
          title: 'Settings Saved',
          description: 'Your site settings have been updated.',
        });
        setCurrentLogoUrl(result.data.logoUrl);
        setLogoPreview(result.data.logoUrl);
        setSelectedLogoFile(null);
        setCurrentFaviconUrl(result.data.faviconUrl);
        setFaviconPreview(result.data.faviconUrl);
        setSelectedFaviconFile(null);
        reset({ // Reset form with new data, ensuring file inputs are cleared
            siteTitle: result.data.siteTitle,
            logo: null,
            favicon: null,
            themePrimaryColor: result.data.themePrimaryColor,
            themeAccentColor: result.data.themeAccentColor,
            themeBackgroundColor: result.data.themeBackgroundColor,
            darkThemePrimaryColor: result.data.darkThemePrimaryColor,
            darkThemeAccentColor: result.data.darkThemeAccentColor,
            darkThemeBackgroundColor: result.data.darkThemeBackgroundColor,
            contactAddress: result.data.contactAddress,
            contactPhone: result.data.contactPhone,
            contactEmail: result.data.contactEmail,
            senderName: result.data.senderName,
            senderEmail: result.data.senderEmail,
        });
      } else {
        toast({
          title: 'Error Saving Settings',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
          Site Settings
        </h1>
        <Button type="submit" className="w-full md:w-auto" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </header>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-5 mb-6">
          <TabsTrigger value="general"><SettingsIcon className="mr-2 h-4 w-4 hidden sm:inline-block" />General</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4 hidden sm:inline-block" />Appearance</TabsTrigger>
          <TabsTrigger value="contact"><Contact className="mr-2 h-4 w-4 hidden sm:inline-block" />Contact</TabsTrigger>
          <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4 hidden sm:inline-block" />Email</TabsTrigger>
          <TabsTrigger value="advanced" disabled><SlidersHorizontal className="mr-2 h-4 w-4 hidden sm:inline-block" />Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your site's title and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="siteTitle">Site Title</Label>
                <Controller
                    name="siteTitle"
                    control={control}
                    render={({ field }) => <Input {...field} id="siteTitle" className="mt-1" />}
                  />
                {errors.siteTitle && <p className="text-sm text-destructive mt-1">{errors.siteTitle.message}</p>}
              </div>
              <div>
                <Label htmlFor="logo">Site Logo</Label>
                <CustomDropzone
                    onFileChange={handleLogoFileChange}
                    currentFileName={selectedLogoFile?.name}
                    accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/svg+xml': ['.svg'], 'image/webp': ['.webp'] }}
                    maxSize={1 * 1024 * 1024}
                    className="mt-1"
                />
                {errors.logo && <p className="text-sm text-destructive mt-1">{errors.logo.message as string}</p>}
                {logoPreview && (
                    <div className="mt-4 p-3 border border-border rounded-lg bg-muted/50 inline-block">
                        <p className="text-xs text-muted-foreground mb-1.5">Logo Preview:</p>
                        <Image src={logoPreview} alt="Logo preview" width={150} height={50} className="rounded-md object-contain max-h-[50px]" />
                    </div>
                )}
                {!logoPreview && (
                  <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
                      <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                      <p className="text-xs">No logo uploaded. Upload a PNG, JPG, SVG, or WEBP (max 1MB).</p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="favicon">Site Favicon (.ico, .png, .svg)</Label>
                <CustomDropzone
                  onFileChange={handleFaviconFileChange}
                  currentFileName={selectedFaviconFile?.name}
                  accept={{ 'image/x-icon': ['.ico'], 'image/png': ['.png'], 'image/svg+xml': ['.svg'] }}
                  maxSize={0.5 * 1024 * 1024} // 500KB limit for favicon
                  className="mt-1"
                />
                {errors.favicon && <p className="text-sm text-destructive mt-1">{errors.favicon.message as string}</p>}
                {faviconPreview ? (
                  <div className="mt-4 p-3 border border-border rounded-lg bg-muted/50 inline-block">
                    <p className="text-xs text-muted-foreground mb-1.5">Favicon Preview:</p>
                    <Image src={faviconPreview} alt="Favicon preview" width={32} height={32} className="rounded-md object-contain" />
                  </div>
                ) : (
                  <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
                    <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                    <p className="text-xs">No favicon uploaded. Defaults to logo or browser icon.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Customize HSL values for light and dark themes (e.g., <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm text-xs">228 100% 98%</code>). Changes apply to <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm text-xs">globals.css</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground/90"><Sun className="mr-2 h-5 w-5 text-yellow-500"/>Light Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                  <ColorPickerField name="themePrimaryColor" label="Primary Color" control={control} errors={errors} watch={watch} />
                  <ColorPickerField name="themeAccentColor" label="Accent Color" control={control} errors={errors} watch={watch} />
                  <ColorPickerField name="themeBackgroundColor" label="Background Color" control={control} errors={errors} watch={watch} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground/90"><Moon className="mr-2 h-5 w-5 text-indigo-400"/>Dark Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                  <ColorPickerField name="darkThemePrimaryColor" label="Primary Color" control={control} errors={errors} watch={watch} />
                  <ColorPickerField name="darkThemeAccentColor" label="Accent Color" control={control} errors={errors} watch={watch} />
                  <ColorPickerField name="darkThemeBackgroundColor" label="Background Color" control={control} errors={errors} watch={watch} />
                </div>
              </div>
              <div className="mt-2 p-3 border border-blue-500/30 bg-blue-500/5 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-blue-600 inline-block mr-2" />
                    <span className="text-xs text-blue-700 dark:text-blue-400">
                        Note: Other theme colors like foregrounds, card colors, etc., are derived or set in <code className="bg-blue-200/50 px-0.5 rounded-sm">globals.css</code>. Adjust them there for finer control if needed.
                    </span>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
                <CardTitle>Shared Contact Information</CardTitle>
                <CardDescription>Manage contact details shown across the site, like in the footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="contactAddress">Business Address</Label>
                    <Controller
                        name="contactAddress"
                        control={control}
                        render={({ field }) => <Textarea {...field} value={field.value ?? ""} id="contactAddress" className="mt-1" placeholder="e.g., Jl. Inovasi No. 1, Jakarta" rows={3} />}
                    />
                    {errors.contactAddress && <p className="text-sm text-destructive mt-1">{errors.contactAddress.message}</p>}
                </div>
                <div>
                    <Label htmlFor="contactPhone">Business Phone</Label>
                    <Controller
                        name="contactPhone"
                        control={control}
                        render={({ field }) => <Input {...field} value={field.value ?? ""} id="contactPhone" className="mt-1" placeholder="e.g., +62 812 3456 7890" />}
                    />
                    {errors.contactPhone && <p className="text-sm text-destructive mt-1">{errors.contactPhone.message}</p>}
                </div>
                <div>
                    <Label htmlFor="contactEmail">Business Email</Label>
                    <Controller
                        name="contactEmail"
                        control={control}
                        render={({ field }) => <Input {...field} value={field.value ?? ""} type="email" id="contactEmail" className="mt-1" placeholder="e.g., info@example.com" />}
                    />
                    {errors.contactEmail && <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
            <Card>
                <CardHeader>
                    <CardTitle>Email Settings</CardTitle>
                    <CardDescription>Configure the default sender details for outgoing system emails (e.g., invoices, notifications). The sender email must be a verified address in Mailjet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="senderName">Default Sender Name</Label>
                        <Input id="senderName" {...control.register('senderName')} placeholder="e.g., RIO Platform" className="mt-1" />
                        {errors.senderName && <p className="text-sm text-destructive mt-1">{errors.senderName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="senderEmail">Default Sender Email</Label>
                        <Input id="senderEmail" type="email" {...control.register('senderEmail')} placeholder="e.g., noreply@yourdomain.com" className="mt-1" />
                        {errors.senderEmail && <p className="text-sm text-destructive mt-1">{errors.senderEmail.message}</p>}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
             <Card>
                <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>Advanced configuration options for the site.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">This section is a placeholder for future advanced settings, such as custom script injection or feature flags.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="pt-6 border-t border-border justify-end">
         <Button type="submit" className="w-full md:w-auto" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Settings
        </Button>
      </CardFooter>
    </form>
  );
}
