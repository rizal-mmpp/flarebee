'use client';

import { useTransition } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, PlusCircle, MessageSquareText, TestTube2, AlertCircle } from 'lucide-react';
import { sendWhatsAppMessageAction, createWhatsAppTemplateAction } from '@/lib/actions/whatsapp.actions';

// Schema for the "Send Message" form
const sendMessageSchema = z.object({
  recipientNumber: z.string().min(10, 'A valid phone number is required.'),
  messageText: z.string().min(1, 'Message cannot be empty.'),
});
type SendMessageFormValues = z.infer<typeof sendMessageSchema>;

// Schema for the "Create Template" form
const createTemplateSchema = z.object({
  templateName: z.string()
    .min(1, 'Template name is required.')
    .regex(/^[a-z_]+$/, 'Use only lowercase letters and underscores (e.g., hello_world).'),
  languageCode: z.string().min(2, 'Language code is required (e.g., en_US).'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  bodyText: z.string().min(1, 'Body text is required.'),
});
type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;

export default function WhatsAppTestPage() {
  const { toast } = useToast();
  const [isSendingMessage, startSendMessageTransition] = useTransition();
  const [isCreatingTemplate, startCreateTemplateTransition] = useTransition();

  const sendMessageForm = useForm<SendMessageFormValues>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { recipientNumber: '', messageText: 'Hello from the RIO Platform! This is a test message.' },
  });

  const createTemplateForm = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: { templateName: '', languageCode: 'en_US', category: 'UTILITY', bodyText: 'Hello {{1}}, your order {{2}} has been confirmed.' },
  });

  const onSendMessageSubmit: SubmitHandler<SendMessageFormValues> = (data) => {
    startSendMessageTransition(async () => {
      const result = await sendWhatsAppMessageAction(data);
      if (result.success) {
        toast({ title: 'Message Sent!', description: `Test message successfully sent to ${data.recipientNumber}.` });
      } else {
        toast({ title: 'Error Sending Message', description: result.error, variant: 'destructive' });
      }
    });
  };
  
  const onCreateTemplateSubmit: SubmitHandler<CreateTemplateFormValues> = (data) => {
    startCreateTemplateTransition(async () => {
        const result = await createWhatsAppTemplateAction(data);
        if(result.success) {
             toast({ title: 'Template Creation Submitted!', description: `Template "${data.templateName}" submitted for review.` });
        } else {
            toast({ title: 'Error Creating Template', description: result.error, variant: 'destructive' });
        }
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <TestTube2 className="mr-3 h-8 w-8 text-primary" />
          WhatsApp API Test Page
        </h1>
        <p className="text-muted-foreground mt-1">
          Use these forms to test WhatsApp functionality for Meta's review process.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Send Message Card */}
        <Card>
          <form onSubmit={sendMessageForm.handleSubmit(onSendMessageSubmit)}>
            <CardHeader>
              <CardTitle>1. Send Test Message</CardTitle>
              <CardDescription>
                Send a simple text message to a WhatsApp number. Include the country code without '+' or '00'.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipientNumber">Recipient Phone Number</Label>
                <Input id="recipientNumber" {...sendMessageForm.register('recipientNumber')} placeholder="e.g., 6281234567890" className="mt-1" />
                {sendMessageForm.formState.errors.recipientNumber && <p className="text-sm text-destructive mt-1">{sendMessageForm.formState.errors.recipientNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="messageText">Message Content</Label>
                <Textarea id="messageText" {...sendMessageForm.register('messageText')} rows={4} className="mt-1" />
                {sendMessageForm.formState.errors.messageText && <p className="text-sm text-destructive mt-1">{sendMessageForm.formState.errors.messageText.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSendingMessage}>
                {isSendingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Message
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Create Template Card */}
        <Card>
          <form onSubmit={createTemplateForm.handleSubmit(onCreateTemplateSubmit)}>
            <CardHeader>
              <CardTitle>2. Create Message Template</CardTitle>
              <CardDescription>
                Submit a new message template for review. Use double curly braces for variables, e.g.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input id="templateName" {...createTemplateForm.register('templateName')} placeholder="e.g., order_confirmation" className="mt-1" />
                {createTemplateForm.formState.errors.templateName && <p className="text-sm text-destructive mt-1">{createTemplateForm.formState.errors.templateName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="languageCode">Language</Label>
                    <Input id="languageCode" {...createTemplateForm.register('languageCode')} placeholder="e.g., en_US, id" className="mt-1" />
                    {createTemplateForm.formState.errors.languageCode && <p className="text-sm text-destructive mt-1">{createTemplateForm.formState.errors.languageCode.message}</p>}
                 </div>
                 <div>
                    <Label htmlFor="category">Category</Label>
                    <Controller
                        name="category"
                        control={createTemplateForm.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="category" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MARKETING">Marketing</SelectItem>
                                    <SelectItem value="UTILITY">Utility</SelectItem>
                                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {createTemplateForm.formState.errors.category && <p className="text-sm text-destructive mt-1">{createTemplateForm.formState.errors.category.message}</p>}
                 </div>
              </div>
              <div>
                <Label htmlFor="bodyText">Body Text</Label>
                <Textarea id="bodyText" {...createTemplateForm.register('bodyText')} rows={4} className="mt-1" placeholder="Your delivery of {{1}} is on its way."/>
                {createTemplateForm.formState.errors.bodyText && <p className="text-sm text-destructive mt-1">{createTemplateForm.formState.errors.bodyText.message}</p>}
              </div>
            </CardContent>
             <CardFooter>
              <Button type="submit" disabled={isCreatingTemplate}>
                {isCreatingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Create Template
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
