
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
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmailPassword, signInWithGoogle, loading } = useAuth();
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const onEmailSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsSubmittingEmail(true);
    const result = await signInWithEmailPassword(data.email, data.password);
    // AuthContext handles toast for error/success, useEffect handles redirect
    setIsSubmittingEmail(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmittingGoogle(true);
    await signInWithGoogle();
    // AuthContext handles toast for error/success, useEffect handles redirect
    setIsSubmittingGoogle(false);
  };
  
  if (loading && !user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl">Welcome Back!</CardTitle>
        <CardDescription>Sign in to access your RIO account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmittingEmail || isSubmittingGoogle || loading}>
          {isSubmittingGoogle ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
              <path d="M17.6401 9.20455C17.6401 8.61364 17.5831 8.06818 17.4774 7.54545H9V10.75H13.8437C13.6364 11.6864 13.0001 12.4773 12.0455 13.0682V15.25H14.4774C15.8751 13.9773 16.6819 12.3409 17.1001 10.4091C17.4401 9.95455 17.6401 9.59091 17.6401 9.20455Z" fill="#4285F4"/>
              <path d="M9.00001 18C11.4318 18 13.4773 17.1932 14.7614 15.8182L12.3296 13.6364C11.5227 14.1591 10.4091 14.5227 9.00001 14.5227C6.45455 14.5227 4.27273 12.8409 3.47728 10.6136L1.04546 12.7955C2.36364 15.7045 5.40909 18 9.00001 18Z" fill="#34A853"/>
              <path d="M3.46591 10.6136C3.32955 10.1818 3.25 9.72727 3.25 9.22727C3.25 8.72727 3.32955 8.27273 3.46591 7.84091V5.65909L1.03409 7.84091C0.375 9.09091 0 10.5455 0 12.1136C0 13.6818 0.375 15.1364 1.03409 16.3864L3.46591 14.2045V10.6136Z" fill="#FBBC05"/>
              <path d="M9.00001 3.93182C10.2159 3.93182 11.25 4.36364 12.00001 5.09091L14.2046 2.88636C12.7955 1.48864 10.9091 0.454545 9.00001 0.454545C5.40909 0.454545 2.36364 2.75 1.04546 5.65909L3.47728 7.84091C4.27273 5.61364 6.45455 3.93182 9.00001 3.93182Z" fill="#EA4335"/>
            </svg>
          }
          Sign in with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="mt-1" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                {...register('password')} 
                placeholder="••••••••"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmittingEmail || isSubmittingGoogle || loading}>
            {isSubmittingEmail ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Sign In with Email
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
          Forgot your password?
        </Link>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
