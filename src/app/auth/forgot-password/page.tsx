
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MailLock, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { sendPasswordReset, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    setIsSubmitting(true);
    const result = await sendPasswordReset(data.email);
    if (result.success) {
      setEmailSent(true);
    }
    // Error toast is handled by AuthContext, or success toast for user-not-found case
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full"> {/* Removed shadow-2xl */}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl">Forgot Your Password?</CardTitle>
        <CardDescription>
          {emailSent 
            ? "If an account exists for the email you entered, a password reset link has been sent."
            : "No worries! Enter your email address and we'll send you a link to reset it."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emailSent ? (
          <div className="text-center space-y-4 py-4">
            <MailLock className="mx-auto h-16 w-16 text-primary" />
            <p className="text-muted-foreground">
              Please check your inbox (and spam folder) for the reset link.
            </p>
             <Button asChild variant="outline" className="w-full group">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                  Back to Sign In
                </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="mt-1" />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || loading}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MailLock className="mr-2 h-5 w-5" />}
              Send Reset Link
            </Button>
          </form>
        )}
      </CardContent>
      {!emailSent && (
        <CardFooter className="flex justify-center text-sm">
          <Link href="/auth/login" className="font-medium text-primary hover:underline flex items-center group">
             <ArrowLeft className="mr-1 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Sign In
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
