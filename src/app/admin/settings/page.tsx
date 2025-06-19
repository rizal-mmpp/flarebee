
'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Settings as SettingsIcon, Save, Loader2, Image as ImageIcon, Palette, Type, AlertTriangle, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSiteSettings, updateSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { SiteSettings } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

import { HslColorPicker, type HslColor } from 'react-colorful';


const hslColorStringRegex = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;

const settingsFormSchema = z.object({
  siteTitle: z.string().min(3, 'Site title must be at least 3 characters.'),
  logo: z.instanceof(File).optional().nullable(),
  themePrimaryColor: z.string().regex(hslColorStringRegex, 'Must be HSL (e.g., "210 40% 98%")'),
  themeAccentColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  themeBackgroundColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  darkThemePrimaryColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  darkThemeAccentColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
  darkThemeBackgroundColor: z.string().regex(hslColorStringRegex, 'Must be HSL'),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;


// Helper to convert HSL string "H S% L%" to react-colorful HSL object {h, s, l} (s, l are 0-100)
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

// Helper to convert react-colorful HSL object {h, s, l} to HSL string "H S% L%"
function hslObjectToHslString(hslObject: HslColor): string {
  return `${Math.round(hslObject.h)} ${Math.round(hslObject.s)}% ${Math.round(hslObject.l)}%`;
}


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, startSaveTransition] = useTransition();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      siteTitle: DEFAULT_SETTINGS.siteTitle,
      logo: null,
      themePrimaryColor: DEFAULT_SETTINGS.themePrimaryColor,
      themeAccentColor: DEFAULT_SETTINGS.themeAccentColor,
      themeBackgroundColor: DEFAULT_SETTINGS.themeBackgroundColor,
      darkThemePrimaryColor: DEFAULT_SETTINGS.darkThemePrimaryColor,
      darkThemeAccentColor: DEFAULT_SETTINGS.darkThemeAccentColor,
      darkThemeBackgroundColor: DEFAULT_SETTINGS.darkThemeBackgroundColor,
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
          themePrimaryColor: settings.themePrimaryColor,
          themeAccentColor: settings.themeAccentColor,
          themeBackgroundColor: settings.themeBackgroundColor,
          darkThemePrimaryColor: settings.darkThemePrimaryColor,
          darkThemeAccentColor: settings.darkThemeAccentColor,
          darkThemeBackgroundColor: settings.darkThemeBackgroundColor,
        });
        setCurrentLogoUrl(settings.logoUrl);
        setLogoPreview(settings.logoUrl);
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


  const handleFileChange = (file: File | null) => {
    setSelectedLogoFile(file);
    setValue('logo', file, { shouldValidate: true });
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

      if (selectedLogoFile) {
        formData.append('logo', selectedLogoFile);
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
        reset({
            siteTitle: result.data.siteTitle,
            logo: null,
            themePrimaryColor: result.data.themePrimaryColor,
            themeAccentColor: result.data.themeAccentColor,
            themeBackgroundColor: result.data.themeBackgroundColor,
            darkThemePrimaryColor: result.data.darkThemePrimaryColor,
            darkThemeAccentColor: result.data.darkThemeAccentColor,
            darkThemeBackgroundColor: result.data.darkThemeBackgroundColor,
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

  const renderColorPickerField = (name: keyof SettingsFormValues, label: string) => {
    const formValue = watch(name) as string; // Get current HSL string from form
    const colorForPicker = useMemo(() => hslStringToHslObject(formValue), [formValue]);

    return (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <div className="flex flex-col items-center">
                        <HslColorPicker
                            color={colorForPicker}
                            onChange={(newHslColor) => {
                                field.onChange(hslObjectToHslString(newHslColor));
                            }}
                            className="!w-full !h-auto aspect-square max-w-[280px]"
                        />
                        <Input
                            id={name}
                            value={field.value}
                            onChange={(e) => {
                                field.onChange(e.target.value); // Allow direct HSL string input
                            }}
                            className="mt-2 text-sm text-center w-full max-w-[280px]"
                            placeholder="H S% L%"
                        />
                    </div>
                )}
            />
            {errors[name] && <p className="text-sm text-destructive mt-1 text-center">{(errors[name] as any)?.message}</p>}
        </div>
    );
};


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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Type className="mr-2 h-5 w-5 text-primary/80" />General</CardTitle>
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
                onFileChange={handleFileChange}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary/80" />Theme Colors</CardTitle>
          <CardDescription>
            Customize HSL values for light and dark themes (e.g., <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm text-xs">228 100% 98%</code>).
            Changes apply to <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm text-xs">globals.css</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground/90"><Sun className="mr-2 h-5 w-5 text-yellow-500"/>Light Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
              {renderColorPickerField('themePrimaryColor', 'Primary Color')}
              {renderColorPickerField('themeAccentColor', 'Accent Color')}
              {renderColorPickerField('themeBackgroundColor', 'Background Color')}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground/90"><Moon className="mr-2 h-5 w-5 text-indigo-400"/>Dark Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
              {renderColorPickerField('darkThemePrimaryColor', 'Primary Color')}
              {renderColorPickerField('darkThemeAccentColor', 'Accent Color')}
              {renderColorPickerField('darkThemeBackgroundColor', 'Background Color')}
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

      <CardFooter className="pt-6 border-t border-border justify-end">
         <Button type="submit" className="w-full md:w-auto" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Settings
        </Button>
      </CardFooter>
    </form>
  );
}
