
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});
type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { user, signUpWithEmailPassword, signInWithGoogle, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsSubmitting(true);
    const result = await signUpWithEmailPassword(data.email, data.password, data.displayName);
    if (result.success) {
      // User will be redirected by useEffect
    } else {
      // Error toast is handled by AuthContext
    }
    setIsSubmitting(false);
  };
  
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const success = await signInWithGoogle();
    if (success) {
      // User will be redirected by useEffect
    }
    setIsSubmitting(false);
  };
  
  if (loading && !user) { 
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl">Create your RIO Account</CardTitle>
        <CardDescription>Join our community and start creating today!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" {...register('displayName')} placeholder="Your Name" className="mt-1" />
            {errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="mt-1" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} placeholder="•••••••• (min. 6 characters)" className="mt-1" />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="••••••••" className="mt-1" />
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || loading}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            Sign Up
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with
            </span>
          </div>
        </div>
         <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || loading}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
             <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.68 2.03-3.89 0-7.22-3.11-7.22-7.22s3.33-7.22 7.22-7.22c2.14 0 3.53.88 4.34 1.62l2.33-2.33C18.57.49 16.21 0 12.48 0 5.83 0 0 5.83 0 12.48s5.83 12.48 12.48 12.48c7.05 0 11.97-4.85 11.97-12.16 0-.79-.09-1.34-.2-1.89H12.48z"></path></svg>
          }
          Sign up with Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
