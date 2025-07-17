
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
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';

const signupSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});
type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { user, signUpWithEmailPassword, signInWithGoogle, loading } = useAuth();
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const onEmailSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsSubmittingEmail(true);
    await signUpWithEmailPassword(data.email, data.password, data.displayName);
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient Circles */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-40 left-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] xl:max-w-[25%] backdrop-blur-xl bg-card/50 shadow-2xl border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl">Create your RIO Account</CardTitle>
        <CardDescription>Join our community and start creating today!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              {...register('displayName')} 
              placeholder="Your Name" 
              className="mt-1 bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200" 
            />
            {errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              {...register('email')} 
              placeholder="you@example.com" 
              className="mt-1 bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200" 
            />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                {...register('password')} 
                placeholder="•••••••• (min. 6 characters)"
                className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200"
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
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Input 
                id="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                {...register('confirmPassword')} 
                placeholder="••••••••"
                className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmittingEmail || isSubmittingGoogle || loading}>
            {isSubmittingEmail ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            Sign Up with Email
          </Button>
        </form>
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
      </div>
    </div>
  );
}
