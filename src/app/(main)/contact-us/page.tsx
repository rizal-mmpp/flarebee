
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Mail, MessageSquare, User, Building, Phone, Info, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { ContactFormValues, SiteSettings } from '@/lib/types';
import { submitContactFormAction } from '@/lib/actions/contact.actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  businessName: z.string().optional(),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters.').max(1000, 'Message cannot exceed 1000 characters.'),
});

export default function ContactUsPage() {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoadingSettings(true);
      try {
        const siteSettings = await getSiteSettings();
        setSettings(siteSettings);
      } catch (error) {
        console.error("Failed to fetch site settings for contact page:", error);
        setSettings(DEFAULT_SETTINGS); // Fallback to defaults
      } finally {
        setIsLoadingSettings(false);
      }
    }
    fetchSettings();
  }, []);

  const onSubmit: SubmitHandler<ContactFormValues> = (data) => {
    startSubmitTransition(async () => {
      const result = await submitContactFormAction(data);
      if (result.success) {
        toast({
          title: 'Message Sent!',
          description: result.message,
        });
        reset();
      } else {
        toast({
          title: 'Error Sending Message',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const contactImageUrl = settings?.contactPageImageUrl || 'https://placehold.co/800x1000/EBF4FF/7697A0.png?text=Contact+Us';
  const contactImageAiHint = "abstract contact illustration";
  const siteTitle = settings?.siteTitle || DEFAULT_SETTINGS.siteTitle;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Column: Contact Form */}
        <Card className="w-full max-w-lg mx-auto md:mx-0 shadow-xl border-border/60">
          <CardHeader className="text-center md:text-left">
            <div className="inline-flex justify-center md:justify-start mb-3">
                 <Mail className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">Get in Touch</CardTitle>
            <CardDescription className="text-muted-foreground">
              We&apos;d love to hear from you! Send us a message and we&apos;ll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name" className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Name</Label>
                <Input id="name" {...register('name')} placeholder="Your Full Name" className="mt-1" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="businessName" className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" />Business Name (Optional)</Label>
                <Input id="businessName" {...register('businessName')} placeholder="Your Company's Name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email Address</Label>
                <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="mt-1" />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Phone / WhatsApp (Optional)</Label>
                <Input id="phone" {...register('phone')} placeholder="+62 812 3456 789" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="message" className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />Your Message</Label>
                <Textarea id="message" {...register('message')} rows={5} placeholder="Tell us about your project or inquiry..." className="mt-1" />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Send Message
              </Button>
            </form>
          </CardContent>
           <CardFooter className="text-center text-xs text-muted-foreground pt-4">
            <p>By submitting this form, you agree to our Privacy Policy.</p>
          </CardFooter>
        </Card>

        {/* Right Column: Image & Contact Info */}
        <div className="space-y-8">
          <div className="relative w-full aspect-[4/5] max-w-md mx-auto md:max-w-none rounded-2xl overflow-hidden shadow-2xl border-4 border-card">
             {isLoadingSettings ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <Image
                    src={contactImageUrl}
                    alt={`Contact ${siteTitle}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{objectFit:"cover"}}
                    data-ai-hint={contactImageAiHint}
                    priority
                />
            )}
          </div>
          {settings && !isLoadingSettings && (
            <Card className="bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary"/> Our Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {settings.contactAddress && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 mt-0.5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">{settings.contactAddress}</p>
                  </div>
                )}
                {settings.contactPhone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                    <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="text-muted-foreground hover:text-primary">
                      {settings.contactPhone}
                    </a>
                  </div>
                )}
                {settings.contactEmail && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                     <a href={`mailto:${settings.contactEmail}`} className="text-muted-foreground hover:text-primary">
                       {settings.contactEmail}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Added MapPin icon
import { MapPin } from 'lucide-react';
