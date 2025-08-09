
'use client';

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Send } from 'lucide-react';
import { sendTestEmailAction } from '@/lib/actions/email.actions';

const emailTestSchema = z.object({
  to: z.string().email('Please enter a valid recipient email address.'),
  subject: z.string().min(1, 'Subject is required.'),
  html: z.string().min(1, 'HTML content is required.'),
});

type EmailTestFormValues = z.infer<typeof emailTestSchema>;

export default function EmailTestPage() {
  const { toast } = useToast();
  const [isSending, startSendTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<EmailTestFormValues>({
    resolver: zodResolver(emailTestSchema),
    defaultValues: {
      to: '',
      subject: 'Test Email from RIO Platform',
      html: `<h1>Test Email</h1><p>This is a test email sent from the RIO admin panel to verify the n8n email webhook is working.</p>`,
    },
  });

  const onSubmit: SubmitHandler<EmailTestFormValues> = (data) => {
    startSendTransition(async () => {
      const result = await sendTestEmailAction(data);
      if (result.success) {
        toast({
          title: 'Email Sent!',
          description: `Test email successfully sent to ${data.to}.`,
        });
      } else {
        toast({
          title: 'Error Sending Email',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
          duration: 10000,
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Mail className="mr-3 h-8 w-8 text-primary" />
          n8n Email Webhook Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Send a test email to verify that your n8n webhook setup is correct.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Fill in the details below and click send. This will send a POST request to your configured n8n webhook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="to">Recipient Email *</Label>
              <Input id="to" {...register('to')} placeholder="recipient@example.com" className="mt-1" />
              {errors.to && <p className="text-sm text-destructive mt-1">{errors.to.message}</p>}
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" {...register('subject')} className="mt-1" />
              {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <Label htmlFor="html">HTML Content *</Label>
              <Textarea id="html" {...register('html')} rows={8} className="mt-1 font-mono text-sm" />
              {errors.html && <p className="text-sm text-destructive mt-1">{errors.html.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSending}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Test Email
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
